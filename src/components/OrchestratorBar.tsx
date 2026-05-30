"use client";

import { useEffect, useState } from "react";

interface Props {
  threadId: string;
  onNewThread: () => void;
  busy: boolean;
  workspace: string;
  onWorkspaceChange: (next: string) => void;
}

export function OrchestratorBar({
  threadId,
  onNewThread,
  busy,
  workspace,
  onWorkspaceChange,
}: Props) {
  const [draft, setDraft] = useState(workspace);

  // Sync incoming workspace (e.g. when defaultCwd loads from /api/health).
  useEffect(() => {
    setDraft(workspace);
  }, [workspace]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== workspace) onWorkspaceChange(trimmed);
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
        <code>{threadId}</code>
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
        .thread code {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 2px 6px;
          color: var(--text);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
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
