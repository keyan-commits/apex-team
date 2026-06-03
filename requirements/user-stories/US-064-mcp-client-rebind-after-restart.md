# US-064 — MCP Client Rebind After Server Restart

**Status:** accepted
**Owner role:** backend-developer (primary) + ui-developer (dashboard banner, if AC4 branch)
**Created:** 2026-06-03
**Story ID:** US-064
**Source issue:** #257

---

## Narrative

As the user driving the apex-team from any Mac, I want the outer Claude Code MCP session to automatically recover its tool registry (or receive a clear in-dashboard prompt) when the apex-team server restarts via `.restart-trigger`, so that I don't get stranded without `talk_to_product_owner` / `get_team_status` / other apex-team tools until I manually run `/mcp` reconnect.

---

## Acceptance Criteria

- **AC1 (workaround documented):** Given that the immediate manual workaround already exists (`/mcp` reconnect in Claude Code), when this wave ships, then `architecture/operations/mcp-client-rebind.md` exists and documents: (a) the symptom ("tools stop appearing after `.restart-trigger`"), (b) the workaround step-by-step for both Macs, (c) the root cause ("Claude Code MCP client caches tool registry; server restart doesn't invalidate client cache"), and (d) a pointer to the fix implemented in this wave. _(Testable: file exists and covers all four points.)_

- **AC2 (MCP spec investigation — gates AC3 vs AC4 branch):** Given the `@modelcontextprotocol/sdk` Streamable HTTP transport implementation, when Architect investigates whether Claude Code's MCP client supports `notifications/tools/list_changed` (RFC per MCP spec) or auto-rebind on `serverInfo.version` mismatch, then Architect produces a documented verdict (in `architecture/decisions/ADR-0NN-mcp-client-rebind.md` or an inline note) that resolves which implementation branch (AC3 or AC4) ships. _(This is a blocking prerequisite: the ADR verdict determines the implementation path.)_

- **AC3 (auto-rebind via `tools/list_changed` — implement if AC2 verdict = supported):** Given that the MCP spec supports `notifications/tools/list_changed`, when the apex-team server completes startup (or tool registration changes), then `src/mcp/handler.ts` emits a `notifications/tools/list_changed` notification to all connected SSE clients, AND `serverInfo.version` is set to a monotonic identifier (startup `Date.now()` string or commit SHA from `git rev-parse --short HEAD`). After this, Claude Code's MCP client fetches a fresh tool list without requiring `/mcp` user action. _(Testable: restart server; verify `talk_to_product_owner` re-registers in the outer Claude Code session without manual `/mcp`.)_

- **AC4 (dashboard reconnect banner — implement if AC2 verdict = not supported):** Given that auto-rebind is not achievable via spec, when the apex-team server has restarted more recently than the time recorded in a cookie / localStorage timestamp from the last page load, then the dashboard displays a non-blocking banner: _"Server restarted — run `/mcp` in Claude Code to reconnect apex-team tools."_ The banner is dismissible and does not reappear until the next server restart. _(Testable: restart server, reload dashboard; banner appears. Dismiss, reload; no banner.)_ _(UX spec: UX Designer to confirm copy + placement in their triad leg.)_

- **AC5 (upstream issue — file if AC2 verdict = not supported):** Given that the MCP client does not support auto-rebind, then a GitHub issue is filed against the relevant upstream repo (`@modelcontextprotocol/sdk` or `anthropics/claude-code`) requesting auto-rebind or `tools/list_changed` client-side support. Issue URL must appear in `architecture/operations/mcp-client-rebind.md`. _(Testable: issue URL present in doc; issue is open in the upstream repo.)_

- **AC6 (LESSONS.md entry):** When this wave ships, then `LESSONS.md` contains a new entry: _"MCP client caches tool registry at connection time; apex-team server restart via `.restart-trigger` requires either a `tools/list_changed` notification (AC3) or manual `/mcp` reconnect in Claude Code (AC4 path). Root cause: Streamable HTTP MCP clients do not poll for registry changes."_ _(Testable: entry exists verbatim or captures the same facts.)_

- **AC7 (CI gates):** `pnpm type-check` passes with 0 errors; `pnpm test:run` passes with all existing tests green.

---

## Out of Scope

- Cross-Mac session sync (each Mac manages its own Claude Code MCP session).
- Replacing the MCP transport (Streamable HTTP stays; addressed in US-004).
- Forcing Claude Code client to poll the server for registry changes (not under apex-team's control).
- Automatic server restart on code push (separate DevSecOps concern).
- Any changes to the `.restart-trigger` bump mechanism itself — that stays as-is.

---

## Open Questions

_(None blocking story authoring. AC2 branch (AC3 vs AC4) is resolved by Architect's NFR triad leg for this wave — expected alongside UX leg once Lane B gates (#284/#285) clear.)_

---

## Implementation Notes

- Branching path: AC3 (server emits `tools/list_changed`) is preferred if the MCP spec supports it — zero user-visible friction. AC4 (dashboard banner) is the fallback — user still needs one manual step, but is at least clearly told why tools are missing.
- `serverInfo.version` for the monotonic identifier: `Date.now().toString()` at server boot is the simplest option; commit SHA is more stable across restarts on the same code.
- The AC4 banner restart-detection mechanism: server can expose a `/api/health` field `startedAt` (Unix timestamp); client polls on page focus or SSE reconnect and compares against localStorage `lastKnownServerStart`.

## Links

_(Filled in during and after implementation)_

- closes: #257
- impl: `(SHA-pending)`
