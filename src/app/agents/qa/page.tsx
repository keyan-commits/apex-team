"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ProvenanceValue =
  | "claude"
  | "user"
  | "external"
  | { provenance: string; sourceUrl: string };

interface AgentProfile {
  role: string;
  title: string;
  accent: string;
  currentModel: string;
  skillsMarkdown: string;
  skillsProvenance: Record<string, ProvenanceValue>;
  systemPromptSummary: string;
}

type RunStatus = "idle" | "running" | "pass" | "fail";

function parseSkillSections(md: string): Array<{ heading: string; body: string }> {
  const result: Array<{ heading: string; body: string }> = [];
  let cur: { heading: string; lines: string[] } | null = null;
  for (const line of md.split("\n")) {
    if (line.startsWith("### ")) {
      if (cur) result.push({ heading: cur.heading, body: cur.lines.join("\n").trim() });
      cur = { heading: line.slice(4).trim(), lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  if (cur) result.push({ heading: cur.heading, body: cur.lines.join("\n").trim() });
  return result;
}

function provLabel(p: ProvenanceValue): string {
  if (typeof p === "string") return p;
  return p.provenance ?? "external";
}

function provUrl(p: ProvenanceValue): string | null {
  if (typeof p === "object" && "sourceUrl" in p) return p.sourceUrl;
  return null;
}

function groupTestFiles(paths: string[]): Array<{ dir: string; files: string[] }> {
  const map = new Map<string, string[]>();
  for (const p of paths) {
    const parts = p.split("/");
    const dir = parts.slice(0, -1).join("/");
    if (!map.has(dir)) map.set(dir, []);
    map.get(dir)!.push(p);
  }
  return Array.from(map.entries()).map(([dir, files]) => ({ dir, files }));
}

export default function QaAgentPage() {
  const role = "qa";

  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const [issueTitle, setIssueTitle] = useState("");
  const [issueBody, setIssueBody] = useState("");
  const [issueState, setIssueState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [issueResult, setIssueResult] = useState<{ url: string; number: number } | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);

  const [testFiles, setTestFiles] = useState<string[]>([]);
  const [testFilter, setTestFilter] = useState("");
  const [runStatus, setRunStatus] = useState<Record<string, RunStatus>>({});
  const [runOutput, setRunOutput] = useState<Record<string, string>>({});
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    fetch("/api/agent/qa", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<AgentProfile>;
      })
      .then(setProfile)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    fetch("/api/qa/run-test", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ tests: string[] }>)
      .then(({ tests }) => setTestFiles(tests))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [runOutput]);

  const toggleSection = (heading: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(heading)) next.delete(heading);
      else next.add(heading);
      return next;
    });
  };

  const runTest = async (testPath: string) => {
    if (runStatus[testPath] === "running") {
      abortRef.current?.abort();
      setRunStatus((s) => ({ ...s, [testPath]: "idle" }));
      setActiveTest(null);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setRunStatus((s) => ({ ...s, [testPath]: "running" }));
    setRunOutput((s) => ({ ...s, [testPath]: "" }));
    setActiveTest(testPath);

    try {
      const res = await fetch("/api/qa/run-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testPath }),
        signal: ctrl.signal,
      });

      if (!res.body) {
        setRunStatus((s) => ({ ...s, [testPath]: "fail" }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      let accumulated = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });

        const chunks = sseBuffer.split("\n\n");
        sseBuffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          let event: { type: string; text?: string; message?: string };
          try {
            event = JSON.parse(dataLine.slice(6)) as typeof event;
          } catch {
            continue;
          }
          if (event.type === "delta" && event.text) {
            accumulated += event.text;
            setRunOutput((s) => ({ ...s, [testPath]: accumulated }));
          } else if (event.type === "done") {
            const failed = /\bfailed\b/i.test(accumulated);
            setRunStatus((s) => ({ ...s, [testPath]: failed ? "fail" : "pass" }));
          } else if (event.type === "error") {
            setRunStatus((s) => ({ ...s, [testPath]: "fail" }));
            if (event.message) {
              accumulated += `\nError: ${event.message}`;
              setRunOutput((s) => ({ ...s, [testPath]: accumulated }));
            }
          }
        }
      }
    } catch (e: unknown) {
      if ((e as Error)?.name === "AbortError") return;
      setRunStatus((s) => ({ ...s, [testPath]: "fail" }));
    }
  };

  const fileIssue = async () => {
    if (!issueTitle.trim() || !issueBody.trim()) return;
    setIssueState("sending");
    setIssueError(null);
    try {
      const res = await fetch(`/api/agent/${encodeURIComponent(role)}/improvement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: issueTitle.trim(), body: issueBody.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { url: string; number: number };
      setIssueResult(data);
      setIssueState("success");
      setIssueTitle("");
      setIssueBody("");
    } catch (e: unknown) {
      setIssueError(e instanceof Error ? e.message : String(e));
      setIssueState("error");
    }
  };

  const filteredFiles = testFilter
    ? testFiles.filter((f) => f.toLowerCase().includes(testFilter.toLowerCase()))
    : testFiles;

  const testGroups = groupTestFiles(filteredFiles);
  const sections = profile ? parseSkillSections(profile.skillsMarkdown) : [];

  if (loadError) {
    return (
      <div className="page">
        <nav className="breadcrumb">
          <Link href="/" className="back-link">← Team</Link>
          <span className="sep">/</span>
          <Link href="/dashboard" className="back-link">Dashboard</Link>
        </nav>
        <div className="error-banner">{loadError}</div>
        <style jsx>{`
          .page { max-width: 800px; margin: 0 auto; padding: 16px 12px; }
          .breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; font-size: 12px; }
          .back-link { color: var(--text-dim); text-decoration: none; font-size: 12px; }
          .sep { color: var(--border); }
          .error-banner { padding: 10px 12px; border-radius: 6px; border: 1px solid var(--accent-qa); color: var(--accent-qa); background: color-mix(in srgb, var(--accent-qa) 8%, var(--surface)); font-size: 13px; }
        `}</style>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <div className="loading">Loading…</div>
        <style jsx>{`
          .page { max-width: 800px; margin: 0 auto; padding: 40px 12px; text-align: center; }
          .loading { font-size: 13px; color: var(--text-dim); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page">
      <nav className="breadcrumb">
        <Link href="/" className="back-link">← Team</Link>
        <span className="sep">/</span>
        <Link href="/dashboard" className="back-link">Dashboard</Link>
        <span className="sep">/</span>
        <span className="crumb-current">{profile.title}</span>
      </nav>

      <section className="header-card hc-qa">
        <div className="header-row">
          <h1 className="role-title">{profile.title}</h1>
          <span className="role-pill rp-qa">{profile.role}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Model</span>
          <code className="meta-value">{profile.currentModel}</code>
        </div>
        {profile.systemPromptSummary && (
          <p className="summary">{profile.systemPromptSummary}…</p>
        )}
      </section>

      <section className="content-section">
        <h2 className="section-h">
          Skills <span className="section-count">({sections.length})</span>
        </h2>
        {sections.length === 0 && <p className="empty-msg">No skill sections defined.</p>}
        {sections.map(({ heading, body }) => {
          const prov = profile.skillsProvenance[heading] ?? "claude";
          const label = provLabel(prov);
          const url = provUrl(prov);
          const expanded = expandedSections.has(heading);
          return (
            <div key={heading} className="skill-block">
              <button
                className="skill-hd"
                onClick={() => toggleSection(heading)}
                aria-expanded={expanded}
              >
                <span className="chevron" aria-hidden="true">{expanded ? "▾" : "▸"}</span>
                <span className="skill-name">{heading}</span>
                <span className={`prov prov-${label}`}>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="prov-link"
                      onClick={(e) => e.stopPropagation()}
                    >{label}</a>
                  ) : label}
                </span>
              </button>
              {expanded && body && (
                <div className="skill-body prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="content-section" aria-label="Tests">
        <h2 className="section-h">
          Tests <span className="section-count">({filteredFiles.length})</span>
        </h2>
        <div className="test-search-row">
          <input
            className="test-search"
            type="search"
            placeholder="Filter tests…"
            value={testFilter}
            onChange={(e) => setTestFilter(e.target.value)}
            aria-label="Filter tests"
          />
        </div>

        {testFiles.length === 0 ? (
          <p className="empty-msg">No test files found under tests/.</p>
        ) : filteredFiles.length === 0 ? (
          <p className="empty-msg">No tests match &ldquo;{testFilter}&rdquo;.</p>
        ) : (
          testGroups.map(({ dir, files }) => (
            <div key={dir} className="test-group">
              <div className="test-group-hd" aria-label={`Directory: ${dir}`}>{dir}/</div>
              {files.map((path) => {
                const status = runStatus[path] ?? "idle";
                const fileName = path.split("/").pop() ?? path;
                const isActive = activeTest === path;
                return (
                  <div
                    key={path}
                    className={`test-row ${isActive ? "test-row-active" : ""}`}
                    data-testid="test-row"
                  >
                    <span className="test-path" title={path}>{fileName}</span>
                    <span
                      className={`run-badge rb-${status}`}
                      aria-label={`Status: ${status}`}
                    >
                      {status === "idle"
                        ? "–"
                        : status === "running"
                        ? "running…"
                        : status}
                    </span>
                    <button
                      className={`run-btn${status === "running" ? " run-btn-stop" : ""}`}
                      onClick={() => { void runTest(path); }}
                      aria-label={status === "running" ? `Stop ${fileName}` : `Run ${fileName}`}
                    >
                      {status === "running" ? "■ Stop" : "▶ Run"}
                    </button>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {activeTest && (
          <div className="output-panel" data-testid="output-panel">
            <div className="output-hd">
              <span className="output-label">{activeTest}</span>
              <button
                className="output-close"
                onClick={() => setActiveTest(null)}
                aria-label="Close output panel"
              >✕</button>
            </div>
            <pre
              ref={outputRef}
              className="output-pre"
              aria-live="polite"
              aria-label="Test output"
            >{runOutput[activeTest] ?? ""}</pre>
          </div>
        )}
      </section>

      <section className="content-section">
        <h2 className="section-h">Suggest an improvement</h2>
        <p className="hint">File a skill-proposal issue for this agent on GitHub.</p>

        {issueState === "success" && issueResult && (
          <div className="success-banner">
            Filed{" "}
            <a href={issueResult.url} target="_blank" rel="noreferrer" className="issue-link">
              #{issueResult.number}
            </a>.{" "}
            <button
              className="link-btn"
              onClick={() => { setIssueState("idle"); setIssueResult(null); }}
            >File another</button>
          </div>
        )}

        {issueState !== "success" && (
          <div className="improve-form">
            <input
              className="f-input"
              placeholder="Issue title"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              disabled={issueState === "sending"}
              aria-label="Issue title"
            />
            <textarea
              className="f-textarea"
              placeholder="Describe the improvement (what skill is missing, why it would help)…"
              value={issueBody}
              onChange={(e) => setIssueBody(e.target.value)}
              rows={4}
              disabled={issueState === "sending"}
              aria-label="Issue body"
            />
            {issueState === "error" && issueError && (
              <div className="error-banner">{issueError}</div>
            )}
            <button
              className="file-btn hc-qa"
              onClick={() => { void fileIssue(); }}
              disabled={issueState === "sending" || !issueTitle.trim() || !issueBody.trim()}
            >
              {issueState === "sending" ? "Filing…" : "File issue"}
            </button>
          </div>
        )}
      </section>

      <style jsx>{`
        .page {
          max-width: 800px;
          margin: 0 auto;
          padding: 16px 12px 40px;
          min-height: 100vh;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 16px;
          font-size: 12px;
        }
        .back-link { color: var(--text-dim); text-decoration: none; }
        .back-link:hover { color: var(--text); text-decoration: underline; }
        .back-link:focus-visible { outline: 1px solid var(--accent-po); border-radius: 2px; outline-offset: 2px; }
        .sep { color: var(--border); }
        .crumb-current { color: var(--text); font-weight: 600; }

        .header-card {
          padding: 16px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface);
          margin-bottom: 20px;
        }
        .hc-qa { border-color: color-mix(in srgb, var(--accent-qa) 35%, var(--border)); background: color-mix(in srgb, var(--accent-qa) 4%, var(--surface)); }

        .header-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
        .role-title { font-size: 20px; font-weight: 700; margin: 0; }
        .role-pill {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 2px 8px;
          border-radius: 99px;
          border: 1px solid currentColor;
          font-family: ui-monospace, monospace;
        }
        .rp-qa { color: var(--accent-qa); }

        .meta-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .meta-label { font-size: 11px; color: var(--text-dim); }
        .meta-value {
          font-family: ui-monospace, monospace;
          font-size: 11px;
          color: var(--text);
          background: var(--surface-2);
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid var(--border);
        }
        .summary { font-size: 12px; color: var(--text-dim); margin: 0; line-height: 1.55; }

        .content-section { margin-bottom: 28px; }
        .section-h {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin: 0 0 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .section-count { font-weight: 400; letter-spacing: 0; text-transform: none; font-size: 10px; }

        .skill-block {
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 6px;
        }
        .skill-hd {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--surface-2);
          border: none;
          cursor: pointer;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }
        .skill-hd:hover { background: color-mix(in srgb, var(--border) 40%, var(--surface-2)); }
        .skill-hd:focus-visible { outline: 2px solid var(--accent-qa); outline-offset: -2px; }
        .chevron { font-size: 10px; color: var(--text-dim); flex-shrink: 0; width: 12px; }
        .skill-name { flex: 1; min-width: 0; }
        .prov {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 1px 6px;
          border-radius: 99px;
          border: 1px solid currentColor;
          font-family: ui-monospace, monospace;
          flex-shrink: 0;
        }
        .prov-claude { color: var(--text-dim); border-color: var(--border); }
        .prov-user { color: var(--accent-ui); }
        .prov-external { color: var(--accent-ba); }
        .prov-link { color: inherit; text-decoration: none; }
        .prov-link:hover { text-decoration: underline; }

        .skill-body {
          padding: 12px 16px;
          background: var(--surface);
          border-top: 1px solid var(--border);
          font-size: 12px;
          line-height: 1.6;
          max-height: 320px;
          overflow-y: auto;
        }
        .skill-body :global(p) { margin: 0 0 6px; }
        .skill-body :global(p:last-child) { margin-bottom: 0; }
        .skill-body :global(ul), .skill-body :global(ol) { margin: 4px 0 6px; padding-left: 20px; }
        .skill-body :global(li) { margin: 2px 0; }
        .skill-body :global(code) {
          font-family: ui-monospace, monospace;
          font-size: 11px;
          background: var(--surface-2);
          padding: 1px 4px;
          border-radius: 3px;
          border: 1px solid var(--border);
        }
        .skill-body :global(a) { color: var(--accent-po); }
        .skill-body :global(strong) { font-weight: 700; }

        /* Tests section */
        .test-search-row { margin-bottom: 10px; }
        .test-search {
          width: 100%;
          max-width: 320px;
          box-sizing: border-box;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-size: 12px;
          font-family: inherit;
        }
        .test-search:focus { outline: 2px solid var(--accent-qa); outline-offset: 1px; border-color: transparent; }

        .test-group { margin-bottom: 8px; }
        .test-group-hd {
          font-family: ui-monospace, monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: var(--text-dim);
          text-transform: uppercase;
          padding: 4px 0 4px 8px;
          border-left: 2px solid color-mix(in srgb, var(--accent-qa) 40%, var(--border));
          margin-bottom: 2px;
        }

        .test-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid transparent;
          margin-bottom: 2px;
          background: var(--surface);
        }
        .test-row:hover { border-color: var(--border); background: var(--surface-2); }
        .test-row-active { border-color: color-mix(in srgb, var(--accent-qa) 30%, var(--border)); background: color-mix(in srgb, var(--accent-qa) 4%, var(--surface)); }

        .test-path {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: ui-monospace, monospace;
          font-size: 12px;
          color: var(--text);
        }

        .run-badge {
          font-family: ui-monospace, monospace;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 99px;
          border: 1px solid var(--border);
          flex-shrink: 0;
          min-width: 52px;
          text-align: center;
        }
        .rb-idle { color: var(--text-dim); border-color: var(--border); }
        .rb-running { color: var(--accent-ba); border-color: var(--accent-ba); }
        .rb-pass { color: var(--status-green); border-color: var(--status-green); }
        .rb-fail { color: var(--accent-qa); border-color: var(--accent-qa); }

        .run-btn {
          flex-shrink: 0;
          padding: 4px 10px;
          border-radius: 5px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          font-family: ui-monospace, monospace;
        }
        .run-btn:hover { background: color-mix(in srgb, var(--accent-qa) 12%, var(--surface-2)); border-color: var(--accent-qa); }
        .run-btn:focus-visible { outline: 2px solid var(--accent-qa); outline-offset: 2px; }
        .run-btn-stop { color: var(--accent-qa); border-color: var(--accent-qa); }

        .output-panel {
          margin-top: 12px;
          border: 1px solid color-mix(in srgb, var(--accent-qa) 30%, var(--border));
          border-radius: 8px;
          overflow: hidden;
          background: var(--surface);
        }
        .output-hd {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          background: color-mix(in srgb, var(--accent-qa) 8%, var(--surface-2));
          border-bottom: 1px solid color-mix(in srgb, var(--accent-qa) 20%, var(--border));
        }
        .output-label {
          font-family: ui-monospace, monospace;
          font-size: 11px;
          color: var(--text-dim);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .output-close {
          flex-shrink: 0;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-dim);
          font-size: 11px;
          padding: 2px 4px;
          border-radius: 3px;
          line-height: 1;
        }
        .output-close:hover { color: var(--text); background: var(--border); }
        .output-close:focus-visible { outline: 2px solid var(--accent-qa); outline-offset: 1px; }
        .output-pre {
          margin: 0;
          padding: 10px 12px;
          font-family: ui-monospace, monospace;
          font-size: 11px;
          line-height: 1.55;
          white-space: pre-wrap;
          word-break: break-all;
          overflow-y: auto;
          max-height: 360px;
          color: var(--text);
          background: var(--surface);
        }

        /* Improvements */
        .hint { font-size: 12px; color: var(--text-dim); margin: 0 0 10px; }
        .improve-form { display: flex; flex-direction: column; gap: 8px; }
        .f-input {
          width: 100%;
          box-sizing: border-box;
          padding: 7px 10px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-size: 13px;
          font-family: inherit;
        }
        .f-input:focus { outline: 2px solid var(--accent-qa); outline-offset: 1px; border-color: transparent; }
        .f-textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 7px 10px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-size: 12px;
          font-family: inherit;
          resize: vertical;
        }
        .f-textarea:focus { outline: 2px solid var(--accent-qa); outline-offset: 1px; border-color: transparent; }
        .file-btn {
          align-self: flex-start;
          padding: 7px 20px;
          border-radius: 6px;
          border: 1px solid color-mix(in srgb, var(--accent-qa) 35%, var(--border));
          background: color-mix(in srgb, var(--accent-qa) 14%, var(--surface));
          color: var(--text);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }
        .file-btn:hover { background: color-mix(in srgb, var(--accent-qa) 24%, var(--surface)); }
        .file-btn:focus-visible { outline: 2px solid var(--accent-qa); outline-offset: 2px; }
        .file-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .error-banner {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          border: 1px solid var(--accent-qa);
          color: var(--accent-qa);
          background: color-mix(in srgb, var(--accent-qa) 8%, var(--surface));
        }
        .success-banner {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          border: 1px solid color-mix(in srgb, var(--accent-ba) 50%, var(--border));
          color: var(--text);
          background: color-mix(in srgb, var(--accent-ba) 8%, var(--surface));
        }
        .issue-link { color: var(--accent-po); text-decoration: underline; }
        .link-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--accent-po);
          text-decoration: underline;
          font-size: 12px;
          padding: 0;
        }
        .link-btn:focus-visible { outline: 1px solid var(--accent-po); border-radius: 2px; }
        .empty-msg { font-size: 12px; color: var(--text-dim); margin: 4px 0; }
      `}</style>
    </div>
  );
}
