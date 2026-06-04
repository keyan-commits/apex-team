---
id: US-039
title: Stall detector console.warn fires every 20s during prolonged stall
slug: stall-detector-log-spam
status: superseded
owner: backend-developer
raised: 2026-06-02
closes: "#181"
---

## Resolution — superseded by Plan C cutover

All ACs target `src/lib/tick-scheduler.ts` — a monolith file retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). ADR-007 and the stall detector were monolith constructs; neither exists under the subagent runtime.

# US-039 — Stall Detector Log-Spam Fix (ADR-007 Violation)

## Narrative

As a team operator, I want stall-detector log entries to fire once per new stall event, so that my server logs are not flooded during a prolonged stall and log aggregation systems don't false-alarm on warn count.

## Acceptance Criteria

- **AC1:** `console.warn('[stall-detector] STALL ...')` in `src/lib/tick-scheduler.ts` fires at most once per new stall event insert, not on every tick where the stall condition holds. During a 60-minute stall, expect ≤2 warn lines (onset + any re-arm after dismissal + re-fire); not ~180 warn entries per hour.

- **AC2:** Subsequent ticks during the same stall (where `recordStallEvent` dedup-skips the insert because `STALL_MERGE_THRESHOLD_MS` window is still open) produce no additional warn lines.

- **AC3:** When the stall clears (stall condition resolves) and a new stall subsequently fires, the warn fires once for the new event. Stall transitions are logged exactly once per transition.

- **AC4:** The signature and format of the warn line when it *does* fire is unchanged — tests expect the same output shape as before, just with frequency reduction.

## Out of Scope

- Changes to stall detection logic itself (threshold, criteria, DB schema).
- Changes to auto-clear behavior when stall condition resolves.

## Technical Notes

_For implementer reference, not acceptance criteria._

- Current state: `src/lib/tick-scheduler.ts` lines ~331–339 — `console.warn(...)` is inside `if (stallResult)` but OUTSIDE `recordStallEvent`'s dedup check. Result: ~180 warn entries per hour during a 60-min stall.
- Root cause: `recordStallEvent` is called every tick to ensure the DB is consistent, but whether it skips or inserts (dedup), the warn fires unconditionally.
- ADR-007 § Structured log format states: "Emitted once per new stall event (dedup prevents repeat logging on every tick)." Current impl violates this.
- Proposed fix pattern:
  1. `recordStallEvent` returns `boolean`: `true` = row inserted (new event), `false` = dedup skipped.
  2. Move `console.warn` to fire only when `recordStallEvent` returns `true`.
  3. Wave 82 established a clean onset-detection pattern (`prevStallActiveRef` ref) on the dashboard side; this backend pattern mirrors that discipline at the scheduler tick level.

## Links

_(Filled in during implementation)_

- impl: (pending)
- test: (pending)
- qa-pass-by: (pending)
