## Done
- #257 (MCP session-refresh on restart): `src/mcp/handler.ts` — added `BOOT_SESSION_ID = randomUUID()` at module load; initialize responses now carry `Mcp-Session-Id: <boot-uuid>`; non-initialize requests with absent/stale session ID return 404 (MCP spec triggers client re-initialize). 5 unit tests in `tests/be/mcp-session-refresh.test.ts` (all 382 pass, 0 type errors). Branch `feature/101-mcp-session-boot-id`.

## In flight
- Awaiting Architect gate on #257 PR.

## Next
- Nothing queued for Wave 101 BE lane.

## Notes
- Root cause was server-side (stateless `sessionIdGenerator: undefined`), fix is fully server-side — no client change needed. Client (Claude Code MCP) detects 404 and re-initializes per spec.
