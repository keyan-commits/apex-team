# DB Recovery — SQLite Migration Crash Safety

## Overview

Every schema migration runs inside a `BEGIN IMMEDIATE` transaction and is
tracked in the `_schema_version` table. If the server process is killed mid-
migration (L1 launchd respawn, `kill -9`, power cut), the transaction is rolled
back by SQLite automatically.

The server also writes a `data/.migration-in-flight` flag file at the start of
any migration run and removes it only on successful completion. On the next
boot, the presence of the flag causes the server to **refuse to start** with a
clear `MIGRATION CRASH DETECTED` error rather than silently operating on a
potentially inconsistent schema.

## Diagnosing a stuck migration

1. **Locate the flag file**

   ```sh
   ls -la data/.migration-in-flight
   # Shows the timestamp the migration started
   ```

2. **Check `_schema_version` for the last recorded state**

   ```sh
   sqlite3 data/apex-team.db \
     "SELECT version, datetime(applied_at/1000, 'unixepoch'), success FROM _schema_version ORDER BY version;"
   ```

   - `success = 1` — migration applied cleanly
   - `success = 0` — migration attempted and failed (rolled back)
   - Missing row — migration never started (safe to retry)

3. **Check the DB schema directly** to confirm whether a column actually exists

   ```sh
   sqlite3 data/apex-team.db ".schema thread_config"
   sqlite3 data/apex-team.db ".schema agent_state"
   sqlite3 data/apex-team.db ".schema tick_log"
   ```

## Safe manual repair

If the schema looks consistent (all expected columns present, no partial tables),
the flag file is the only thing blocking the restart:

```sh
# Verify columns manually first (see step 3 above), then:
rm data/.migration-in-flight
# Restart the server normally — it will re-run any migrations with success=0
# or missing from _schema_version, skipping columns that already exist.
```

If a migration row has `success = 0`, the server will retry it on the next boot.
The migration code uses `PRAGMA table_info()` to skip columns that already exist,
so retries are safe.

## WAL mode

The server always opens the DB with `PRAGMA journal_mode = WAL`. WAL mode
provides:
- **Durability** — committed transactions survive an abrupt process exit.
- **Concurrency** — readers don't block writers and vice versa.
- **Crash safety** — an uncommitted transaction is automatically rolled back on
  the next DB open, leaving the file in a consistent state.

To confirm WAL is active on a running DB:

```sh
sqlite3 data/apex-team.db "PRAGMA journal_mode;"
# Should return: wal
```

## Backup before manual repair

Always snapshot the DB before any manual intervention:

```sh
cp data/apex-team.db data/apex-team.db.backup-$(date +%Y%m%d-%H%M%S)
```
