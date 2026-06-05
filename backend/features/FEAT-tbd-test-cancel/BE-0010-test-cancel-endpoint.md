---
ticket: BE-0010
parent_feat: TBD
parent_us: TBD
role: backend-developer
status: in-progress
---

# BE-0010 — Test-run cancel endpoint + process registry (Wave 140)

## Summary

Wave 140 BE Dev work: adds a server-side process registry and `DELETE /api/run-test/:id`
cancel endpoint to `keyan-commits/apex-team-viewer/server.mjs`. Prevents runaway
Playwright tests from freezing Chrome — the server-side kill capability that pairs with
UI Dev's client-side SSE rate-limiting (parallel Wave 140 dispatch).

## Changes shipped

### `apex-team-viewer/server.mjs`

| Change | Detail |
|--------|--------|
| Process registry | Module-scoped `activeRuns = new Map()` — `runId → ChildProcess`. Populated on spawn; cleared on child exit (normal, error, kill). |
| SSE `start` event extended | `{ runId, command, cwd, runner }` — `runId` added; backward-compatible. |
| `DELETE /api/run-test/:runId` | SIGTERM → 5 s → SIGKILL. 404 on unknown runId. Audit-logs to `coordination/test-runs/audit.log` (TSV; silent if dir absent). |
| Concurrent run cap | `MAX_CONCURRENT_RUNS` (default 10, env `APEX_VIEWER_MAX_CONCURRENT_RUNS`). 11th request returns 429 `{ ok: false, error: 'too many concurrent runs' }`. |

### `apex-team-viewer/__tests__/run-cancel.test.ts`

10 new tests across 4 groups:
- **Positive**: spawn long-running child, capture runId, cancel, assert killed within 5 s.
- **Negative**: DELETE unknown runId → `{ ok: false, error: 'no such run' }`.
- **Edge cap**: 11th run rejected by `isFull()` gate; env override verified.
- **Edge exit**: child exits naturally → registry auto-cleared → subsequent cancel → not-found.

## Test results

```
Test Files  8 passed (8)
     Tests  69 passed (69)   ← 10 new, 59 prior
  Duration  3.32s
```

## Viewer PR

- **PR #23** — `feature/wave-140-cancel-endpoint-be`
- URL: https://github.com/keyan-commits/apex-team-viewer/pull/23

## Co-dispatch

- **UI Dev PR**: `feature/wave-140-sse-perf-hotfix-ui` (client SSE batching + cancel button)
- Both PRs can land independently. UI Dev's cancel button degrades gracefully on 404 from this endpoint.

## Risk notes

- SIGKILL after 5 s is a hard kill — any in-flight file I/O in the test process is abandoned. Acceptable for test runners (no user data at risk).
- `coordination/test-runs/` audit log dir is not auto-created by the server. Silent-skip is intentional to avoid filesystem side-effects on foreign workspaces.
- Concurrent cap default of 10 is conservative. A single Playwright suite can spawn multiple browser contexts; the cap is per-viewer-request, not per-browser-tab.

## Gate status

Awaiting Architect code review PASS → QA PASS → DevSecOps merge.
