"use client";

import { useEffect, useRef, useState } from "react";

import type { AgentConfig, ChatMessage, Provider, TeamRoleId } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { AgentStatePanel } from "./AgentStatePanel";

interface Props {
  role: TeamRoleId;
  title: string;
  accent: "ba" | "dev";
  config: AgentConfig;
  onConfigChange: (cfg: AgentConfig) => void;
  messages: ChatMessage[];
  pendingDraft: string | null;
  busy: boolean;
  status: string | null;
  handoffDoc: string;
  handoffDocUpdatedAt: number;
  inboxCount: number;
  onSend: (text: string, target: TeamRoleId) => void;
  onProcessInbox: () => void;
  onEditHandoffDoc: (next: string) => Promise<void> | void;
}

const PROVIDER_LABEL: Record<Provider, string> = {
  claude: "Claude",
  gemini: "Gemini",
  groq: "Groq",
};

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
}: Props) {
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const visible = messages.filter((m) => {
    switch (m.author.kind) {
      case "user":
        return !m.author.to || m.author.to === role;
      case "agent":
        return m.author.role === role;
      case "handoff":
        return m.author.from === role || m.author.to === role;
      case "dispatch":
        return m.author.to === role;
      case "orchestrator":
        return false;
    }
  });

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

  return (
    <section className={`pane pane-${accent}`}>
      <header className="pane-header">
        <div className="title">
          <span className={`dot dot-${accent} ${busy ? "thinking" : ""}`} aria-hidden />
          {title}
          <span className="status">{status ?? (busy ? "thinking…" : "idle")}</span>
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
          <input
            className="model-input"
            value={config.model}
            onChange={(e) => onConfigChange({ ...config, model: e.target.value })}
            disabled={busy}
            spellCheck={false}
          />
        </div>
      </header>

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
          <div className="empty">No messages yet. Talk to {title.toLowerCase()} below.</div>
        )}
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {inboxCount > 0 && (
          <button
            type="button"
            className="inbox-btn"
            onClick={onProcessInbox}
            disabled={busy}
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
          placeholder={`Message ${title}… (⌘/Ctrl+Enter to send)`}
          rows={3}
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
        .pane-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border);
          gap: 12px;
        }
        .title {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .dot.thinking { animation: pulse 1.1s ease-in-out infinite; }
        .dot-ba { background: var(--accent-ba); }
        .dot-dev { background: var(--accent-dev); }
        .status {
          font-size: 11px;
          color: var(--text-dim);
          font-weight: 400;
          margin-left: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .config { display: flex; gap: 6px; font-size: 12px; }
        .config select, .model-input {
          background: var(--surface-2);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 4px 6px;
          font-size: 12px;
        }
        .model-input { width: 180px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .messages {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          min-height: 200px;
        }
        .empty {
          color: var(--text-dim);
          font-size: 13px;
          text-align: center;
          padding: 24px 0;
        }
        .composer {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px;
          border-top: 1px solid var(--border);
          background: var(--surface-2);
        }
        .inbox-btn {
          flex-basis: 100%;
          background: color-mix(in srgb, var(--accent-orch) 18%, var(--surface));
          color: var(--text);
          border: 1px solid color-mix(in srgb, var(--accent-orch) 50%, var(--border));
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 12px;
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
          border-radius: 6px;
          padding: 8px 10px;
          font-family: inherit;
          font-size: 14px;
          min-width: 200px;
        }
        button[type="submit"] {
          align-self: stretch;
          padding: 0 16px;
          border-radius: 6px;
          border: 1px solid color-mix(in srgb, var(--accent-${accent}) 50%, var(--border));
          background: color-mix(in srgb, var(--accent-${accent}) 18%, var(--surface));
          color: var(--text);
          font-weight: 600;
          cursor: pointer;
        }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        @keyframes pulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
