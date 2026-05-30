"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  /** Markdown content of the agent's HANDOFF doc. Empty string = no doc yet. */
  handoffDoc: string;
  updatedAt: number;
  inboxCount: number;
  defaultOpen?: boolean;
  onEdit?: (next: string) => Promise<void> | void;
}

export function AgentStatePanel({
  handoffDoc,
  updatedAt,
  inboxCount,
  defaultOpen = false,
  onEdit,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(handoffDoc);

  const hasDoc = handoffDoc.trim().length > 0;
  const stamp =
    updatedAt > 0
      ? new Date(updatedAt).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div className="state-panel">
      <button
        type="button"
        className="toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="caret">{open ? "▾" : "▸"}</span>
        <span>HANDOFF</span>
        <span className="meta">{hasDoc ? `· updated ${stamp}` : "· empty"}</span>
        {inboxCount > 0 && (
          <span className="inbox-badge" title={`${inboxCount} pending from teammate`}>
            inbox {inboxCount}
          </span>
        )}
      </button>

      {open && (
        <div className="body">
          {editing ? (
            <>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
                rows={Math.min(12, Math.max(4, draft.split("\n").length + 1))}
              />
              <div className="row">
                <button
                  type="button"
                  className="primary"
                  onClick={async () => {
                    await onEdit?.(draft);
                    setEditing(false);
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setDraft(handoffDoc);
                    setEditing(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : hasDoc ? (
            <>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{handoffDoc}</ReactMarkdown>
              </div>
              {onEdit && (
                <div className="row">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setDraft(handoffDoc);
                      setEditing(true);
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="empty">
              No HANDOFF doc yet. This agent will create one on its next turn (via a
              <code> [[NOTES]] </code> block).
            </p>
          )}
        </div>
      )}

      <style jsx>{`
        .state-panel {
          border-bottom: 1px solid var(--border);
          background: color-mix(in srgb, var(--accent-orch) 4%, var(--surface));
        }
        .toggle {
          all: unset;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          width: 100%;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-dim);
        }
        .caret { width: 12px; color: var(--text-dim); }
        .meta { color: var(--text-dim); font-weight: 400; text-transform: none; letter-spacing: 0; }
        .inbox-badge {
          margin-left: auto;
          background: color-mix(in srgb, var(--accent-orch) 30%, var(--surface-2));
          color: var(--text);
          border: 1px solid color-mix(in srgb, var(--accent-orch) 50%, var(--border));
          border-radius: 999px;
          padding: 1px 8px;
          font-size: 11px;
          font-weight: 600;
          text-transform: none;
          letter-spacing: 0;
        }
        .body {
          padding: 4px 14px 12px;
        }
        .empty {
          color: var(--text-dim);
          font-size: 13px;
        }
        textarea {
          width: 100%;
          background: var(--surface);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 8px 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
          resize: vertical;
        }
        .row {
          display: flex;
          gap: 6px;
          margin-top: 8px;
        }
        .primary {
          background: color-mix(in srgb, var(--accent-orch) 18%, var(--surface));
          border: 1px solid color-mix(in srgb, var(--accent-orch) 50%, var(--border));
          color: var(--text);
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 12px;
          cursor: pointer;
        }
        .ghost {
          background: transparent;
          color: var(--text-dim);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 12px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
