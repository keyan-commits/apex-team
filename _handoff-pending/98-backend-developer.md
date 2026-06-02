## Done
- Fixed #191: moved `DB_PATH` computation inside lazy `db()` + added `/*turbopackIgnore: true*/` to both `process.cwd()` calls. `pnpm build` now emits 0 Turbopack warnings. 369/369 tests pass, type-check clean.
## In flight
- PR #NNN (feature/191-db-nft-overtrace) — awaiting Architect gate.
## Next
- Idle after gate. Pick up next unblocked BE story from backlog.
## Notes
- Two-part fix was needed: moving compute inside `db()` alone wasn't sufficient — Turbopack traces `process.cwd()` anywhere in the import chain. The `/*turbopackIgnore: true*/` inline comment (documented in the build warning itself) is the actual suppressor.
