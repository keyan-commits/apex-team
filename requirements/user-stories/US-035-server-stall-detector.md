# US-035 — Server-side stall detector

**Status:** superseded  
**Owner role:** backend-developer  
**Linked issue:** #177  
**Target wave:** Wave 81 (impl gated on #176 merge + server restart)  
**Created:** 2026-06-02  
**Last updated:** 2026-06-02 (ADR-007 fold — all 6 OQs resolved)

---

## Resolution — superseded by Plan C cutover

All ACs target `src/lib/stall-detector.ts`, `src/lib/tick-scheduler.ts`, SQLite `stall_event` table, and `/api/team-status` — all monolith constructs retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). The server-side stall detector depended on the tick scheduler (US-026) and `agent_state` SQLite table, both retired. Under the subagent runtime there is no persistent server to run a stall detector.

## Story

**As a** team operator  
**I want** the server to detect when the team has stalled and emit a structured alarm event + log line  
**So that** I am alerted automatically without manually polling the dashboard

---

## Acceptance Criteria

**AC1 — Stall predicate: ALL four conditions must hold simultaneously**

A stall alarm is triggered when **all** of the following are true at the time of a tick:

1. **No main merge in >60 min** — sourced via `git -C <workspace> log origin/main -1 --format="%at"` (epoch seconds). Threshold constant: `STALL_MERGE_THRESHOLD_MS = 3_600_000`. If git is unavailable or the command errors → treat as stalled (conservative fail-open). If `lastMergeAt` is null (non-git workspace), alarm fires.
2. **Backlog > 0** — reads `getPipelineState(threadId, 'open_issue_count')`. Already set each tick (Wave 72 blackboard) — no additional API call needed. If key is absent → treat as 0 (no stall; no false positives on fresh installations).
3. **Tick armed** — `!state.paused` inside `doTick`. For API read-path: `getSchedulerState(threadId)?.active && !paused`. Paused ticks (via `/mcp pause_ticks`) suppress the stall alarm even when all other predicates hold.
4. **Budget floor not breached** — `outputTokensBefore >= STALL_BUDGET_FLOOR_TOKENS` where `STALL_BUDGET_FLOOR_TOKENS = 5_000`. Guards against false stalls on fresh server starts and low-activity idle sessions.

If any condition is false, no alarm is emitted. The check is idempotent within a stall episode — the alarm emits **once on stall onset** (transition from not-stalled → stalled), then is suppressed until the stall clears and re-triggers.

**AC2 — Structured alarm event emitted**

On stall detection, the module emits a structured alarm event with at minimum:
- `type: "stall"`
- `ts: number` — Unix epoch ms at detection
- `threadId: string`
- `mergeAgeMs: number` — ms since last main merge (`Date.now() - lastMergeAt`); `Infinity` if git unavailable
- `backlogCount: number`
- `stallAgeMs: number` — age of the stall since first detection (0 on onset)
- `predicates: { noRecentMerge: true, backlogPresent: true, tickArmed: true, budgetFloorMet: true }`

This event object is the canonical signal Wave 82 consumes (via `/api/team-status` `stall` field).

**AC3 — Structured log line on stall**

On stall detection, a `console.warn` line is emitted containing all alarm fields in a machine-parseable format (JSON-serialised alarm event, prefixed `[STALL_ALARM]`).

**AC4 — New `src/lib/stall-detector.ts` module**

- A new file `src/lib/stall-detector.ts` encapsulates all stall-detection logic.
- Exports: `evaluateStall(params: StallParams): StallAlarmEvent | null` (sync evaluation), `recordStallEvent(db, event)`, `getLatestUnackedStall(db, threadId)`, `ackStallEvent(db, id)`.
- `StallParams` / deps mirror the `SchedulerDeps` seam (injectable `now`, no real timers, no real `Date.now()` calls in tests).
- Thresholds are exported named consts:
  - `STALL_MERGE_THRESHOLD_MS = 3_600_000`
  - `STALL_BUDGET_FLOOR_TOKENS = 5_000`

**AC5 — New `stall_event` table (additive migration)**

