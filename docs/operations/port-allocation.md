# Port allocation — apex-team workspace

**Last updated:** 2026-06-03

Durable port assignment for services running locally on a single Mac across the apex-* workspace. When this contract drifts (a service silently grabs another's port), MCP client binding breaks and the team can stall — see [LESSONS.md] for the 2026-06-03 incident chain.

## Allocation table

| Port | Service | Source of truth |
|------|---------|-----------------|
| **3000** | apex-team Next.js dev server | `apex-team/package.json` → `dev` (`tsx server.ts`, PORT defaults to 3000) |
| 3100 | apex-team QA smoke port | `apex-team/package.json` → `dev:test` |
| 3110 | apex-team UI dev test port | `apex-team/package.json` → `dev:test:ui` |
| 3120 | apex-team BE dev test port | `apex-team/package.json` → `dev:test:be` |
| 3130 | apex-team UX dev test port | `apex-team/package.json` → `dev:test:ux` |
| **3010** | apex-engine Next.js dev server | `apex-engine/package.json` → `dev` (`next dev -p 3010`) |
| 31001 | apex-engine MCP HTTP transport | `apex-engine/src/mcp/http-server.ts` → `DEFAULT_PORT = 31001` |

## Rules

1. **No service may bind a port outside this table.** New services file an issue + amend this doc before claiming a port.
2. **No two services share a port** — Next.js default `:3000` is reserved for apex-team only; apex-engine MUST pass `-p 3010`.
3. **If the recovery script (`scripts/recover-dev-server.sh`) finds a process holding `:3000` whose `cwd` is not apex-team, it kills that process before restarting apex-team.** That's a process-level enforcement of this contract.
4. **If you need a new port for a one-off test**, use `3140+` (apex-team test family) or `3020+` (apex-engine test family) to keep the families visually separable.

## How collisions happen (incident pattern)

Both projects ship Next.js dev servers. Next.js defaults to `:3000`. If apex-engine `next dev` is started while apex-team's supervised server is mid-respawn (e.g. during `.restart-trigger` bump or after a crash), apex-engine grabs `:3000`. When apex-team's supervisor tries to bring its child back, the bind fails. The Claude Code MCP client — which had cached the apex-team URL — gets responses from apex-engine instead, sees an unfamiliar tool registry, and drops the binding.

This is what happened today (2026-06-03 ~10:23 PST). Fixed by pinning apex-engine to `:3010` in `apex-engine` commit `34cbde1` and documenting the contract here.

## Verification

```bash
# Confirm apex-team is on :3000
curl -s http://localhost:3000/api/health | grep -q mcpMounted && echo "apex-team OK"

# Confirm apex-engine is on :3010 (if running)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3010 | grep -qE "200|404" && echo "apex-engine OK"

# Confirm apex-engine MCP HTTP is on :31001 (if running)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:31001/mcp
```

## Related

- `scripts/recover-dev-server.sh` — kill stale lockfile + restart apex-team.
- `architecture/decisions/ADR-013-merge-train-gitattributes.md` — related "single source of truth" pattern.
- LESSONS.md — 2026-06-03 entry on the apex-engine port-steal incident.
