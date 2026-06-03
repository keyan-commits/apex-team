# MCP Client Rebind After Server Restart

_Operational runbook — US-064 AC1. Updated: 2026-06-03 (Wave 105)._

---

## Symptom

After apex-team's server restarts (`.restart-trigger` bump → supervisor SIGTERM → new
`server.ts` process), the outer Claude Code MCP session loses its tool registry.
Symptoms include:

- `talk_to_product_owner`, `get_team_status`, `read_handoff_doc`, and other apex-team
  tools no longer appear in the Claude Code session.
- Calls to those tools return "unknown tool" or silently fail.
- The server itself is healthy — `curl -s http://localhost:3000/api/health` returns 200,
  and apex-engine tools (if any) continue to work.
- `GET http://localhost:3000/mcp` returns 406 (expected behavior for a plain GET without
  `Accept: text/event-stream`; does NOT indicate a server fault).

---

## Root Cause

Claude Code's MCP client caches the tool registry at connection time. When the
apex-team server restarts, the server builds a fresh tool registry via
`registerApexTeamTools()`. The client, however, retains its stale cached schemas.

**Protocol-level mitigation (PR #259, live):** `BOOT_SESSION_ID` — a UUID generated
once per process — is injected as `Mcp-Session-Id` in every `initialize` response.
Non-initialize requests with a pre-restart (stale) session ID return HTTP 404. Per
the MCP Streamable HTTP spec, clients MUST re-send `initialize` on 404, which gives
them a fresh tool registry automatically. Whether Claude Code's client acts on this
is empirically unverified (see ADR-016).

**Why `notifications/tools/list_changed` is not used:** The current transport is
stateless per-request; there is no persistent SSE channel to push a notification to
an idle Claude Code client between requests. See ADR-016 for the full analysis.

---

## Workaround (immediate, both Macs)

Run the MCP reconnect in your outer Claude Code session:

### Mac 1 (primary)

1. In your Claude Code terminal session, type `/mcp` and press Enter.
2. Find `apex-team` in the server list.
3. Select **Reconnect** (or disconnect and re-add if the entry is missing).
4. Verify `talk_to_product_owner` is available again before resuming work.

### Mac 2

Same steps. If the server is healthy (`:3000/api/health` → 200) but tools are missing,
the problem is the client-side registry cache, not the server. The `/mcp` reconnect
re-sends `initialize` to the server and gets a fresh tool list.

**Alternative (heavy):** Restart the entire Claude Code session. This forces a full
re-handshake but loses in-memory context.

---

## Dashboard banner (US-064 AC4 — wave TBD)

When US-064 AC4 ships, the dashboard will display a non-blocking, dismissible banner
when it detects a server restart:

> _"Server restarted — run `/mcp` in Claude Code to reconnect apex-team tools."_

Detection: the client compares `/api/health → startedAt` against
`localStorage.apexLastKnownServerStart` on page load and tab refocus. Banner auto-clears
after dismiss; reappears on next restart. See `design/US-064-mcp-rebind-banner.md` for
UX spec.

---

## Implementation pointer

| Component | Location | Purpose |
|---|---|---|
| BOOT_SESSION_ID | `src/mcp/handler.ts` | Per-process UUID; 404 on stale session |
| Session test | `tests/be/mcp-session-refresh.test.ts` | Validates 404 on stale, 200 on fresh |
| AC2 verdict | `architecture/decisions/ADR-016-mcp-client-rebind-strategy.md` | Why AC4 (not AC3) |
| AC4 banner spec | `design/US-064-mcp-rebind-banner.md` | UX copy + placement |

---

## Related issues / upstream

- **#257** — root cause report + Wave 101 partial fix (BOOT_SESSION_ID).
- **US-064** — full remediation story (dashboard banner + this doc + LESSONS.md entry).
- If AC5 fires (upstream issue filed against `@modelcontextprotocol/sdk` or `anthropics/claude-code`
  requesting client-side `notifications/tools/list_changed` support), the upstream issue URL
  will be added here.
