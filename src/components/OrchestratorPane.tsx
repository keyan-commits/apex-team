"use client";

import { useEffect, useRef, useState } from "react";

import type { AgentConfig, ChatMessage, Provider, RoleId } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { AgentStatePanel } from "./AgentStatePanel";

interface Props {
  config: AgentConfig;
  onConfigChange: (cfg: AgentConfig) => void;
  messages: ChatMessage[];
  pendingDraft: string | null;
  busy: boolean;
  status: string | null;
  handoffDoc: string;
  handoffDocUpdatedAt: number;
  onSubmit: (text: string) => void;
  onEditHandoffDoc: (next: string) => Promise<void> | void;
}

const PROVIDER_LABEL: Record<Provider, string> = {
  claude: "Claude",
  gemini: "Gemini",
  groq: "Groq",
};

const ROLE: RoleId = "orchestrator";

export function OrchestratorPane({
  config,
  onConfigChange,
  messages,
  pendingDraft,
  busy,
  status,
  handoffDoc,
  handoffDocUpdatedAt,
  onSubmit,
  onEditHandoffDoc,
}: Props) {
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Orchestrator pane shows: user→orchestrator (or untargeted), orchestrator's
  // own LLM replies, orchestrator-system entries (slash command output),
  // and dispatches the orchestrator emitted.
  const visible = messages.filter((m) => {
    switch (m.author.kind) {
      case "user":
        return !m.author.to || m.author.to === ROLE;
      case "agent":
        return m.author.role === ROLE;
      case "orchestrator":
        return true;
      case "dispatch":
        return true;
      case "handoff":
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
    onSubmit(text);
    setInput("");
  };

  return (
    <section className="orch-pane">
      <header className="orch-header">
        <div className="title">
          <span className={`dot ${busy ? "thinking" : ""}`} aria-hidden />
          <strong>Orchestrator</strong>
          <span className="hint">(team lead — type prose or a /command)</span>
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
        inboxCount={0}
        onEdit={onEditHandoffDoc}
      />

      <div ref={scrollerRef} className="messages scrollbar-thin">
        {visible.map((m) => (
          <MessageBubble key={m.id} message={m} perspective={ROLE} />
        ))}
        {pendingDraft && (
          <MessageBubble
            pending
            perspective={ROLE}
            message={{
              id: -1,
              threadId: "",
              author: { kind: "agent", role: ROLE },
              content: pendingDraft,
              createdAt: Date.now(),
            }}
          />
        )}
        {visible.length === 0 && !pendingDraft && (
          <div className="empty">
            Type a goal or a slash command. Try <code>/help</code>.
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
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Talk to the team lead… (slash commands: /help, /status, /clear, /ba, /dev, /both, /auto)  ·  ⌘/Ctrl+Enter to send"
          rows={3}
          disabled={busy}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>

      <style jsx>{`
        .orch-pane {
          display: flex;
          flex-direction: column;
          min-height: 0;
          background: var(--surface);
          border: 1px solid color-mix(in srgb, var(--accent-orch) 30%, var(--border));
          border-radius: 12px;
          overflow: hidden;
        }
        .orch-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border);
          gap: 12px;
          background: color-mix(in srgb, var(--accent-orch) 6%, var(--surface));
        }
        .title {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent-orch);
        }
        .dot.thinking { animation: pulse 1.1s ease-in-out infinite; }
        .hint {
          font-size: 11px;
          color: var(--text-dim);
          font-weight: 400;
        }
        .status {
          font-size: 11px;
          color: var(--text-dim);
          font-weight: 400;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          margin-left: 6px;
        }
        .config {
          display: flex;
          gap: 6px;
          font-size: 12px;
        }
        .config select,
        .model-input {
          background: var(--surface-2);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 4px 6px;
          font-size: 12px;
        }
        .model-input {
          width: 180px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .messages {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          max-height: 320px;
          min-height: 120px;
        }
        .empty {
          color: var(--text-dim);
          font-size: 13px;
          text-align: center;
          padding: 14px 0;
        }
        .empty code {
          background: var(--surface-2);
          border: 1px solid var(--border);
          padding: 1px 5px;
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .composer {
          display: flex;
          gap: 8px;
          padding: 10px;
          border-top: 1px solid var(--border);
          background: var(--surface-2);
        }
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
        }
        button {
          padding: 0 18px;
          border-radius: 6px;
          border: 1px solid color-mix(in srgb, var(--accent-orch) 50%, var(--border));
          background: color-mix(in srgb, var(--accent-orch) 18%, var(--surface));
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
