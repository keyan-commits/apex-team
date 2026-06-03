## Done
- Merged PR #351 (doc-only US-084) and PR #340 (vitest config) — both already landed on main @ 1006c38
- Implemented US-084 AC2/AC3/AC4 on `feature/104-us084-devsecops`:
  - AC2: supervisor pidfile singleton (`data/apex-team-supervisor.pid` + `kill -0` liveness check) — refuses duplicate supervisors
  - AC3: `process.title = 'apex-team-supervisor'` at entry + `pkill -f apex-team-supervisor` documented in README + supervisor header
  - AC4: `/api/health` walks `src/**/*.{ts,tsx,mjs}` for max mtime, returns 503 + `staleCompile: true` + `staleCompileMessage` when source is newer than BOOT_TIME

## In flight
- PR #open-pending for `feature/104-us084-devsecops` → HANDOFF Architect for code review

## Next
- Await Architect code-review PASS on AC2/AC3/AC4 PR
- QA smokes (AC5) fire after Architect PASS
- DevSecOps merge after QA PASS

## Notes
- AC4 returns HTTP 503 (not just a body field) on stale compile — callers can gate on status code without parsing JSON
- SELF_PID_FILE (`data/apex-team-supervisor.pid`) is distinct from PID_FILE (`data/.supervisor.pid`) which stores the child's PID
- `data/` is gitignored; pidfiles survive restarts but not clean git checkouts (expected for local-only state)
