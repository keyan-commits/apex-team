"use client";

import { useEffect, useRef, useState } from "react";

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

  return (
    <section className={`pane pane-${accent}`}>
      <header className="pane-header">
        <div className="title">
          <span className={`dot ${busy ? "thinking" : ""}`} aria-hidden />
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
          rows={isPO ? 2 : 3}
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
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border);
          background: color-mix(in srgb, var(--accent-${accent}) 4%, var(--surface));
          gap: 10px;
        }
        .title {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent-${accent});
        }
        .dot.thinking { animation: pulse 1.1s ease-in-out infinite; }
        .status {
          font-size: 10px;
          color: var(--text-dim);
          font-weight: 400;
          margin-left: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .config { display: flex; gap: 4px; font-size: 11px; }
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
          min-height: 120px;
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
        @keyframes pulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
