## Done
- `POST /api/qa/run-test` SSE endpoint (Wave 113 / US-071 backend leg):
  - `enumerateTestFiles()` — recursive walk of `tests/**/*.spec.ts`, forward-slash normalized paths
  - Allowlist validation: client-sent `testPath` must be exact member of server-side enum → 400 `PATH_NOT_ALLOWED` if not
  - `spawn('pnpm', ['vitest', 'run', validatedPath], { cwd: process.cwd(), shell: false })`
  - Streams stdout/stderr as SSE `delta` events via `sseFormat`/`sseHeaders`; closes on process exit with `done` event
  - Output capped at 10 KB before persisting
  - `GET /api/qa/run-test` — returns `{ tests: string[] }` for frontend enumeration
- `qa_test_runs` SQLite table added to `src/lib/db.ts` (`CREATE TABLE IF NOT EXISTS`) with `upsertQaTestRun`, `getQaTestRun`, `listQaTestRuns`
- `tests/be/qa-run-test.test.ts` — 10 tests: allowlist rejection, path traversal blocked, happy path pass/fail persistence, DB call assertions

## In flight
- Awaiting Architect PASS (security review of allowlist/spawn path)
- Awaiting QA PASS on :3100 instance

## Next
- UI Dev Wave 114: consumes `GET /api/qa/run-test` for test list, `POST /api/qa/run-test` for run trigger
- Note: UX spec (AC3) uses `testPath` as the body field; dispatch text says `path` — implemented as `testPath` to match UX spec. Flag if UI Dev sees a mismatch.

## Notes
- Pre-existing `tests/playwright/dashboard-smoke.spec.ts` (untracked) fails type-check and vitest due to missing `@playwright/test` — NOT introduced by this wave. Filed separately.
- Gate evidence: type-check 0 errors (outside pre-existing playwright file), 10/10 new tests pass, 461/461 total (excluding pre-existing playwright failure).
