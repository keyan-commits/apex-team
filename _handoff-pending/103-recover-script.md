### Wave 103 partial — recover-dev-server.sh (claude-code hand-fix)

**Branch:** `feature/103-recover-script-v2` off main `a9544c2`.
**Scope:** automation script only. The proper supervisor fix (per #270 AC1-3) is a separate impl wave.

**Context:** server was down for 6+ hours after a `.restart-trigger` bump left `.next/dev/lock` pointing at a dead PID (41999). Manual recovery requires three commands: `kill`, `rm -rf .next/dev`, `pnpm dev:supervised`. claude-code packaged that as a single idempotent script so outer orchestrator (or user) can recover in one call.

**Files:**
- `scripts/recover-dev-server.sh` — kills stale PIDs (from lockfile + ps grep), rm -rf .next/dev, starts pnpm dev:supervised via nohup, polls /api/health up to 60s.
- `.gitignore` — adds `.recover-logs/` so the recovery output doesn't pollute commits.

**Verified:** ran against today's 6h outage, server recovered in 4 seconds.

**Follow-up:** Wave 103 implementer should fold this logic into `scripts/dev-supervisor.mjs` per #270 ACs so respawns are self-healing.

**Note on v2:** PR #271 was polluted with PR #268's a11y changes during a force-push. Closed + recreated as v2 from clean main.
