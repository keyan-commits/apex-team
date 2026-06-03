# ADR-016 — MCP Client Rebind Strategy: AC4 Dashboard Banner (not AC3 auto-notify)

- **Status:** Accepted
- **Date:** 2026-06-03
- **Wave:** 105
- **Issue/US:** #257 (root cause) → US-064 (AC2 branching gate)
- **Relates to:** ADR-015 (no extra infrastructure), `src/mcp/handler.ts` (BOOT_SESSION_ID — PR #259)

## Context

When apex-team's server restarts (`server.ts` process respawn via `.restart-trigger`), the
outer Claude Code MCP client retains a cached tool registry from the pre-restart connection.
Subsequent tool calls silently use stale schemas or fail; the user must manually run `/mcp`
→ Reconnect in their Claude Code session.

Two server-side remediation paths exist in the MCP Streamable HTTP spec:

### Path A — `notifications/tools/list_changed` (AC3)

The MCP spec defines `notifications/tools/list_changed` as a server-to-client notification
that signals clients to re-fetch the tool list. The `@modelcontextprotocol/sdk` server exposes
`server.sendToolListChanged()` and `ServerCapabilities.tools.listChanged` to advertise support.

**Why AC3 is not viable with the current architecture:**

The Streamable HTTP transport in apex-team is **stateless per-request** (`sessionIdGenerator:
undefined`). Each MCP request (POST `/mcp`) creates a fresh `McpServer` + `StreamableHTTPServerTransport`
pair. There is no persistent server-side SSE channel to Claude Code between requests.

`notifications/tools/list_changed` is a **push** mechanism — the server emits a notification
on an *active* SSE connection. Without a persistent GET `/mcp` SSE stream kept alive by the
client, there is no channel to deliver the notification to an idle Claude Code session.

Making this work would require:
1. Stateful transport with server-side connection registry (explicit session management)
2. Long-lived SSE GET connections from Claude Code to apex-team between tool calls
3. A notification dispatch path that targets all registered connections on server boot

This is a meaningful architecture change (violates the "cheap stateless per-request"
invariant, increases memory surface, complicates error handling). It is out of scope for
US-064 and is not justified for a single-user local app.

### Path B — BOOT_SESSION_ID + 404 (PR #259, already live)

The existing handler returns 404 on non-initialize requests with a stale session ID.
Per the MCP Streamable HTTP spec, clients **MUST** re-send `initialize` on 404, which
gives them a fresh tool registry.

This is already implemented. However, whether Claude Code's MCP client actually triggers
re-initialize on 404 — rather than surfacing an error and halting — is **empirically
unverified**. Issue #257 was closed on the spec-correct implementation; US-064 exists
because the user-visible problem persists.

### Path C — Dashboard banner (AC4)

A non-blocking, dismissible banner on the dashboard that tells the user the server
restarted and instructs them to run `/mcp` in Claude Code. Detection via `startedAt`
timestamp in `/api/health` vs. a `lastKnownServerStart` in `localStorage`.

This works **regardless** of Claude Code client compliance, stateless transport, or
spec version. It is the only mechanism that is reliable under all client implementations.

## Decision

**Implement AC4 (dashboard banner) as the primary rebind remediation path.**

The BOOT_SESSION_ID + 404 mechanism (PR #259) is retained as-is — it is spec-correct
and provides speculative upside if Claude Code ever complies. The dashboard banner is
the user-visible safety net that closes the failure mode definitively.

`notifications/tools/list_changed` is **not implemented** in US-064. The stateless
transport architecture would need to change first, and that change requires its own ADR.
File a follow-up issue if the team decides to invest in a stateful transport.

## Implementation guidance (for BE Dev — US-064 AC4 path)

**`/api/health` response:** add `startedAt: process.uptime()` (seconds since process
start) or a `BOOT_TIME` module-level `Date.now()` captured at import. A stable `BOOT_TIME`
constant is preferable — `process.uptime()` requires the client to diff across polls.

**Client detection:** on page load and on `visibilitychange` (tab refocus), compare
`GET /api/health → startedAt` against `localStorage.getItem('apexLastKnownServerStart')`.
Mismatch → set banner state. On dismiss → `localStorage.setItem(...)` with current value.

**Not a real-time push.** The banner fires on next page-focus or reload, not the
instant of restart. This is acceptable: the user acts on the dashboard, and the banner
appears before their next interaction.

**`serverInfo.version` note:** the current handler hardcodes `version: "0.1.0"`. Making
it monotonic (e.g., injecting `BOOT_SESSION_ID` as the version string) costs nothing and
satisfies AC3's version-mismatch nudge if Claude Code ever checks it. Recommend BE Dev
sets `version: BOOT_SESSION_ID` when wiring AC4 — zero extra work, speculative upside.

## Consequences

**Positive**
- Reliable user-visible signal regardless of Claude Code MCP client compliance.
- No architectural change to the stateless transport — consistent with ADR-015 minimal-infra stance.
- Spec-correct BOOT_SESSION_ID + 404 mechanism remains as latent auto-rebind (activated if Claude Code complies).

**Negative / accepted trade-offs**
- Auto-rebind is not guaranteed — user still needs to run `/mcp` after seeing the banner. One manual step, but at least they know why.
- Banner detection is pull-based (on page focus), not instant push.

## Tripwire — conditions that reopen AC3

Revisit this ADR (move to Superseded) if:
1. **Claude Code confirms `notifications/tools/list_changed` support** — official docs or changelog states the client handles it.
2. **Stateful transport is adopted** — a new ADR moves the transport to session-aware mode, making persistent SSE channels available.
