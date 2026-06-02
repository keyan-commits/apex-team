# ADR-006 — PO HANDOFF Auto-Promote + Tick Rescue Sweep

- **Status:** Accepted
- **Date:** 2026-05-28 (Wave 79)
- **Wave:** 79
- **Issue:** #171 (closes)
- **Relates to:** ADR-007 (Server-Side Stall Detector — executed after the rescue sweep in `doTick`)

## Context

The tick scheduler (ADR-004) fires the PO turn every 20 s, but two gaps existed in
the round-trip reliability of cross-role coordination:

1. **HANDOFF auto-promote** — if the PO received a HANDOFF message from a peer, the
   scheduler had no mechanism to auto-trigger a PO turn to process it. The message
   sat in the inbox until the next scheduled tick.
2. **Rescue sweep** — if a dispatched peer's turn failed silently (crash, timeout, SDK
   error) the scheduler had no recovery path. The dispatched slot stayed "in flight"
   indefinitely and no subsequent tick would re-fire it.

Both gaps meant that a single failed turn could stall the pipeline indefinitely with no
observable alarm or automatic recovery.

## Decision

**On each tick, after the PO turn fires, run a rescue sweep:**

1. **HANDOFF auto-promote:** any HANDOFF addressed to the PO that arrived since the PO's
   last turn is promoted into the PO's next turn context automatically — the tick scheduler
   reads the inbox and injects it into the system-prompt addendum rather than waiting for
   a manual "process inbox."

2. **Rescue sweep:** scan the `dispatches` table for peer turns that were dispatched
   > `RESCUE_THRESHOLD_MS` ago without a completion row in `agent_state`. For each stale
   slot, emit a re-dispatch to that role. Add `rescues_emitted` to `tick_log` (additive
   ALTER TABLE migration, Wave 79).

Execution order in `doTick` (see ADR-007 §Hook point for the full sequence):
1. Budget check / pause guard
2. `refreshGhState`
3. PO tick (`runTurnWithDispatches`) — auto-promote fires here
4. **Rescue sweep** ← this ADR
5. Stall check (ADR-007)
6. `logTick`
7. Backoff / reschedule

## Consequences

**Positive**
- A failed peer turn self-recovers on the next tick without operator intervention.
- PO's context always includes pending HANDOFFs — reduces the "PO didn't see it" stall class.

**Negative / guardrails**
- Rescue can re-dispatch a turn that is actually in flight but slow (network lag, large
  context). `RESCUE_THRESHOLD_MS` must be set conservatively above the p99 turn duration
  to avoid duplicate dispatches.
- `rescues_emitted` counter in `tick_log` provides observability; spikes indicate systemic
  instability upstream of the scheduler.

## Note (recovered stub)

This file was reconstructed from commit `a873423` (Wave 79, PR #176) and ADR-007's
execution-order comment. The original ADR-006 file was never committed to disk — likely
drafted in-session and lost before the PR was opened. The decision itself is implemented
and confirmed live. If the original detailed spec is later found, supersede this stub.
