"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// Types will reconcile with Architect's /api/team-status spec when that endpoint lands.
interface NowEntry { role: string; task: string; started_at: number; state: string; }
interface QueueEntry { id: number; role: string; task: string; queued_at: number; }
interface DoneEntry { role: string; task: string; completed_at: number; }
interface BlockedEntry { role: string; error: string; since: number; }

interface TeamStatusData {
  now: NowEntry[];
  queued: QueueEntry[];
  done: DoneEntry[];
  blocked: BlockedEntry[];
  active_wave: string | null;
  issues: { self_improvement: number; skill_proposal: number; mcp_proposal: number };
  scout: { last_run_at: number | null; proposals_filed: number } | null;
  context: Record<string, { handoff_size: number; history_depth: number }>;
  spend: {
    today_usd: number;
    thread_usd: number;
    per_role: Record<string, { input_tokens: number; output_tokens: number; cost_usd: number; model: string }>;
  } | null;
}

const ROLE_ACCENT: Record<string, string> = {
  "product-owner": "po", "business-analyst": "ba", architect: "arch",
  "ui-developer": "ui", "backend-developer": "be", qa: "qa", devsecops: "ops",
};

function fmtTime(ms: number | null | undefined): string {
  if (!ms) return "never";
  const d = new Date(ms);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtUsd(n: number): string {
  return n < 0.001 ? "<$0.001" : `$${n.toFixed(3)}`;
}

function fmtNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function roleBadge(role: string) {
  const accent = ROLE_ACCENT[role] ?? "po";
  return (
    <span
      key={role}
      style={{
        display: "inline-block", padding: "1px 6px", borderRadius: 99, fontSize: 10,
        fontWeight: 700, fontFamily: "ui-monospace, monospace", letterSpacing: "0.03em",
        background: `color-mix(in srgb, var(--accent-${accent}) 15%, var(--surface-2))`,
        color: `var(--accent-${accent})`,
        border: `1px solid color-mix(in srgb, var(--accent-${accent}) 40%, var(--border))`,
      }}
    >{role}</span>
  );
}

export default function DashboardPage() {
  const [threadId, setThreadId] = useState<string>("");
  const [data, setData] = useState<TeamStatusData | null>(null);
  const [endpointReady, setEndpointReady] = useState(true);
  const [savedOrder, setSavedOrder] = useState<number[]>([]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  // Fetch active thread on mount.
  useEffect(() => {
    fetch("/api/active-thread", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { threadId: string | null }) => {
        if (d.threadId) setThreadId(d.threadId);
      })
      .catch(() => {});
  }, []);

  // Load saved queue order when threadId is known.
  useEffect(() => {
    if (!threadId) return;
    try {
      const raw = localStorage.getItem(`apex-priority-${threadId}`);
      if (raw) setSavedOrder(JSON.parse(raw));
    } catch {}
  }, [threadId]);

  // Visibility-aware polling every 10s.
  useEffect(() => {
    if (!threadId) return;
    const fetchData = () => {
      if (document.visibilityState !== "visible") return;
      fetch(`/api/team-status?threadId=${encodeURIComponent(threadId)}`, { cache: "no-store" })
        .then((r) => {
          if (r.status === 404) { setEndpointReady(false); return null; }
          setEndpointReady(true);
          return r.json() as Promise<TeamStatusData>;
        })
        .then((d) => { if (d) setData(d); })
        .catch(() => {});
    };
    fetchData();
    const id = setInterval(fetchData, 10_000);
    const onVis = () => { if (document.visibilityState === "visible") fetchData(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [threadId]);

  // QUEUED panel: apply saved ordering to incoming data.
  const sortedQueued = useMemo<QueueEntry[]>(() => {
    if (!data?.queued) return [];
    if (!savedOrder.length) return data.queued;
    const pos = new Map(savedOrder.map((id, i) => [id, i]));
    return [...data.queued].sort((a, b) => (pos.get(a.id) ?? 9999) - (pos.get(b.id) ?? 9999));
  }, [data?.queued, savedOrder]);

  const handleDrop = (toIdx: number) => {
    if (dragFrom === null || dragFrom === toIdx) return;
    const arr = [...sortedQueued];
    const [item] = arr.splice(dragFrom, 1);
    arr.splice(toIdx, 0, item);
    const ids = arr.map((x) => x.id);
    setSavedOrder(ids);
    if (threadId) {
      try { localStorage.setItem(`apex-priority-${threadId}`, JSON.stringify(ids)); } catch {}
    }
    setDragFrom(null);
  };

  const empty = (msg: string) => <p className="empty-msg">{msg}</p>;
  const notReady = empty("Endpoint building… (Wave 6b BE Dev)");

  return (
    <div className="dash">
      {/* Top bar */}
      <header className="dash-bar">
        <span className="logo">⌬</span>
        <span className="brand">apex-team</span>
        <nav className="tabs">
          <Link href="/" className="tab">Team</Link>
          <Link href="/dashboard" className="tab tab-active">Dashboard</Link>
        </nav>
        {threadId && (
          <span className="thread-id" title="Active thread">
            thread: <code>{threadId}</code>
          </span>
        )}
      </header>

      {/* Panels grid */}
      <div className="grid">

        {/* NOW */}
        <section className="panel span2">
          <h2 className="panel-h">Now — In-Flight</h2>
          {!endpointReady ? notReady : !data ? empty("Loading…") : data.now.length === 0 ? empty("No active turns.") : (
            <div className="row-list">
              {data.now.map((e) => (
                <div key={e.role} className="row">
                  {roleBadge(e.role)}
                  <span className="state-pill">{e.state}</span>
                  <span className="task-text">{e.task}</span>
                  <span className="dim">{fmtTime(e.started_at)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* QUEUED */}
        <section className="panel span2">
          <h2 className="panel-h">Queued — Drag to prioritize</h2>
          {!endpointReady ? notReady : !data ? empty("Loading…") : sortedQueued.length === 0 ? empty("No queued tasks.") : (
            <div className="row-list">
              {sortedQueued.map((item, i) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragFrom(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={() => setDragFrom(null)}
                  className={`row draggable${dragFrom === i ? " row-dragging" : ""}`}
                >
                  <span className="drag-handle" aria-hidden="true">⠿</span>
                  {roleBadge(item.role)}
                  <span className="task-text">{item.task}</span>
                  <span className="dim">{fmtTime(item.queued_at)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* DONE */}
        <section className="panel">
          <h2 className="panel-h">Done — last 24h</h2>
          {!endpointReady ? notReady : !data ? empty("Loading…") : data.done.length === 0 ? empty("Nothing completed yet.") : (
            <div className="row-list">
              {data.done.map((e, i) => (
                <div key={i} className="row">
                  {roleBadge(e.role)}
                  <span className="task-text">{e.task}</span>
                  <span className="dim">{fmtTime(e.completed_at)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* BLOCKED */}
        <section className="panel">
          <h2 className="panel-h">Blocked</h2>
          {!endpointReady ? notReady : !data ? empty("Loading…") : data.blocked.length === 0 ? empty("No errors.") : (
            <div className="row-list">
              {data.blocked.map((e) => (
                <div key={e.role} className="row row-error">
                  {roleBadge(e.role)}
                  <span className="error-text">{e.error}</span>
                  <span className="dim">{fmtTime(e.since)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ACTIVE WAVE */}
        <section className="panel span2">
          <h2 className="panel-h">Active Wave</h2>
          {!endpointReady ? notReady : !data ? empty("Loading…") : !data.active_wave ? empty("No wave context found in thread.") : (
            <pre className="wave-text">{data.active_wave}</pre>
          )}
        </section>

        {/* ISSUES */}
        <section className="panel">
          <h2 className="panel-h">Issues</h2>
          {!endpointReady ? notReady : !data ? empty("Loading…") : (
            <div className="issue-grid">
              <a className="issue-row" href="https://github.com/keyan-commits/apex-team/issues?q=label%3Aself-improvement+is%3Aopen" target="_blank" rel="noreferrer">
                <span className="issue-count">{data.issues.self_improvement}</span>
                <span className="issue-label">self-improvement</span>
              </a>
              <a className="issue-row" href="https://github.com/keyan-commits/apex-team/issues?q=label%3Askill-proposal+is%3Aopen" target="_blank" rel="noreferrer">
                <span className="issue-count">{data.issues.skill_proposal}</span>
                <span className="issue-label">skill-proposal</span>
              </a>
              <a className="issue-row" href="https://github.com/keyan-commits/apex-team/issues?q=label%3Amcp-proposal+is%3Aopen" target="_blank" rel="noreferrer">
                <span className="issue-count">{data.issues.mcp_proposal}</span>
                <span className="issue-label">mcp-proposal</span>
              </a>
            </div>
          )}
        </section>

        {/* SCOUT */}
        <section className="panel">
          <h2 className="panel-h">Daily Scout</h2>
          {!endpointReady ? notReady : !data ? empty("Loading…") : !data.scout ? empty("Scout has not run yet.") : (
            <dl className="kv-list">
              <dt>Last run</dt><dd>{fmtTime(data.scout.last_run_at)}</dd>
              <dt>Proposals filed</dt><dd>{data.scout.proposals_filed}</dd>
              <dt>Next run</dt><dd>08:00 UTC (daily cron)</dd>
            </dl>
          )}
        </section>

        {/* CONTEXT */}
        <section className="panel span2">
          <h2 className="panel-h">Context</h2>
          {!endpointReady ? notReady : !data ? empty("Loading…") : Object.keys(data.context).length === 0 ? empty("No context data.") : (
            <div className="context-grid">
              {Object.entries(data.context).map(([role, ctx]) => {
                const needsCleanup = ctx.handoff_size > 8000 || ctx.history_depth > 50;
                return (
                  <div key={role} className={`ctx-card${needsCleanup ? " ctx-warn" : ""}`}>
                    {roleBadge(role)}
                    {needsCleanup && <span className="cleanup-badge">needs cleanup</span>}
                    <div className="ctx-stats">
                      <span>{fmtNum(ctx.handoff_size)} chars</span>
                      <span>{ctx.history_depth} msgs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SPEND */}
        <section className="panel span2">
          <h2 className="panel-h">Spend</h2>
          {!endpointReady ? notReady : !data ? empty("Loading…") : !data.spend ? empty("Token usage not yet captured (Wave 6b BE Dev).") : (
            <>
              <div className="spend-totals">
                <div className="spend-stat"><span className="spend-val">{fmtUsd(data.spend.today_usd)}</span><span className="spend-lbl">today</span></div>
                <div className="spend-stat"><span className="spend-val">{fmtUsd(data.spend.thread_usd)}</span><span className="spend-lbl">this thread</span></div>
              </div>
              <div className="spend-roles">
                {Object.entries(data.spend.per_role)
                  .sort((a, b) => b[1].cost_usd - a[1].cost_usd)
                  .map(([role, u]) => {
                    const pct = data.spend!.thread_usd > 0 ? (u.cost_usd / data.spend!.thread_usd) * 100 : 0;
                    return (
                      <div key={role} className="spend-row">
                        {roleBadge(role)}
                        <div className="spend-bar-wrap">
                          <div className="spend-bar" style={{ width: `${pct.toFixed(1)}%` }} />
                        </div>
                        <span className="spend-cost">{fmtUsd(u.cost_usd)}</span>
                        <span className="dim">{fmtNum(u.input_tokens + u.output_tokens)} tok</span>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </section>

      </div>

      <style jsx>{`
        .dash { min-height: 100vh; display: flex; flex-direction: column; }
        .dash-bar {
          display: flex; align-items: center; gap: 16px; padding: 8px 16px;
          border-bottom: 1px solid var(--border); background: var(--surface);
          flex-wrap: wrap;
        }
        .logo { color: var(--accent-po); font-size: 18px; }
        .brand { font-weight: 700; letter-spacing: 0.02em; }
        .tabs { display: flex; gap: 4px; }
        .tab {
          padding: 4px 12px; border-radius: 4px; border: 1px solid var(--border);
          font-size: 12px; font-weight: 500; color: var(--text-dim); text-decoration: none;
        }
        .tab:hover { color: var(--text); background: var(--surface-2); }
        .tab-active { color: var(--text); background: var(--surface-2); border-color: var(--accent-po); }
        .thread-id { font-size: 11px; color: var(--text-dim); margin-left: auto; }
        .thread-id code { font-family: ui-monospace, monospace; }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px; padding: 12px;
        }
        .panel {
          background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
          padding: 12px;
        }
        .span2 { grid-column: span 2; }
        .panel-h { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-dim); margin: 0 0 10px; }
        .empty-msg { font-size: 12px; color: var(--text-dim); margin: 4px 0; }

        .row-list { display: flex; flex-direction: column; gap: 6px; }
        .row {
          display: flex; align-items: center; gap: 8px; padding: 5px 8px;
          background: var(--surface-2); border-radius: 6px; font-size: 12px;
        }
        .row-error { background: color-mix(in srgb, var(--accent-qa) 8%, var(--surface-2)); }
        .row.draggable { cursor: grab; }
        .row.row-dragging { opacity: 0.4; }
        .drag-handle { color: var(--text-dim); font-size: 14px; cursor: grab; }
        .state-pill {
          font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
          padding: 1px 5px; border-radius: 99px; border: 1px solid var(--border);
          color: var(--accent-arch); font-family: ui-monospace, monospace;
        }
        .task-text { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .error-text { flex: 1; min-width: 0; color: var(--accent-qa); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dim { font-size: 10px; color: var(--text-dim); white-space: nowrap; flex-shrink: 0; }

        .wave-text {
          font-size: 11px; font-family: ui-monospace, monospace; color: var(--text-dim);
          white-space: pre-wrap; word-break: break-word; margin: 0;
          max-height: 160px; overflow-y: auto;
        }

        .issue-grid { display: flex; flex-direction: column; gap: 4px; }
        .issue-row {
          display: flex; align-items: center; gap: 10px; padding: 6px 8px;
          background: var(--surface-2); border-radius: 6px; text-decoration: none; color: var(--text);
        }
        .issue-row:hover { background: color-mix(in srgb, var(--border) 50%, var(--surface-2)); }
        .issue-count { font-size: 20px; font-weight: 700; min-width: 32px; text-align: center; color: var(--accent-po); }
        .issue-label { font-size: 12px; color: var(--text-dim); }

        .kv-list { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 12px; margin: 0; }
        dt { color: var(--text-dim); }
        dd { margin: 0; font-family: ui-monospace, monospace; font-size: 11px; }

        .context-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .ctx-card {
          display: flex; flex-direction: column; gap: 4px; padding: 8px;
          background: var(--surface-2); border-radius: 6px; border: 1px solid var(--border);
          min-width: 140px;
        }
        .ctx-warn { border-color: color-mix(in srgb, var(--accent-po) 50%, var(--border)); }
        .cleanup-badge {
          font-size: 9px; font-weight: 700; color: var(--accent-po); padding: 1px 5px;
          border-radius: 99px; border: 1px solid var(--accent-po);
          background: color-mix(in srgb, var(--accent-po) 10%, var(--surface-2));
          width: fit-content;
        }
        .ctx-stats { display: flex; gap: 8px; font-size: 10px; color: var(--text-dim); font-family: ui-monospace, monospace; }

        .spend-totals { display: flex; gap: 20px; margin-bottom: 12px; }
        .spend-stat { display: flex; flex-direction: column; align-items: center; }
        .spend-val { font-size: 22px; font-weight: 700; font-family: ui-monospace, monospace; color: var(--text); }
        .spend-lbl { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
        .spend-roles { display: flex; flex-direction: column; gap: 6px; }
        .spend-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
        .spend-bar-wrap { flex: 1; height: 6px; background: var(--border); border-radius: 99px; overflow: hidden; }
        .spend-bar { height: 100%; background: var(--accent-po); border-radius: 99px; min-width: 2px; }
        .spend-cost { font-family: ui-monospace, monospace; font-size: 11px; min-width: 56px; text-align: right; }

        @media (max-width: 720px) {
          .grid { grid-template-columns: 1fr; }
          .span2 { grid-column: span 1; }
        }
      `}</style>
    </div>
  );
}
