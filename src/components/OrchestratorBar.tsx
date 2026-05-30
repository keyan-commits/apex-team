"use client";

import { useEffect, useState } from "react";

interface Props {
  threadId: string;
  onNewThread: () => void;
  onThreadIdChange: (next: string) => void;
  busy: boolean;
  workspace: string;
  onWorkspaceChange: (next: string) => void;
}

export function OrchestratorBar({
  threadId,
  onNewThread,
  onThreadIdChange,
  busy,
  workspace,
  onWorkspaceChange,
}: Props) {
  const [draft, setDraft] = useState(workspace);
  const [threadDraft, setThreadDraft] = useState(threadId);

  useEffect(() => {
    setDraft(workspace);
  }, [workspace]);

  useEffect(() => {
    setThreadDraft(threadId);
  }, [threadId]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== workspace) onWorkspaceChange(trimmed);
  };

  const commitThread = () => {
    const trimmed = threadDraft.trim();
    if (trimmed && trimmed !== threadId) onThreadIdChange(trimmed);
  };

  return (
    <header className="bar">
      <div className="brand">
        <span className="logo">⌬</span> apex-team
      </div>

      <div className="workspace">
        <span className="label">workspace</span>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
              (e.target as HTMLInputElement).blur();
            }
          }}
          spellCheck={false}
          placeholder="/absolute/path/to/project"
          title="Working directory shared by the top Claude Code terminal and the BA/Dev agents."
        />
        {draft !== workspace && <span className="dirty" title="Press Enter to apply">●</span>}
      </div>

      <div className="thread">
        <span className="label">thread</span>
        <input
          type="text"
          value={threadDraft}
          onChange={(e) => setThreadDraft(e.target.value)}
          onBlur={commitThread}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitThread();
              (e.target as HTMLInputElement).blur();
            }
          }}
          spellCheck={false}
          placeholder="thread id"
          title="Paste a thread id (e.g. from an MCP-driven session) to subscribe to its events."
        />
        {threadDraft !== threadId && (
          <span className="dirty" title="Press Enter to apply">●</span>
        )}
        <button type="button" className="ghost" onClick={onNewThread} disabled={busy}>
          new
        </button>
      </div>

      <style jsx>{`
        .bar {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          flex-wrap: wrap;
        }
        .brand {
          font-weight: 700;
          letter-spacing: 0.02em;
          display: flex; align-items: center; gap: 6px;
        }
        .logo { color: var(--accent-orch); font-size: 18px; }
        .workspace {
          flex: 1;
          min-width: 280px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-dim);
        }
        .workspace input {
          flex: 1;
          background: var(--surface-2);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 4px 8px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
        }
        .workspace .dirty {
          color: var(--accent-orch);
          font-size: 14px;
          line-height: 1;
        }
        .thread {
          font-size: 12px;
          color: var(--text-dim);
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .thread input {
          background: var(--surface-2);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 2px 6px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
          min-width: 200px;
        }
        .thread .dirty {
          color: var(--accent-orch);
          font-size: 14px;
          line-height: 1;
        }
        .ghost {
          background: transparent;
          color: var(--text-dim);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 11px;
          cursor: pointer;
        }
        .ghost:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </header>
  );
}
