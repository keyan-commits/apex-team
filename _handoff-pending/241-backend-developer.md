## Done
- Closed #241: per-dispatch `model:` override no longer leaks to sticky `thread_config`.
- Removed `setThreadAgentModels` call for dispatch overrides from `run-turn.ts` (lines 138-147).
- Applied per-dispatch model transiently in `run-turn-with-dispatches.ts` at fan-out time (`peerAgents` override).
- Updated `tests/lib/run-turn.test.ts` to assert the correct behavior (NOT written to DB).
- Added `tests/be/dispatch-model-override.test.ts`: DB non-leak + transient application + AGENT-MODELS sticky still works.
- 374/374 tests pass, 0 type errors.

## In flight
- PR open, awaiting Architect gate.

## Next
- After Architect PASS → HANDOFF QA (no new user-facing surface, smoke is N/A but QA should confirm).
- DevSecOps merges after QA PASS.

## Notes
- `[[AGENT-MODELS]]` block is still correctly sticky (that's intentional thread-level assignment).
- The fix also corrects a secondary bug: dispatch model now actually applies to the CURRENT dispatch turn (previously it was written to DB post-turn, peer got stale agents).
