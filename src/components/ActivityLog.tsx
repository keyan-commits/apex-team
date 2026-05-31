"use client";

export interface ActivityEntry {
  id: number;
  ts: number;
  text: string;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

export function ActivityLog({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="activity-log" role="log" aria-label="Activity log" aria-live="polite">
      {entries.map((e) => (
        <span key={e.id} className="entry">
          <span className="ts">{fmtTime(e.ts)}</span>
          {e.text}
        </span>
      ))}

      <style jsx>{`
        .activity-log {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0 12px;
          height: 28px;
          border-bottom: 1px solid var(--border);
          background: var(--surface-2);
          overflow: hidden;
          font-size: 11px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .entry {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-dim);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .entry + .entry::before {
          content: "·";
          margin: 0 8px;
          color: var(--border);
        }
        .ts {
          color: color-mix(in srgb, var(--text-dim) 60%, transparent);
          font-size: 10px;
        }
      `}</style>
    </div>
  );
}
