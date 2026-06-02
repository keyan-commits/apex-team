## Done
- Fixed non-deterministic mock-ordering bug in `tests/be/dispatch-model-override.test.ts` — swapped `vi.doMock` and `vi.resetModules()` ordering in the "no-model" test case so CI's resolver can't pick up the `beforeEach` opus-factory. Unblocks main CI on `6e6030c`.

## In flight
- PR #254 (new) — test-fix to unblock main. Awaiting Architect fast-gate.
- #252 merge still HELD pending main going green.

## Next
- After Architect PASS + main green: nothing more from BE on Wave 100.

## Notes
- Production fix (`run-turn.ts` / `run-turn-with-dispatches.ts`) is correct and untouched — only `tests/be/dispatch-model-override.test.ts` changed.
- 374/374 tests, 0 type errors confirmed locally.
