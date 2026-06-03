# US-082 — SQLite migration crash-safety (transaction + version flag)

**Status:** accepted
**Owner role:** backend-developer (Architect reviews transaction boundaries)
**Created:** 2026-06-03
**Story ID:** US-082
**UX gate:** skip — pure backend, no UI surface

---

## Narrative

As the apex-team server, when I am restarted abruptly by the L1 launchd respawn or L2 self-exit while a SQLite schema migration is mid-flight, I want each migration to be either fully applied or fully rolled back so that the next start finds a consistent DB and never enters a startup loop because of a partial migration.

## Acceptance Criteria

- **AC1 — Migration atomicity:** Given any migration step in `src/lib/db.ts`, when the migration runs, then it executes inside a single `BEGIN IMMEDIATE; ...; COMMIT;` transaction. Multi-step migrations (e.g. ALTER TABLE + data backfill + add constraint) live inside ONE transaction, not multiple.
- **AC2 — Version-flag guard:** Given a migration run is starting, when the migration begins, then `data/.migration-in-flight` is created. Given the migration commits successfully, when the transaction commits, then the flag is removed. On server boot, if the flag exists, then the server logs a clear ERROR, refuses to start, and surfaces a macOS notification + dashboard banner prompting the user to inspect and repair before retrying.
- **AC3 — Schema version table:** Given the DB is initialized, when the server boots, then a `_schema_version` table exists with columns `version`, `applied_at`, `success` (bool). Migrations are skipped when the current version is already applied. A rolled-back attempt is recorded with `success=false`.
- **AC4 — Test coverage — normal path:** Given a clean DB, when the server initializes, then all migrations run successfully and `_schema_version` reflects the current version with `success=true`.
- **AC5 — Test coverage — simulated crash mid-migration:** Given a migration is injected with a failure point mid-transaction (via a test hook or error injection — NOT a live process kill), when the transaction is aborted, then the next boot detects `data/.migration-in-flight` and refuses to start with a clear error. The DB is not silently corrupted.
- **AC6 — Test coverage — resume from flag:** Given `data/.migration-in-flight` exists from a prior aborted run and the user manually removes it, when the server boots, then it succeeds and applies any outstanding migrations forward.
- **AC7 — Documentation:** `docs/operations/db-recovery.md` is created or updated. It explains the flag-file pattern, how to inspect a stuck migration, and the safe manual-repair steps (rm flag, inspect `_schema_version`, re-start).
- **AC8 — WAL mode explicit:** Given the server initializes the DB, when the connection is opened, then `journal_mode=WAL` is set explicitly (not left to SQLite default). The setting and its rationale are documented in `docs/operations/db-recovery.md`.

## Out of Scope

- Automatic recovery / self-repair of a corrupted DB without user intervention — the design intent is "refuse to start + ask the user", not silent repair. Tracked as a future story if needed.
- Migration rollback *plan* (down migrations) — apex-team's migrations are additive-only; rollback means restore from backup, not running a down script. Not included because the schema is simple and down migrations add maintenance cost; if down migrations become necessary they will be a separate story.
- Live process kill in tests — AC5 uses error injection, not `SIGKILL`, because in-process SQLite cannot survive a process kill mid-transaction; the guard is the flag file, which would remain on disk after a kill and is tested via AC6.

## Open Questions

- **OQ-319-001:** The existing `src/lib/db.ts` migration code — does it currently use `better-sqlite3`'s transaction API (`db.transaction()`) or raw `db.exec()` strings? If the latter, the AC1 fix is a direct wrapping; if the former, the boundary is already present but may not use `BEGIN IMMEDIATE`. Architect to confirm during code review.

## Design Spec

Non-UI story — section removed.

## Links

_(Filled in during implementation)_

- Closes: [#319](https://github.com/keyan-commits/apex-team/issues/319)
- impl: `(SHA-pending)`
- test: `(pending)`
- qa-pass-by: `(pending)`
- deployed-by: `(pending)`
