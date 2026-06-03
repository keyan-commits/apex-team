## Done
- apex-team #319: SQLite migration crash-safety shipped on `feature/319-sqlite-migration-crash-safety`
- Replaced 4 bare try/catch ALTER TABLE calls with versioned MIGRATIONS array
- `applyMigrations()`: `BEGIN IMMEDIATE` transaction per migration, `_schema_version` table records version/applied_at/success
- `data/.migration-in-flight` flag file guard: written before any migration run, removed on success; next boot throws `MIGRATION CRASH DETECTED` if flag is present
- `tableColumns()` PRAGMA check makes each migration idempotent (safe on existing DBs with columns already present)
- 7 integration tests: normal path, crash detection, error message content, resume-after-repair, idempotency on existing columns, WAL mode active
- `docs/operations/db-recovery.md`: flag-file pattern, WAL mode rationale, manual repair steps
- pnpm type-check: zero errors; pnpm test:run: 458/458 pass (55 files)

## In flight
- Awaiting Architect code review PASS on this PR

## Next
- After Architect PASS → HANDOFF to QA for re-gate on :3100
- After QA PASS → HANDOFF to DevSecOps to merge to main

## Notes
- Non-UI runtime change — no UX gate needed
- WAL mode was already set (line 21) — documented in db-recovery.md but no code change required
- `migrateRetiredModels()` unchanged (data migration, separate from schema migrations)