- A new `stall_event` table is created by `src/lib/db.ts` (additive `CREATE TABLE IF NOT EXISTS` + additive `ALTER TABLE` migration pattern — no `tick_log` columns added).
- Schema: `id INTEGER PRIMARY KEY AUTOINCREMENT, thread_id TEXT, detected_at INTEGER, merge_age_ms INTEGER, backlog_count INTEGER, acked INTEGER DEFAULT 0`.
- `tick_log` is **NOT modified** by this story.
- Impl is blocked on `#176` merge + server restart (post-#176 `doTick` shape required).

**AC6 — Integration into `tick-scheduler.ts`**

- `doTick()` calls `evaluateStall()` + `recordStallEvent()` as the last step before `logTick` (after PO turn + rescue sweep).
- Onset dedup: skip `recordStallEvent` if an unacked `stall_event` row exists with `detected_at` within the last 60 min (`STALL_MERGE_THRESHOLD_MS`).
- `isNoOp` logic is unchanged (stall detection alone does not mark a tick as non-no-op unless a dispatch was also emitted).

**AC7 — `/api/team-status` response shape**

The endpoint gains a new top-level field:

```typescript
stall: {
  active: boolean,
  detectedAt: number | null,   // epoch ms of onset
  stallAgeMs: number | null,   // ms since onset
  backlogCount: number | null
} | null
```

`null` when no unacked stall event exists. `active: false` is not emitted — absence of the field or `null` means no stall. This is the Wave 82 (US-036) consumption contract.

**AC8 — Tests**

- New test file `tests/lib/stall-detector.test.ts`.
- Must cover: all-four-predicates case (stall fires), any-one-predicate-false cases × 4 (stall suppressed), idempotent-within-stall-episode (onset emits once, subsequent ticks suppressed while unacked), git-unavailable case (treats as stalled).
- Uses injectable `deps.now` — no real timers or real DB calls.
- All pre-existing `tick-scheduler.test.ts` tests remain green.

**AC9 — Single-PR target**

`src/lib/stall-detector.ts`, updated `src/lib/tick-scheduler.ts`, updated `src/lib/db.ts` (migration + stall_event table), and `tests/lib/stall-detector.test.ts` ship in a single PR (`feature/81-stall-detector`).

---

## Resolved OQs (ADR-007, 2026-06-02)

All 6 original OQs are resolved. Calibration OQs below are accepted defaults; they are tunable post-launch once observed against real production wave data.

| OQ | Resolution | Source |
|----|-----------|--------|
| OQ-US035-1: last-merge timestamp source | `git -C <workspace> log origin/main -1 --format="%at"` (epoch secs). Git unavailable → stalled (conservative). | ADR-007 |
| OQ-US035-2: backlog count definition | `getPipelineState(threadId, 'open_issue_count')` — set by tick each cycle, no extra GH API call. Absent key → 0 (no stall). | ADR-007 |
| OQ-US035-3: budget floor value | `STALL_BUDGET_FLOOR_TOKENS = 5_000`. **Calibration OQ:** verify threshold against real turn_usage in idle vs. active sessions once #176 is live. | ADR-007 |
| OQ-US035-4: "tick armed" definition | `!state.paused` inside `doTick`. Paused ticks suppress alarm. | ADR-007 |
| OQ-US035-5: onset vs. continuous emission | Onset-only. Suppress re-emission while unacked stall_event row exists with age < `STALL_MERGE_THRESHOLD_MS`. | ADR-007 |
| OQ-US035-6: alarm persistence | New `stall_event` table (not `pipeline_state` column, not in-memory only). Survives restart; no new tick_log columns. | ADR-007 |

**Calibration OQs (accepted defaults, tunable post-launch):**
- **Cal-1:** 60 min threshold — calibrate against observed wave durations once #176 is live; may adjust `STALL_MERGE_THRESHOLD_MS` down to 45 min if waves consistently complete faster.
- **Cal-2:** 5k token floor — verify against real `turn_usage` idle vs. active sessions; adjust `STALL_BUDGET_FLOOR_TOKENS` if false positives appear on low-traffic servers.
- **Cal-3:** Non-git workspace (git unavailable) → `alarm with lastMergeAt=null`. Alternative: skip alarm. Current design alarms (conservative). Revisit if this produces noise on non-git setups.

---

## Implementation Notes

- `evaluateStall` is pure sync: takes params, returns event-or-null. No side effects — caller (`doTick`) owns DB write + log.
- All threshold consts live in `stall-detector.ts` and are re-exported for tests.
- Wave 82 UI story (US-036) consumes the alarm via `/api/team-status` `stall` field (AC7 above is Wave 81's responsibility — it ships the field; US-036 renders it).

---

## Related User Stories

- **US-026** — Server-side PO tick scheduler (tick_log schema, TickState, SchedulerDeps seam)
- **US-036** — Stall notification UI (Wave 82 — consumes this story's `stall` field on `/api/team-status`)
- **US-031** — HANDOFF inbox rescue (Wave 79 — adds `rescues_emitted` to tick_log; post-#176 schema required before impl)
- **ADR-007** — `architecture/decisions/ADR-007-server-side-stall-detector.md` — authoritative design + test plan

---

## Scope Notes

- **Out of scope:** UI notification, banner, browser push notification (US-036).
- **Out of scope:** stall auto-recovery actions — detection and alerting only.
- **Out of scope:** per-role stall detection — this is a whole-team stall predicate.

---

## Definition of Done

- [x] All 6 OQs resolved (ADR-007, 2026-06-02).
- [ ] AC1–AC9 implemented as specified.
- [ ] `tests/lib/stall-detector.test.ts` passes: 8+ test cases (all-4-predicates + 4 single-false + onset idempotency + git-unavailable).
- [ ] All pre-existing `tick-scheduler.test.ts` tests remain green.
- [ ] Type-check: 0 errors. Lint: 0 errors.
- [ ] `stall_event` table visible in DB post-migration.
- [ ] `/api/team-status` returns `stall: { active, detectedAt, stallAgeMs, backlogCount }` on active stall.
- [ ] HANDOFF.md updated with wave + PR link before pushing.

---

_Business Analyst · 2026-06-02 (updated with ADR-007 resolutions)_
