"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import type {
  AccentKey,
  AgentConfig,
  ChatMessage,
  Provider,
  RoleId,
  TeamRoleId,
} from "@/types";
import { MessageBubble } from "./MessageBubble";
import { AgentStatePanel } from "./AgentStatePanel";

interface Props {
  role: RoleId;
  title: string;
  accent: AccentKey;
  config: AgentConfig;
  onConfigChange: (cfg: AgentConfig) => void;
  messages: ChatMessage[];
  pendingDraft: string | null;
  busy: boolean;
  status: string | null;
  handoffDoc: string;
  handoffDocUpdatedAt: number;
  /** Pending inbox count. 0 for the PO (no inbox concept). */
  inboxCount: number;
  /** Pane sends user message to its own role. */
  onSend: (text: string, target: RoleId) => void;
  /** Process inbox button — only meaningful when inboxCount > 0. */
  onProcessInbox?: () => void;
  onEditHandoffDoc: (next: string) => Promise<void> | void;
  /** CSS max-height for the expanded pane. Defaults to "min(560px, 65vh)". PO passes "min(420px, 48vh)". */
  maxHeight?: string;
}

const PROVIDER_LABEL: Record<Provider, string> = {
  claude: "Claude",
  gemini: "Gemini",
  groq: "Groq",
};

const KNOWN_MODELS = [
  { label: "Claude Opus 4.8",    value: "claude-opus-4-8" },
  { label: "Claude Sonnet 4.6",  value: "claude-sonnet-4-6" },
  { label: "Claude Haiku 4.5",   value: "claude-haiku-4-5-20251001" },
  { label: "Gemini 2.5 Flash",   value: "gemini-2.5-flash" },
  { label: "Llama 3.3 70B",      value: "llama-3.3-70b-versatile" },
  { label: "Other…",        value: "__other__" },
] as const;

const KNOWN_MODEL_VALUES = new Set<string>(
  KNOWN_MODELS.filter((m) => m.value !== "__other__").map((m) => m.value),
);

