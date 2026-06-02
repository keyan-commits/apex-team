# ADR-007 — Server-Side Stall Detector

**Date:** 2026-06-02
**Status:** Accepted
**Requirement:** US-035 (#177). Enables the outer claude-code to drop its polling loop once Wave 82 wires up browser notifications on the stall signal.

## Context

The tick scheduler fires the PO every 20s and handles inbox rescue (ADR-006), but has no concept of "the team is alive but not making progress." Specifically:

- A stall = tick is armed, backlog is non-zero, the team has been spending tokens, but no code has merged in >60 min.
- Today the only indicator is the outer claude-code polling `get_team_status` every ~15 min and eyeballing the `done` panel. This is fragile and keeps an expensive outer session alive purely for surveillance.
- Adding a structured stall alarm — emitted inside `doTick`, persisted to DB, surfaced on `/api/team-status` — lets Wave 82 push a browser notification and allows the outer claude-code to stop polling.

## Decision

### Stall condition (all four must hold)

| # | Predicate | Source | Threshold constant |
|---|---|---|---|
| 1 | No main merge in > T_merge | `git -C <workspace> log origin/main -1 --format="%at"` (epoch seconds × 1000) | `STALL_MERGE_THRESHOLD_MS = 3_600_000` (60 min) |
| 2 | Backlog > 0 | `getPipelineState(threadId, 'open_issue_count')` | — (any positive int) |
| 3 | Tick armed | `!state.paused` inside `doTick` | — (boolean) |
| 4 | Budget floor met | `outputTokensBefore >= STALL_BUDGET_FLOOR_TOKENS` | `STALL_BUDGET_FLOOR_TOKENS = 5_000` |

**Predicate 1 — last main merge timestamp:**
`execSync("git log origin/main -1 --format='%at'", { cwd: workspace, encoding: "utf8", timeout: 5_000 })` returns epoch seconds as a string. Multiply by 1000 to get ms. If the command fails (no workspace, not a git repo, no `origin/main`) → treat `lastMergeAtMs = 0`, which always exceeds the threshold; condition 1 is true. Use the same error-swallow pattern as `refreshGhState`.

**Rationale for git over `pr_status` table:** `pr_status.updated_at` reflects when the DB row was last refreshed, NOT the actual merge timestamp. `sha` gives no timing. `git log origin/main` is authoritative and already used in the workspace for other tick operations.

**Predicate 2 — backlog:**
`getPipelineState(threadId, 'open_issue_count')` is already refreshed each tick by `refreshGhState`. No extra gh CLI call. If the key is absent (first tick, workspace unconfigured) → treat as 0 → condition 2 is false → stall suppressed. Safe default.

**Predicate 3 — tick armed:**
Inside `doTick`, `state.paused` is false by the guard at line 195. This predicate is always true when `doTick` is executing. It becomes relevant for the `/api/team-status` read-path: the route calls `getSchedulerState(threadId)` and checks `snapshot !== null && !snapshot.paused`.

**Predicate 4 — budget floor:**
`outputTokensBefore` (already computed at the top of `doTick` via `getThreadSpendSince(threadId, hourAgo)`) must be ≥ `STALL_BUDGET_FLOOR_TOKENS`. This guards against false stall on a freshly-started server that hasn't completed a full hour of ticking. A server that has spent < 5k output tokens this hour is likely in warm-up, not in a genuine stall.

**Threshold constants** — place alongside `RESCUE_THRESHOLD_MS` in `tick-scheduler.ts` for co-location, OR in `stall-detector.ts` as exports (preferred — keeps the module self-contained and testable):
```ts
export const STALL_MERGE_THRESHOLD_MS  = 3_600_000;  // 60 min
export const STALL_BUDGET_FLOOR_TOKENS = 5_000;       // min hourly output tokens confirming active run
```

### Module: `src/lib/stall-detector.ts`

A single-responsibility module. No timers, no side effects except DB writes and `console.warn`.

```ts
export interface StallCheckParams {
  threadId: string;
  workspace: string;
  hourlyOutputTokens: number;      // outputTokensBefore from doTick
  tickArmed: boolean;              // !state.paused
  now: () => number;               // SchedulerDeps.now injection for tests
}

export interface StallEvent {
  id: number;
  threadId: string;
  detectedAt: string;              // ISO-8601
  lastMergeAt: string | null;      // ISO-8601 of last git commit on origin/main; null if never
  stallAgeMs: number;              // now - lastMergeAtMs
  backlogCount: number;
  hourlyTokens: number;
  acknowledged: boolean;
}

// Pure predicate — no DB writes. Returns stall info or null if no stall.
export function evaluateStall(params: StallCheckParams): Omit<StallEvent, 'id' | 'acknowledged'> | null

// DB write — call only when evaluateStall returns non-null.
// Deduplicates: skips insert if an unacknowledged event exists
// with detectedAt within the last STALL_MERGE_THRESHOLD_MS.
export function recordStallEvent(event: Omit<StallEvent, 'id' | 'acknowledged'>): void

// Read — used by /api/team-status. Returns the most recent unacknowledged stall event, or null.
export function getLatestUnackedStall(threadId: string): StallEvent | null

// Write — used by the Wave 82 PATCH /api/stall-ack endpoint.
export function ackStallEvent(threadId: string): void
```

`evaluateStall` is the testable pure core; DB helpers wrap it for production use.

### DB schema — `stall_event` table (additive)

Add to `db.ts` `CREATE TABLE IF NOT EXISTS` block:
```sql
CREATE TABLE IF NOT EXISTS stall_event (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id     TEXT    NOT NULL,
  detected_at   TEXT    NOT NULL,
  last_merge_at TEXT,
  stall_age_ms  INTEGER NOT NULL,
  backlog_count INTEGER NOT NULL,
  hourly_tokens INTEGER NOT NULL,
  acknowledged  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_stall_event_thread ON stall_event(thread_id, acknowledged);
```

No changes to `tick_log`. This is a net-new table; the additive migration pattern in `db.ts:130` is not needed (the `CREATE TABLE IF NOT EXISTS` covers first-run and restart).

### Hook point in `doTick` (after rescue sweep, before `logTick`)

```ts
// Wave 81 (#177): stall detector — after PO tick + rescue sweep, check if team is stalled.
const stallResult = evaluateStall({
  threadId: state.threadId,
  workspace,
  hourlyOutputTokens: outputTokensBefore,  // already computed at top of doTick
  tickArmed: !state.paused,
  now: state.deps.now,
});
if (stallResult) {
  console.warn(
    `[stall-detector] STALL thread=${state.threadId} stall_age_ms=${stallResult.stallAgeMs}` +
    ` backlog=${stallResult.backlogCount} hourly_tokens=${stallResult.hourlyTokens}` +
    ` last_merge=${stallResult.lastMergeAt ?? "never"}`,
  );
  recordStallEvent(stallResult);
}
```

The `console.warn` matches the `[tick-scheduler]` / `[stall-detector]` prefix convention used throughout the scheduler.

**Execution order in `doTick`:**
1. Budget check (pause guard)
2. `refreshGhState` (populate `pr_status` + `open_issue_count`)
3. PO tick (`runTurnWithDispatches`)
4. Rescue sweep (Wave 79/ADR-006)
5. **Stall check (Wave 81)** ← new, inserted here
6. `logTick`
7. Backoff / reschedule

### Deduplication rule

`recordStallEvent` must not insert a new row if the most recent stall event for this thread has `acknowledged = 0` AND `detected_at > now - STALL_MERGE_THRESHOLD_MS`. This prevents cascading rows on every tick during a prolonged stall. A new event is inserted only when:
- The stall condition was previously clear (no unacked event in the last 60 min), OR
- The previous event was acknowledged (user dismissed the banner).

Auto-clear: on the next tick where condition 1 does NOT hold (a new merge was detected), call `ackStallEvent(threadId)` to mark any unacked event as acknowledged.

### Structured log format

```
[stall-detector] STALL thread=<threadId> stall_age_ms=<n> backlog=<n> hourly_tokens=<n> last_merge=<ISO|never>
```

Single `console.warn` line. Parseable by log aggregators (key=value pairs after the prefix). Emitted once per new stall event (dedup prevents repeat logging on every tick).

### `/api/team-status` `stall` field (Wave 82 consumer contract)

Add to `TeamStatus` in `src/types.ts`:
```ts
stall: {
  active: boolean;
  detectedAt: string;    // ISO-8601
  stallAgeMs: number;
  backlogCount: number;
} | null;
```

The route (`src/app/api/team-status/route.ts`) adds:
```ts
const stallEvent = getLatestUnackedStall(threadId);
const stall = stallEvent
  ? { active: true, detectedAt: stallEvent.detectedAt, stallAgeMs: stallEvent.stallAgeMs, backlogCount: stallEvent.backlogCount }
  : null;
```

And includes `stall` in the `NextResponse.json({...})` return. Wave 82 reads this field to render the red banner and fire the browser Notification.

### `tick_log` coupling note

Wave 79 (#176) added `rescues_emitted` to `tick_log` via additive ALTER TABLE migration. Wave 81 does NOT modify `tick_log`. The only coupling is **execution-order**: Wave 81's `doTick` additions are inserted after the rescue sweep block (lines 272–304 in the current file). To avoid merge conflicts, **Wave 81 impl MUST NOT begin until #176 is merged and the server has restarted** to confirm the rescue sweep code is live. Attempting to merge Wave 81 against a pre-#176 `tick-scheduler.ts` will produce a conflict in `doTick`.

## Consequences

**Positive:**
- Stall alarm is structural (fired inside the scheduler tick), not prompt-dependent.
- `evaluateStall` is a pure function — no DB calls, injectable `now()`, directly unit-testable without a running scheduler.
- Wave 82 gets a clean, typed contract: a single `stall` field on the existing `/api/team-status` endpoint. No new endpoint needed for reads.
- Dedup rule prevents log spam and DB growth during prolonged stalls.

**Negative / guardrails:**
- `git log origin/main` is a synchronous `execSync` call inside `doTick`. Failure mode: git slow or unavailable → fallback treats condition 1 as true (conservative: prefer false positive stalls over missed stalls). Budget gate and rescue sweep are not affected.
- `STALL_BUDGET_FLOOR_TOKENS = 5_000` is an assumed threshold. If a legitimate team run produces fewer than 5k output tokens per hour (very quiet sessions), stall detection is suppressed. Architect notes this as an OQ for BE Dev to tune against observed `turn_usage` data from real sessions — flag it if first-week data suggests the floor needs adjustment.
- The `acknowledged` flag is per-thread, not per-user. Single-user deployment assumption; no multi-user ack conflict.
- Stall detection does not fire when the scheduler is paused (predicate 3). This is intentional: a deliberately paused scheduler is not a stall.

## OQs for BA to fold into US-035

- **OQ-US035-1 (threshold tuning):** Is 60min the right `STALL_MERGE_THRESHOLD_MS`? Context: our typical wave cycle is 20–40 min end-to-end; 60 min gives 1.5× the fast path before alarming. BE Dev should surface observed wave durations from `tick_log` post-#176 to calibrate.
- **OQ-US035-2 (budget floor tuning):** Is 5k tokens/hr the right `STALL_BUDGET_FLOOR_TOKENS`? This should be verified against actual `turn_usage.output_tokens` data from quiet idle sessions vs. active sessions.
- **OQ-US035-3 (git availability):** Should stall detection silently skip (no alarm) when workspace is not a git repo, or alarm with `lastMergeAt = null`? Current design: alarm (conservative). BA should confirm the desired behavior for repo-less workspaces.

## Test plan (BE Dev implements; QA designs assertions)

1. **All four conditions true → stall fires** — inject `now=T+61min`, `backlog=5`, `hourlyTokens=10000`; assert `evaluateStall` returns non-null, `recordStallEvent` inserts a row, `console.warn` emitted.
2. **Missing condition suppresses stall:**
   a. Recent merge (merge at T, now=T+30min) → null.
   b. Backlog=0 → null.
   c. Budget below floor (hourlyTokens=100) → null.
3. **Dedup — no double row:** second call with same stall conditions within STALL_MERGE_THRESHOLD_MS → `recordStallEvent` skips insert (1 row in DB).
4. **Auto-clear on merge:** after stall fires, next tick with merge at T+65min; assert `ackStallEvent` marks acknowledged=1, `/api/team-status` returns `stall: null`.
5. **`getLatestUnackedStall` returns null on empty DB / acknowledged row** — empty table → null; acknowledged row → null.
6. **`/api/team-status` includes `stall` field** — response includes `stall: { active: true, ... }` when unacked event exists.

Use `SchedulerDeps.now` injection for time control. `execSync` for `git log` can be mocked via `vi.mock("node:child_process")` in unit tests; integration tests should run against a real git workspace.

## Recurring rule

**Stall detection is a pure predicate (`evaluateStall`) that owns its own DB table (`stall_event`). It does NOT modify `tick_log` or any existing table.** Any future stall-condition tuning touches only the threshold constants and the predicate logic in `stall-detector.ts`. The scheduler's `doTick` is only the call site, not the logic owner.
