# ADR-004 — Tick MUST Invoke `runTurnWithDispatches`, Not Bare `runTurn`

**Date:** 2026-06-01
**Status:** Accepted
**Requirement:** US-026 (server-side PO tick scheduler); blocks #156 (fan-out path gap).

## Context

There are two ways to advance a thread:

- `runTurn` — runs a single role's turn, persists its reply, parses NOTES/HANDOFF/DISPATCH blocks. It records dispatch rows but **does not execute** the dispatched peers' turns.
- `runTurnWithDispatches` — runs the PO turn, then **fans out**: for each `[[DISPATCH: role]]` block, runs that peer's turn (with the dispatch body as `userMessage`, per the #137 fix).

#156 forensics (msg-id ordering + `src/mcp/tools.ts:124`) established empirically that `talk_to_role` calls bare `runTurn`, so peers dispatched within a relayed turn never actually fire — the dispatch is recorded but the peer stays asleep. Only the web-UI path (`talk_to_product_owner` → `runTurnWithDispatches`) fans out today.

The Wave 71 tick is a synthetic `talk_to_product_owner` equivalent. If the tick called bare `runTurn`, the PO would emit dispatches every tick that **never wake their targets** — the exact silent-drop failure mode #156 documents, now on a 20–120s timer. The whole point of server-side ticks (autonomous team continuation) would be defeated: the PO would talk to itself while peers idle.

## Decision

The tick code path **MUST invoke `runTurnWithDispatches`**, never bare `runTurn`. The PO's tick turn fans out its dispatches exactly as a user-driven `talk_to_product_owner` does.

Corollary (the BA-seed carve-out): `talk_to_product_owner` seeds a BA HANDOFF on every call (`tools.ts:155`). The tick path **MUST skip that seed** — re-seeding BA every 20–120s would spam BA's inbox. The tick branches around the seed while still using the fan-out runner.

## Consequences

**Positive:**
- Server-side autonomy actually works: a tick wakes the PO *and* the peers the PO dispatches, in one fan-out.
- Establishes a structural invariant: any future "synthetic turn" feature (auto-retry, cron-driven turns, scheduled reviews) inherits "use the fan-out runner, skip the seed."

**Negative:**
- A tick can cascade into N peer turns, so a single tick's cost is bounded by fan-out breadth, not one turn. This is the motivation for the ADR-003 budget cap and the per-thread mutex (`thread-lock.ts`) — without the mutex, a tick fan-out overlapping an external `talk_to_*` call would double-dispatch.

## Recurring rule

**Any code path that advances a thread on the team's behalf uses `runTurnWithDispatches` and skips the BA-seed.** Bare `runTurn` is for single-role, externally-driven turns only. A turn that emits dispatches but uses bare `runTurn` is a latent #156 — flag it in review.

## Compatibility

Depends on the #137 fix (`userMessage: d.message`, merged in PR #157 `92abd87`) and the #154 parser fix (same PR). Does **not** itself close #156 — #156's durable fix is this Wave 71 wiring plus making the relay (`talk_to_role`) path fan out. Complements ADR-003.
