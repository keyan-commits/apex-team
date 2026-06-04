---
id: US-038
title: listActiveTickThreads missing try/catch
slug: listactiveticksthreads-try-catch
status: superseded
owner: backend-developer
raised: 2026-06-02
closes: "#185"
---

## Resolution — superseded by Plan C cutover

All ACs target `src/lib/db.ts` `listActiveTickThreads()` — a monolith file and function retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). There is no SQLite DB or boot-path tick re-arm sweep under the subagent runtime.

# US-038 — listActiveTickThreads Missing try/catch — Boot-Path Crash Prevention

## Narrative

As the apex-team server operator, I want the server-start re-arm sweep to degrade gracefully if the database is temporarily unavailable at boot, so that a DB hiccup (corrupted WAL, permission error, disk full) doesn't crash the server on startup.

## Acceptance Criteria

- **AC1:** `src/lib/db.ts` `listActiveTickThreads` wraps its `db()` call body in `try { … } catch { return []; }` — consistent with `getScoutMeta`, `getSpendSummary`, and `getThreadSpendSince` in the same module.

- **AC2:** A unit test confirms that when a DB-throwing mock is provided, `rearmActiveThreads` (the caller in `tick-scheduler.ts` boot-path) returns without throwing — no crash, 0 threads re-armed. (Test target: `src/lib/db.test.ts` or `tests/lib/tick-scheduler.test.ts`.)

- **AC3:** When the catch fires, a `console.warn` is emitted with the exact signature: `warn('[db] listActiveTickThreads error: ', <error>)` so the degradation is observable in server logs.

- **AC4:** Normal path (no error) is unchanged — all existing tests on `listActiveTickThreads` pass without modification.

## Out of Scope

- Changes to ADR-008 itself (documented fix; Architect may update ADR-008 separately to note the pattern).
- Retry logic or exponential backoff (degrade-to-empty-list is the prescribed behavior per ADR-008).

## Technical Notes

_For implementer reference, not acceptance criteria._

- Current state: `src/lib/db.ts:751` — `listActiveTickThreads` has no try/catch; all other fallible DB helpers used outside the request path do.
- Impact: If SQLite is unavailable at boot, an uncaught exception in the `server.listen` callback crashes the process instead of logging a warning and re-arming 0 threads.
- Pattern to follow: 
  ```ts
  function listActiveTickThreads(): string[] {
    try {
      const threads = db().prepare(...).all(...);
      return threads.map(row => row.thread_id);
    } catch (err) {
      console.warn('[db] listActiveTickThreads error: ', err);
      return [];
    }
  }
  ```

## Links

_(Filled in during implementation)_

- impl: (pending)
- test: (pending)
- qa-pass-by: (pending)
