"use client";

import { useEffect, useState } from "react";

interface ActiveWaveCardProps {
  activeWave: { excerpt: string; emittedAt: number } | null;
  now: Array<{ role: string; state: string; taskSummary: string; startedAt: number; waves?: number[]; tickets?: number[] }>;
  done: Array<{ role: string; taskSummary: string; completedAt: number; commitSha?: string; waves?: number[]; tickets?: number[] }>;
  queued: Array<{ id: number; toRole: string; fromRole: string; taskSummary: string; createdAt: number }>;
  pollIntervalMs: number;
  onPollIntervalChange: (ms: number) => void;
  endpointReady: boolean;
}

const POLL_OPTIONS = [
  { label: "push", ms: 0 },
  { label: "1s", ms: 1000 },
  { label: "4s", ms: 4000 },
  { label: "10s", ms: 10000 },
  { label: "30s", ms: 30000 },
] as const;

const ROLE_ACCENT: Record<string, string> = {
  "product-owner": "po",
  "business-analyst": "ba",
  architect: "arch",
  "ui-developer": "ui",
  "backend-developer": "be",
  qa: "qa",
  devsecops: "ops",
  "ux-designer": "uxd",
};

function RoleBadge({ role }: { role: string }) {
  const accent = ROLE_ACCENT[role] ?? "po";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 6px",
        borderRadius: 99,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "ui-monospace, monospace",
        letterSpacing: "0.03em",
        background: `color-mix(in srgb, var(--accent-${accent}) 15%, var(--surface-2))`,
        color: `var(--accent-${accent})`,
        border: `1px solid color-mix(in srgb, var(--accent-${accent}) 40%, var(--border))`,
        flexShrink: 0,
      }}
    >
      {role}
    </span>
  );
}

function fmtRelative(tsMs: number, nowMs: number): string {
  const sec = Math.round((nowMs - tsMs) / 1000);
  if (sec < 90) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 90) return `${min}m ago`;
  return `${Math.round(min / 60)}h ago`;
}

function trunc(s: string, len: number): string {
  return s.length <= len ? s : s.slice(0, len) + "…";
}