export function AgentPane({
  role,
  title,
  accent,
  config,
  onConfigChange,
  messages,
  pendingDraft,
  busy,
  status,
  handoffDoc,
  handoffDocUpdatedAt,
  inboxCount,
  onSend,
  onProcessInbox,
  onEditHandoffDoc,
  maxHeight = "min(560px, 65vh)",
}: Props) {
  const [input, setInput] = useState("");
  const [isOther, setIsOther] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [activeSec, setActiveSec] = useState(0);
  const [folded, setFolded] = useState(false);
  const [errorExpanded, setErrorExpanded] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const errorDetailRef = useRef<HTMLDivElement | null>(null);
  const lastBusyAtRef = useRef(0);
  const lastActivityAtRef = useRef(Date.now());
  // Refs keep the mount effect stable without stale closures.
  const configRef = useRef(config);
  configRef.current = config;
  const onConfigChangeRef = useRef(onConfigChange);
  onConfigChangeRef.current = onConfigChange;

  useEffect(() => {
    const stored = localStorage.getItem(`apex-model-${role}`);
    if (!stored) return;
    if (!KNOWN_MODEL_VALUES.has(stored)) {
      setIsOther(true);
      setOtherText(stored);
    }
    onConfigChangeRef.current({ ...configRef.current, model: stored });
  }, []); // eslint-disable-line

  // Elapsed-seconds ticker — starts/resets when busy transitions to true.
  useEffect(() => {
    if (busy) {
      lastBusyAtRef.current = Date.now();
      setActiveSec(0);
      const id = setInterval(() => {
        setActiveSec(Math.round((Date.now() - lastBusyAtRef.current) / 1000));
      }, 1000);
      return () => clearInterval(id);
    } else {
      setActiveSec(0);
    }
  }, [busy]);

  // Track activity and auto-expand when a turn fires.
  useEffect(() => {
    lastActivityAtRef.current = Date.now();
    if (busy) setFolded(false);
  }, [busy]);

  // Auto-fold after 60s idle; check every 10s.
  useEffect(() => {
    const id = setInterval(() => {
      if (!busy && !pendingDraft && Date.now() - lastActivityAtRef.current > 60_000) {
        setFolded(true);
      }
    }, 10_000);
    return () => clearInterval(id);
  }, [busy, pendingDraft]);

  // Scroll to bottom when pane expands.
  useEffect(() => {
    if (!folded && scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [folded]);

  // Error detail panel — close on Escape.
  useEffect(() => {
    if (!errorExpanded) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setErrorExpanded(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [errorExpanded]);

  // Error detail panel — close on outside mousedown.
  useEffect(() => {
    if (!errorExpanded) return;
    const handler = (e: MouseEvent) => {
      if (errorDetailRef.current && !errorDetailRef.current.contains(e.target as Node)) {
        setErrorExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [errorExpanded]);

  const pillState =
    status?.startsWith("error:") ? "error" :
    status === "dispatching" ? "dispatching" :
    busy && pendingDraft !== null ? "streaming" :
    busy ? "thinking" :
    inboxCount > 0 ? "pending" :
    "idle";

  const pillLabel =
    pillState === "error" ? (status ?? "error") :
    pillState === "dispatching" ? "dispatching" :
    pillState === "streaming" ? "streaming" :
    pillState === "thinking" ? "thinking…" :
    pillState === "pending" ? `pending(${inboxCount})` :
    "idle";

  // Filter the shared transcript for this pane's perspective.
  // PO sees everything; peers see their own slice.
  const visible = messages.filter((m) => {
    switch (m.author.kind) {
      case "user":
        return !m.author.to || m.author.to === role;
      case "agent":
        return m.author.role === role;
      case "handoff":
        return (
          role !== "product-owner" &&
          (m.author.from === role || m.author.to === role)
        );
      case "dispatch":
        return role === "product-owner" || m.author.to === role;
      case "orchestrator":
        return role === "product-owner";
    }
  });

  // Last user/dispatch message addressed to this pane — shown as current task.
  const lastTaskMsg = [...visible].reverse().find(
    (m) => m.author.kind === "user" || m.author.kind === "dispatch",
  );
  const taskText = lastTaskMsg
    ? lastTaskMsg.content.length > 80
      ? lastTaskMsg.content.slice(0, 80) + "…"
      : lastTaskMsg.content
    : null;

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages.length, pendingDraft?.length]);

  const submit = () => {
    const text = input.trim();
    if (!text || busy) return;
    onSend(text, role);
    setInput("");
  };

  const isPO = role === "product-owner";

  if (folded) {
    return (
      <section className={`pane pane-${accent} pane-folded`}>
        <div className="folded-bar">
          <span className={`pill pill-${pillState}`} aria-label={`Status: ${pillLabel}`} title={pillLabel}>{pillLabel}</span>
          <Link href={`/agents/${role}`} className="folded-title folded-title-link" title={`${title} profile`}>{title}</Link>
          {inboxCount > 0 && pillState !== "pending" && (
            <span className="inbox-badge" title={`${inboxCount} pending`}>{inboxCount}</span>
          )}
          <button
            className="fold-btn"
            onClick={() => setFolded(false)}
            aria-label={`Expand ${title} pane`}
            title="Expand"
          >▼</button>
        </div>
        <style jsx>{`
          .pane { display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
          .pane-${accent} { border-color: color-mix(in srgb, var(--accent-${accent}) 30%, var(--border)); }
          .pane-folded { min-height: 0; }
          .folded-bar {
            display: flex; align-items: center; gap: 8px; padding: 0 12px; height: 40px;
            background: color-mix(in srgb, var(--accent-${accent}) 4%, var(--surface));
          }
          .folded-title { font-size: 13px; font-weight: 600; flex: 1; }
          .folded-title-link { color: var(--text); text-decoration: none; }
          .folded-title-link:hover { text-decoration: underline; }
          .folded-title-link:focus-visible { outline: 1px solid var(--accent-${accent}); border-radius: 2px; }
          .inbox-badge {
            font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 99px;
            background: color-mix(in srgb, var(--accent-po) 25%, var(--surface-2));
            color: var(--accent-po); border: 1px solid var(--accent-po);
          }
          .fold-btn {
            background: transparent; border: 1px solid var(--border); border-radius: 4px;
            color: var(--text-dim); padding: 2px 6px; font-size: 10px; cursor: pointer; line-height: 1;
          }
          .fold-btn:hover { color: var(--text); }
          .pill { display: inline-flex; align-items: center; font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; padding: 2px 6px; border-radius: 99px; border: 1px solid currentColor; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: nowrap; }
          .pill-idle { color: var(--text-dim); border-color: var(--border); }
          .pill-pending { color: var(--status-amber); border-color: var(--status-amber); }
          .pill-dispatching { color: var(--accent-po); animation: pill-pulse 1.4s ease-in-out infinite; }
          .pill-thinking { color: var(--accent-arch); animation: pill-pulse 1.1s ease-in-out infinite; }
          .pill-streaming { color: var(--accent-ui); animation: pill-pulse 0.6s ease-in-out infinite; }
          .pill-error { color: var(--accent-qa); }
          @keyframes pill-pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
          @media (prefers-reduced-motion: reduce) {
            .pill-dispatching,
            .pill-thinking,
            .pill-streaming {
              animation: none;
              opacity: 1;
            }
          }
        `}</style>
      </section>
    );
  }

  return (
    <section className={`pane pane-${accent}`} style={{ maxHeight }}>
      <header className="pane-header">
        <div className="header-row">
          <div className="title">
            <span
              className={`pill pill-${pillState}${pillState === "error" ? " pill-error-btn" : ""}${pillState === "error" && errorExpanded ? " pill-open" : ""}`}
              aria-label={`Status: ${pillLabel}`}
              title={pillLabel}
              aria-expanded={pillState === "error" ? errorExpanded : undefined}
              onClick={pillState === "error" ? () => setErrorExpanded(prev => !prev) : undefined}
            >
              {pillLabel}
            </span>
            <Link href={`/agents/${role}`} className="title-link" title={`${title} profile`}>{title}</Link>
            {busy && <span className="elapsed">{activeSec}s</span>}
          </div>
          <div className="config">
          <select
            value={config.provider}
            onChange={(e) =>
              onConfigChange({ ...config, provider: e.target.value as Provider })
            }
            disabled={busy}
          >
            {(["claude", "gemini", "groq"] as Provider[]).map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABEL[p]}
              </option>
            ))}
          </select>
          <select
            value={isOther ? "__other__" : config.model}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "__other__") {
                setIsOther(true);
                setOtherText("");
                // Keep the current model value until the user actually types a
                // custom ID — sending "" to the backend causes an opaque failure.
              } else {
                setIsOther(false);
                onConfigChange({ ...config, model: val });
                try { localStorage.setItem(`apex-model-${role}`, val); } catch {}
              }
            }}
            disabled={busy}
          >
            {KNOWN_MODELS.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {isOther && (
            <input
              className="model-input"
              value={otherText}
              placeholder="model id…"
              onChange={(e) => {
                const val = e.target.value;
                setOtherText(val);
                if (val) {
                  onConfigChange({ ...config, model: val });
                  try { localStorage.setItem(`apex-model-${role}`, val); } catch {}
                }
              }}
              disabled={busy}
              spellCheck={false}
            />
          )}
          </div>
          <button
            className="fold-btn"
            onClick={() => setFolded(true)}
            aria-label={`Collapse ${title} pane`}
            title="Collapse"
          >▲</button>
        </div>
        {taskText && (
          <div className="task-bar" title={lastTaskMsg?.content}>
            {taskText}
          </div>
        )}
      </header>

      {pillState === "error" && errorExpanded && (
        <div ref={errorDetailRef} className="error-detail">
          <div className="error-detail-title">Agent error — last turn</div>
          <pre className="error-detail-body">{status}</pre>
        </div>
      )}

      <AgentStatePanel
        handoffDoc={handoffDoc}
        updatedAt={handoffDocUpdatedAt}
        inboxCount={inboxCount}
        onEdit={onEditHandoffDoc}
      />

      <div ref={scrollerRef} className="messages scrollbar-thin">
        {visible.map((m) => (
          <MessageBubble key={m.id} message={m} perspective={role} />
        ))}
        {pendingDraft && (
          <MessageBubble
            pending
            perspective={role}
            message={{
              id: -1,
              threadId: "",
              author: { kind: "agent", role },
              content: pendingDraft,
              createdAt: Date.now(),
            }}
          />
        )}
        {visible.length === 0 && !pendingDraft && (
          <div className="empty">
            {isPO
              ? "Type a goal; I'll route it to the team."
              : `No messages yet. Talk to ${title.toLowerCase()} below.`}
          </div>
        )}
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {!isPO && inboxCount > 0 && (
          <button
            type="button"
            className="inbox-btn"
            onClick={onProcessInbox}
            disabled={busy || !onProcessInbox}
            title="Have this agent process their pending inbox without a new user message"
          >
            Process inbox ({inboxCount})
          </button>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            isPO
              ? "Drop a task to the team… (PO orchestrates)  · ⌘/Ctrl+Enter"
              : `Message ${title}… (⌘/Ctrl+Enter to send)`
          }
          rows={isPO ? 2 : 2}
          disabled={busy}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>

      <style jsx>{`
        .pane {
          display: flex;
          flex-direction: column;
          min-height: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }
        .pane-${accent} {
          border-color: color-mix(in srgb, var(--accent-${accent}) 30%, var(--border));
        }
        .pane-header {
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid var(--border);
          background: color-mix(in srgb, var(--accent-${accent}) 4%, var(--surface));
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          gap: 10px;
        }
        .title {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        .title-link { color: var(--text); text-decoration: none; }
        .title-link:hover { text-decoration: underline; }
        .title-link:focus-visible { outline: 1px solid var(--accent-${accent}); border-radius: 2px; outline-offset: 2px; }
        .pill {
          display: inline-flex;
          align-items: center;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 99px;
          border: 1px solid currentColor;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          white-space: nowrap;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pill-idle { color: var(--text-dim); border-color: var(--border); }
        .pill-pending { color: var(--status-amber); border-color: var(--status-amber); }
        .pill-dispatching { color: var(--accent-po); animation: pill-pulse 1.4s ease-in-out infinite; }
        .pill-thinking { color: var(--accent-arch); animation: pill-pulse 1.1s ease-in-out infinite; }
        .pill-streaming { color: var(--accent-ui); animation: pill-pulse 0.6s ease-in-out infinite; }
        .pill-error { color: var(--accent-qa); }
        .pill-error-btn { cursor: pointer; }
        .pill-error-btn:hover { background: color-mix(in srgb, var(--accent-qa) 20%, transparent); }
        .pill-open { background: var(--surface-2); }
        .error-detail {
          border-left: 3px solid var(--accent-${accent});
          background: var(--surface);
          padding: 8px 12px;
          font-size: 0.75rem;
          border-bottom: 1px solid var(--border);
        }
        .error-detail-title {
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-dim);
          margin-bottom: 4px;
        }
        .error-detail-body {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          white-space: pre-wrap;
          word-break: break-all;
          color: var(--accent-qa);
          margin: 0;
        }
        .elapsed {
          font-size: 10px;
          color: var(--text-dim);
          font-weight: 400;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .task-bar {
          padding: 3px 12px 5px;
          font-size: 11px;
          color: var(--text-dim);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
        }
        .config { display: flex; gap: 4px; font-size: 11px; align-items: center; }
        .fold-btn {
          background: transparent; border: 1px solid var(--border); border-radius: 4px;
          color: var(--text-dim); padding: 2px 6px; font-size: 10px; cursor: pointer; line-height: 1;
          margin-left: 4px; flex-shrink: 0;
        }
        .fold-btn:hover { color: var(--text); }
        .config select, .model-input {
          background: var(--surface-2);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 5px;
          padding: 3px 5px;
          font-size: 11px;
        }
        .model-input {
          width: 140px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .messages {
          flex: 1;
          padding: 10px;
          overflow-y: auto;
          min-height: 80px;
        }
        .empty {
          color: var(--text-dim);
          font-size: 12px;
          text-align: center;
          padding: 16px 0;
        }
        .composer {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 8px;
          border-top: 1px solid var(--border);
          background: var(--surface-2);
        }
        .inbox-btn {
          flex-basis: 100%;
          background: color-mix(in srgb, var(--accent-po) 18%, var(--surface));
          color: var(--text);
          border: 1px solid color-mix(in srgb, var(--accent-po) 50%, var(--border));
          border-radius: 6px;
          padding: 5px 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }
        .inbox-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        textarea {
          flex: 1;
          resize: vertical;
          background: var(--surface);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 5px;
          padding: 6px 8px;
          font-family: inherit;
          font-size: 13px;
          min-width: 160px;
        }
        button[type="submit"] {
          padding: 0 12px;
          border-radius: 5px;
          border: 1px solid color-mix(in srgb, var(--accent-${accent}) 50%, var(--border));
          background: color-mix(in srgb, var(--accent-${accent}) 18%, var(--surface));
          color: var(--text);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        @keyframes pill-pulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pill-dispatching,
          .pill-thinking,
          .pill-streaming {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}
