# US-026 — Server-Side PO Tick Scheduler

**Status:** superseded  
**Wave:** 71 (PRIORITY)  
**Closes:** #153  

## Resolution — superseded by Plan C cutover

All ACs target `src/lib/tick-scheduler.ts`, `src/lib/thread-lock.ts`, SQLite `tick_log` table, `src/mcp/tools.ts`, and `server.ts` — all monolith files retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). The tick scheduler was the monolith's autonomous-loop enforcement mechanism. Under the subagent runtime, scheduling is handled by the outer Claude Code session via the Agent tool; there is no persistent server or SQLite DB.

## Story

As a Product Owner, I want the server to automatically re-invoke my turn on a periodic timer while the team has work in flight, so that the zero-idle invariant (US-024) is enforced continuously without requiring human pings every 5 minutes.

## Background

Wave 69 defined the zero-idle invariant as a protocol rule. Wave 71 is the runtime enforcement: a server-side tick scheduler calls PO's turn handler automatically when any non-clear signal exists, removing the human polling loop.

Architect's 10-decision design + DevSecOps 6-section ops spec are the canonical implementation guide. This story captures the acceptance criteria only.

## Acceptance criteria

**AC1 — Scheduler core:**  
`src/lib/tick-scheduler.ts` implements a `Map<threadId, TickState>` singleton with a **self-rescheduling `setTimeout` chain** (NOT `setInterval`) per thread. Maximum 5 concurrent ticking threads. Base cadence 20s; adaptive up to 120s via NO_OP_THROTTLE backoff. Scheduler is armed on first successful `talk_to_product_owner` call for a thread. Accepts injectable `schedule(fn, ms)` + `now()` for deterministic testing.

**AC2 — AUTO-CONTINUE message format:**  
Each tick invokes PO's turn with a synthetic message of the form:  
`[[AUTO-CONTINUE tick=N inflight=<n> idle-peers=<csv> backlog=<n>]]`  
This synthetic message is of `kind:"user"` so it appears as a user trigger in the history. PO uses terse dispatch-only reply mode on AUTO-CONTINUE (no full summaries).

**AC3 — NO_OP_THROTTLE:**  
K = 3 consecutive zero-DISPATCH ticks triggers geometric backoff: `delay = 20s * 2^(noOps - K)` capped at 120s per reschedule, with scheduler full-pause at 300s cumulative no-op delay. `consecutiveNoOpCount` resets to 0 on any tick that emits ≥1 DISPATCH. Each no-op tick is logged to `tick_log` with `no_op=1`.

**AC4 — Per-thread async mutex:**  
`src/lib/thread-lock.ts` implements a per-thread async mutex. `talk_to_product_owner` and `talk_to_role` both acquire the mutex before calling `runTurn`. The tick path also acquires the mutex. This prevents concurrent PO turns on the same thread (tick + external call = doubled dispatches). Mutex acquisition is non-blocking for the caller — queued, not thrown.

**AC5 — MCP tools:**  
Three new MCP tools exposed via `src/mcp/tools.ts`:
- `pause_ticks(thread_id)` — pause scheduler for the given thread, set `paused: true, pausedReason: "manual"`
- `resume_ticks(thread_id)` — resume a paused scheduler
- `get_tick_state(thread_id)` → `{ tickN, noOpCount, paused, pausedReason, budgetSpent, budgetCap, budgetPct, lastTickAt }`

**AC6 — TICK_BUDGET:**  
Budget cap = 500K output tokens per thread per hour (env override: `APEX_TEAM_TICK_BUDGET_PER_HOUR`). Budget is tracked by querying the existing `turn_usage` table via a new `getThreadSpendSince(threadId, sinceMs)` helper — NO new budget table (avoids #140 schema-drift trap; reuse existing `turn_usage` per Architect's design). When budget is exhausted: let the in-flight Anthropic call finish, then set `paused: true, pausedReason: "budget-cap"` BEFORE the next tick fires. At 80% budget: log warning `[tick-scheduler] thread ${threadId}: approaching budget cap (${pct}%)`.

**AC7 — Three stop conditions (all required):**  
1. Signals clear: backlog = 0 AND all peer inboxes = 0 AND no open PRs → scheduler stops; `paused: true, pausedReason: "signals-clear"`.
2. NO_OP_THROTTLE exceeded: 3 consecutive no-op ticks → scheduler pauses (`pausedReason: "no-op-throttle"`).
3. Explicit `pause_ticks(thread_id)` MCP call → scheduler pauses (`pausedReason: "manual"`).

**AC8 — Failure isolation:**  
A tick that throws does NOT kill the scheduler. Error is caught, logged to stderr and `tick_log` (`tokens_spent=0, no_op=1`). The scheduler re-arms for the next tick with the same backoff as a no-op. Anthropic 5xx / 429 errors use SDK built-in retry; if retries exhausted, treated as a failed tick.

**AC9 — Tick MUST NOT re-seed BA's inbox:**  
The tick code path skips the BA-seed that `talk_to_product_owner` appends at `tools.ts:155`. A tick every 20s would spam BA's inbox. The tick invokes `runTurnWithDispatches` (NOT bare `runTurn` — per #156: bare `runTurn` does not fan out peers) with BA-seed branched off.

**AC10 — `tick_log` audit table:**  
New append-only table in `db.ts`:
```sql
CREATE TABLE IF NOT EXISTS tick_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL,
  tick_n INTEGER NOT NULL,
  tokens_spent INTEGER NOT NULL,
  dispatches_emitted INTEGER NOT NULL,
  no_op INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL
);
```
Each completed tick (success or failure) writes one row. Never deleted by the scheduler.

**AC11 — Tick log in PO HANDOFF NOTES:**  
PO's NOTES block includes a running `## Tick log` section updated each tick: tick N, dispatches emitted, tokens spent, cumulative budget. This provides observable evidence of scheduler activity visible in the dashboard's HANDOFF pane.

## Implementation notes

- `src/lib/tick-scheduler.ts` (new)
- `src/lib/thread-lock.ts` (new)
- `src/mcp/tools.ts` — 3 new tools + mutex in `talk_to_*`
- `src/lib/db.ts` — `getThreadSpendSince` helper + `tick_log` table
- `src/app/api/tick-state/route.ts` (new) — `GET ?thread_id=X` → tick state JSON (DevSecOps boot signal)
- `server.ts` — arm scheduler on first `talk_to_product_owner`, SIGINT/SIGTERM cleanup
- `tests/lib/tick-scheduler.test.ts` (new) — injectable timer, no-op backoff K=3, stop conditions, budget skip, throwing-tick re-arm, mutex serialization

## Related

- US-024 (zero-idle invariant — the rule this enforces)
- US-025 (consult-BA — ticks do NOT bypass this)
- BR-005, glossary#TICK, glossary#AUTO-CONTINUE, glossary#TICK_BUDGET, glossary#NO_OP_THROTTLE
- ADR: "Tick must invoke runTurnWithDispatches not bare runTurn" (#156 empirical grounding)
- ADR: "Reuse turn_usage for budget; no separate tick_state budget table" (#140 drift trap)