export function ActiveWaveCard({
  activeWave,
  now,
  done,
  queued,
  pollIntervalMs,
  onPollIntervalChange,
  endpointReady,
}: ActiveWaveCardProps) {
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    setNowMs(+new Date());
    const id = setInterval(() => setNowMs(+new Date()), 10000);
    return () => clearInterval(id);
  }, []);

  const hasContent =
    activeWave !== null || now.length > 0 || done.length > 0 || queued.length > 0;

  const justLanded =
    done.length > 0 && nowMs > 0 && nowMs - done[0].completedAt < 90000
      ? done[0]
      : null;

  return (
    <div className="aw-root" role="region" aria-label="Active Wave">
      {/* Header */}
      <div className="aw-header">
        <h2 className="aw-title">Active Wave</h2>
        <div className="aw-poll-ctrl" role="group" aria-label="Poll interval">
          {POLL_OPTIONS.map((opt) => (
            <button
              key={opt.ms}
              className={`aw-poll-btn${pollIntervalMs === opt.ms ? " aw-poll-selected" : ""}`}
              onClick={() => onPollIntervalChange(opt.ms)}
              aria-pressed={pollIntervalMs === opt.ms}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {!endpointReady ? (
        <p className="aw-empty">Dashboard data not available — is the server fully started?</p>
      ) : !hasContent ? (
        <p className="aw-empty">No wave context found in thread.</p>
      ) : (
        <div className="aw-sections">

          {/* Section A — WHERE WE ARE */}
          {now.length > 0 && (
            <div className="aw-section">
              <h3 className="aw-section-hd">Where we are</h3>
              <div className="aw-now-rows">
                {now.map((e) => (
                  <div key={e.role} className="aw-now-row">
                    <RoleBadge role={e.role} />
                    <span className="aw-state-pill">{e.state}</span>
                    <span className="aw-task-text">{trunc(e.taskSummary, 80)}</span>
                  </div>
                ))}
              </div>
              {activeWave && (
                <p className="aw-wave-excerpt">{trunc(activeWave.excerpt, 120)}</p>
              )}
            </div>
          )}

          {/* Section B — JUST LANDED */}
          {justLanded && (
            <div className="aw-section">
              <h3 className="aw-section-hd">Just landed</h3>
              <div className="aw-landed-row">
                <RoleBadge role={justLanded.role} />
                <span className="aw-task-text">{trunc(justLanded.taskSummary, 80)}</span>
                <span className="aw-dim">{fmtRelative(justLanded.completedAt, nowMs)}</span>
              </div>
              {justLanded.commitSha && (
                <div className="aw-sha">commit <code>{justLanded.commitSha}</code></div>
              )}
            </div>
          )}

          {/* Section C — STILL TO DO */}
          {queued.length > 0 && (
            <div className="aw-section">
              <h3 className="aw-section-hd">Still to do</h3>
              <ul className="aw-todo-list" aria-label="Queued tasks">
                {queued.slice(0, 4).map((q) => (
                  <li key={q.id} className="aw-todo-item">
                    <span className="aw-bullet" aria-hidden="true">·</span>
                    <RoleBadge role={q.toRole} />
                    <span className="aw-task-text">{trunc(q.taskSummary, 60)}</span>
                  </li>
                ))}
              </ul>
              {queued.length > 4 && (
                <p className="aw-overflow">+ {queued.length - 4} more</p>
              )}
            </div>
          )}

          {/* Section D — NEXT */}
          <div className="aw-section aw-section-last">
            <h3 className="aw-section-hd">Next</h3>
            {queued.length > 0 ? (
              <div className="aw-next-row">
                <RoleBadge role={queued[0].toRole} />
                <span className="aw-task-text">{trunc(queued[0].taskSummary, 60)}</span>
              </div>
            ) : now.length > 0 ? (
              <p className="aw-status-text">dispatching in progress</p>
            ) : (
              <p className="aw-status-text">awaiting input</p>
            )}
          </div>

        </div>
      )}

      <style jsx>{`
        .aw-root {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .aw-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          gap: 8px;
        }

        .aw-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin: 0;
        }

        .aw-poll-ctrl {
          display: flex;
          align-items: center;
          gap: 2px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 2px;
          flex-shrink: 0;
        }

        .aw-poll-btn {
          font-size: 9px;
          font-weight: 700;
          font-family: ui-monospace, monospace;
          padding: 2px 6px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          background: transparent;
          color: var(--text-dim);
          letter-spacing: 0.03em;
          line-height: 1.4;
          transition: background 120ms, color 120ms;
        }

        .aw-poll-btn:hover:not(.aw-poll-selected) {
          background: var(--border);
          color: var(--text);
        }

        .aw-poll-btn:focus-visible {
          outline: 2px solid var(--accent-po);
          outline-offset: 1px;
        }

        .aw-poll-selected {
          background: var(--accent-po);
          color: #fff;
        }

        .aw-empty {
          font-size: 12px;
          color: var(--text-dim);
          margin: 4px 0;
        }

        .aw-sections {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .aw-section {
          padding: 8px 0;
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .aw-sections .aw-section:first-child {
          border-top: none;
          padding-top: 0;
        }

        .aw-section-last {
          padding-bottom: 0;
        }

        .aw-section-hd {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin: 0 0 4px;
        }

        .aw-now-rows {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .aw-now-row,
        .aw-landed-row,
        .aw-next-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .aw-state-pill {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 1px 5px;
          border-radius: 99px;
          border: 1px solid var(--border);
          color: var(--accent-arch);
          font-family: ui-monospace, monospace;
          flex-shrink: 0;
        }

        .aw-task-text {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 12px;
          color: var(--text);
        }

        .aw-wave-excerpt {
          font-size: 11px;
          color: var(--text-dim);
          font-style: italic;
          margin: 4px 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .aw-dim {
          font-size: 10px;
          color: var(--text-dim);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .aw-sha {
          font-size: 10px;
          color: var(--text-dim);
          margin-top: 2px;
        }

        .aw-sha code {
          font-family: ui-monospace, monospace;
          font-size: 10px;
        }

        .aw-todo-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .aw-todo-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .aw-bullet {
          color: var(--text-dim);
          flex-shrink: 0;
          font-size: 14px;
          line-height: 1;
        }

        .aw-overflow {
          font-size: 10px;
          color: var(--text-dim);
          margin: 2px 0 0;
        }

        .aw-status-text {
          font-size: 11px;
          color: var(--text-dim);
          font-style: italic;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
