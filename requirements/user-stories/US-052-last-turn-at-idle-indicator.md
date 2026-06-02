---
id: US-052
title: last_turn_at idle indicator — schema, write trigger, API + MCP exposure (Wave 97)
status: done
wave: 97
closes: "#198"
owner: BE Dev
created: 2026-06-02
accepted: 2026-06-02
impl: "bc94f7e"
---

## Story

As the Product Owner, I want a reliable `last_turn_at` timestamp on each agent's state so that `get_peer_idle_state` can distinguish genuinely idle agents (no completed turn for >15 min) from agents that simply haven't updated their HANDOFF doc string recently, eliminating false-idle rescue ticks.

## Background

The rescue-tick loop triggered false positives because `get_peer_idle_state` used HANDOFF doc length as an idle proxy. An agent that updated its HANDOFF mid-wave but then waited for a gate looked "idle" to the MCP tool. `last_turn_at` records the wall-clock time of every completed turn (success + error paths) and lets `isIdleByTurnAt` use a 15-minute threshold instead.

## Acceptance criteria

1. `agent_state` table: `last_turn_at INTEGER` column added via idempotent boot migration (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).

2. `stampTurnAt()` helper in `db.ts` called on every completed turn (both success and error paths in `run-turn.ts`).

3. `IDLE_THRESHOLD_MS = 15 * 60 * 1000` exported constant (15 min).

4. `getAgentState` / `listAllAgentStates` return `lastTurnAt`; `AgentState` type updated.

5. `NULL` fallback: fresh rows (no turn ever completed) return `lastTurnAt: null`; `isIdleByTurnAt` treats `null` as not-idle (agent hasn't run yet, not stalled).

6. `/api/team-status` context panel exposes `lastTurnAt` per role.

7. `get_peer_idle_state` MCP tool returns `lastTurnAt` and `isIdleByTurnAt` (boolean, based on `IDLE_THRESHOLD_MS`).

8. UI label rendering (idle badge on agent pane) deferred to follow-up wave to avoid collision with US-054 UI work.

## Technical constraints

- Migration must be idempotent: safe to run on a DB that already has the column.
- `stampTurnAt` must be called in BOTH success and error paths of `run-turn.ts` — a failed turn is still a turn.
- `getAgentState` additional SELECT blessed by Architect (no N+1 concern at single-agent-per-request scope).

## Out of scope

- UI idle badge rendering (deferred per AC8 — follow-up wave).
- `isIdleByTurnAt` threshold configurability via env var (hardcoded constant for Wave 97).

## Implementation

- impl: `bc94f7e` (PR #232, merged locally `769adbb` — push to origin in progress as of Wave 97)
- Tests: `tests/be/agent-state-last-turn-at.test.ts` + `tests/be/db-last-turn-at.test.ts` (7 unit tests)

## Notes

- Architect code review PASS: extra `getAgentState` SELECT blessed; `stampTurnAt` scope correct.
- `.restart-trigger` bump required post-merge (MCP module graph: `db.ts` + `run-turn.ts` + `tools.ts`).
