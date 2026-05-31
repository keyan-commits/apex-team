"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function AgentProfilePage() {
  const params = useParams<{ role: string }>();
  const role = params?.role ?? "";

  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const [issueTitle, setIssueTitle] = useState("");
  const [issueBody, setIssueBody] = useState("");
  const [issueState, setIssueState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [issueResult, setIssueResult] = useState<{ url: string; number: number } | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);

  useEffect(() => {
    if (!role) return;
    fetch(`/api/agent/${encodeURIComponent(role)}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<AgentProfile>;
      })
      .then(setProfile)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : String(e)));
  }, [role]);

  const toggleSection = (heading: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(heading)) next.delete(heading); else next.add(heading);
      return next;
    });
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

      {/* Header card */}
      <section className={`header-card hc-${profile.accent}`}>
        <div className="header-row">
          <h1 className="role-title">{profile.title}</h1>
          <span className={`role-pill rp-${profile.accent}`}>{profile.role}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Model</span>
          <code className="meta-value">{profile.currentModel}</code>
        </div>
        {profile.systemPromptSummary && (
          <p className="summary">{profile.systemPromptSummary}…</p>
        )}
      </section>

      {/* Skills */}
      <section className="content-section">
        <h2 className="section-h">Skills <span className="section-count">({sections.length})</span></h2>
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
                  {url
                    ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="prov-link"
                        onClick={(e) => e.stopPropagation()}
                      >{label}</a>
                    )
                    : label}
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

      {/* Improvements */}
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
              className={`file-btn hc-${profile.accent}`}
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
          max-width: 800px; margin: 0 auto; padding: 16px 12px 40px;
          min-height: 100vh;
        }
        .breadcrumb {
          display: flex; align-items: center; gap: 6px; margin-bottom: 16px; font-size: 12px;
        }
        .back-link { color: var(--text-dim); text-decoration: none; }
        .back-link:hover { color: var(--text); text-decoration: underline; }
        .back-link:focus-visible { outline: 1px solid var(--accent-po); border-radius: 2px; outline-offset: 2px; }
        .sep { color: var(--border); }
        .crumb-current { color: var(--text); font-weight: 600; }

        .header-card {
          padding: 16px; border-radius: 10px; border: 1px solid var(--border);
          background: var(--surface); margin-bottom: 20px;
        }
        .hc-po { border-color: color-mix(in srgb, var(--accent-po) 35%, var(--border)); background: color-mix(in srgb, var(--accent-po) 4%, var(--surface)); }
        .hc-ba { border-color: color-mix(in srgb, var(--accent-ba) 35%, var(--border)); background: color-mix(in srgb, var(--accent-ba) 4%, var(--surface)); }
        .hc-arch { border-color: color-mix(in srgb, var(--accent-arch) 35%, var(--border)); background: color-mix(in srgb, var(--accent-arch) 4%, var(--surface)); }
        .hc-ui { border-color: color-mix(in srgb, var(--accent-ui) 35%, var(--border)); background: color-mix(in srgb, var(--accent-ui) 4%, var(--surface)); }
        .hc-be { border-color: color-mix(in srgb, var(--accent-be) 35%, var(--border)); background: color-mix(in srgb, var(--accent-be) 4%, var(--surface)); }
        .hc-qa { border-color: color-mix(in srgb, var(--accent-qa) 35%, var(--border)); background: color-mix(in srgb, var(--accent-qa) 4%, var(--surface)); }
        .hc-ops { border-color: color-mix(in srgb, var(--accent-ops) 35%, var(--border)); background: color-mix(in srgb, var(--accent-ops) 4%, var(--surface)); }
        .hc-uxd { border-color: color-mix(in srgb, var(--accent-uxd) 35%, var(--border)); background: color-mix(in srgb, var(--accent-uxd) 4%, var(--surface)); }

        .header-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
        .role-title { font-size: 20px; font-weight: 700; margin: 0; }
        .role-pill {
          font-size: 10px; font-weight: 700; letter-spacing: 0.04em; padding: 2px 8px;
          border-radius: 99px; border: 1px solid currentColor;
          font-family: ui-monospace, monospace;
        }
        .rp-po { color: var(--accent-po); }
        .rp-ba { color: var(--accent-ba); }
        .rp-arch { color: var(--accent-arch); }
        .rp-ui { color: var(--accent-ui); }
        .rp-be { color: var(--accent-be); }
        .rp-qa { color: var(--accent-qa); }
        .rp-ops { color: var(--accent-ops); }
        .rp-uxd { color: var(--accent-uxd); }

        .meta-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .meta-label { font-size: 11px; color: var(--text-dim); }
        .meta-value {
          font-family: ui-monospace, monospace; font-size: 11px; color: var(--text);
          background: var(--surface-2); padding: 1px 6px;
          border-radius: 4px; border: 1px solid var(--border);
        }
        .summary { font-size: 12px; color: var(--text-dim); margin: 0; line-height: 1.55; }

        .content-section { margin-bottom: 28px; }
        .section-h {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--text-dim); margin: 0 0 10px; display: flex; align-items: center; gap: 6px;
        }
        .section-count { font-weight: 400; letter-spacing: 0; text-transform: none; font-size: 10px; }

        .skill-block {
          border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 6px;
        }
        .skill-hd {
          width: 100%; display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; background: var(--surface-2); border: none;
          cursor: pointer; text-align: left; font-size: 13px; font-weight: 600; color: var(--text);
        }
        .skill-hd:hover { background: color-mix(in srgb, var(--border) 40%, var(--surface-2)); }
        .skill-hd:focus-visible { outline: 2px solid var(--accent-po); outline-offset: -2px; }
        .chevron { font-size: 10px; color: var(--text-dim); flex-shrink: 0; width: 12px; }
        .skill-name { flex: 1; min-width: 0; }
        .prov {
          font-size: 9px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
          padding: 1px 6px; border-radius: 99px; border: 1px solid currentColor;
          font-family: ui-monospace, monospace; flex-shrink: 0;
        }
        .prov-claude { color: var(--text-dim); border-color: var(--border); }
        .prov-user { color: var(--accent-ui); }
        .prov-external { color: var(--accent-ba); }
        .prov-link { color: inherit; text-decoration: none; }
        .prov-link:hover { text-decoration: underline; }

        .skill-body {
          padding: 12px 16px; background: var(--surface); border-top: 1px solid var(--border);
          font-size: 12px; line-height: 1.6; max-height: 320px; overflow-y: auto;
        }
        .skill-body :global(p) { margin: 0 0 6px; }
        .skill-body :global(p:last-child) { margin-bottom: 0; }
        .skill-body :global(ul), .skill-body :global(ol) { margin: 4px 0 6px; padding-left: 20px; }
        .skill-body :global(li) { margin: 2px 0; }
        .skill-body :global(code) {
          font-family: ui-monospace, monospace; font-size: 11px;
          background: var(--surface-2); padding: 1px 4px; border-radius: 3px;
          border: 1px solid var(--border);
        }
        .skill-body :global(a) { color: var(--accent-po); }
        .skill-body :global(strong) { font-weight: 700; }

        .hint { font-size: 12px; color: var(--text-dim); margin: 0 0 10px; }
        .improve-form { display: flex; flex-direction: column; gap: 8px; }
        .f-input {
          width: 100%; box-sizing: border-box; padding: 7px 10px; border-radius: 6px;
          border: 1px solid var(--border); background: var(--surface-2); color: var(--text);
          font-size: 13px; font-family: inherit;
        }
        .f-input:focus { outline: 2px solid var(--accent-po); outline-offset: 1px; border-color: transparent; }
        .f-textarea {
          width: 100%; box-sizing: border-box; padding: 7px 10px; border-radius: 6px;
          border: 1px solid var(--border); background: var(--surface-2); color: var(--text);
          font-size: 12px; font-family: inherit; resize: vertical;
        }
        .f-textarea:focus { outline: 2px solid var(--accent-po); outline-offset: 1px; border-color: transparent; }
        .file-btn {
          align-self: flex-start; padding: 7px 20px; border-radius: 6px;
          border: 1px solid var(--border);
          background: color-mix(in srgb, var(--accent-po) 18%, var(--surface));
          color: var(--text); font-weight: 600; font-size: 13px; cursor: pointer;
        }
        .file-btn:hover { background: color-mix(in srgb, var(--accent-po) 28%, var(--surface)); }
        .file-btn:focus-visible { outline: 2px solid var(--accent-po); outline-offset: 2px; }
        .file-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .error-banner {
          padding: 8px 12px; border-radius: 6px; font-size: 12px;
          border: 1px solid var(--accent-qa); color: var(--accent-qa);
          background: color-mix(in srgb, var(--accent-qa) 8%, var(--surface));
        }
        .success-banner {
          padding: 8px 12px; border-radius: 6px; font-size: 12px;
          border: 1px solid color-mix(in srgb, var(--accent-ba) 50%, var(--border));
          color: var(--text);
          background: color-mix(in srgb, var(--accent-ba) 8%, var(--surface));
        }
        .issue-link { color: var(--accent-po); text-decoration: underline; }
        .link-btn {
          background: none; border: none; cursor: pointer;
          color: var(--accent-po); text-decoration: underline; font-size: 12px; padding: 0;
        }
        .link-btn:focus-visible { outline: 1px solid var(--accent-po); border-radius: 2px; }
        .empty-msg { font-size: 12px; color: var(--text-dim); margin: 4px 0; }
      `}</style>
    </div>
  );
}
