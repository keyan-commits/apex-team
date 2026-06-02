## Done
- US-052 backend implemented on `feature/052-last-turn-at`
- `src/lib/db.ts`: idempotent `ALTER TABLE agent_state ADD COLUMN last_turn_at INTEGER` migration; `IDLE_THRESHOLD_MS = 15 * 60 * 1000` exported; `stampTurnAt(threadId, role)` helper (upserts only `last_turn_at`, never touches `handoff_doc`/`updated_at`); `getAgentState` + `listAllAgentStates` updated to SELECT + return `lastTurnAt`
- `src/types.ts`: `AgentState.lastTurnAt: number | null` added; `TeamStatus.context` items include `lastTurnAt: number | null`
- `src/lib/run-turn.ts`: `stampTurnAt` called unconditionally — both in the happy path (after `parseAgentReply`) and in the catch block (errored turns still stamp)
- `src/app/api/team-status/route.ts`: context panel now populates `lastTurnAt` per role from `agent_state`
- `src/mcp/tools.ts`: `get_peer_idle_state` enriched with `lastTurnAt` + `isIdleByTurnAt` from `agent_state`; keyed on `IDLE_THRESHOLD_MS`
- `tests/be/db-last-turn-at.test.ts` + `tests/be/agent-state-last-turn-at.test.ts`: 7 unit tests (stamp-on-turn, NULL-on-fresh-row, handoff-doc preserved, idempotent migration, API shape ×2)
- Pre-HANDOFF: `pnpm type-check` 0 ✓ · `pnpm test:run` 357/357 ✓

## In flight
- PR open — awaiting Architect gate

## Next
- AC2 UI label rendering (deferred to avoid collision with UI Dev's in-flight US-054 dashboard work)

## Notes
- Scope boundary respected: no UI component changes (dashboard label rendering is the follow-up UI wave)
- `peer_idle.is_idle` unchanged — complementary signal, not replaced
- `get_peer_idle_state` MCP tool now returns `isIdleByTurnAt` so PO rescue sweep can key off it
