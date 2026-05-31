---
id: US-004
slug: mcp-transport-reliability
status: done
owner: backend-developer
raised: 2026-05-31
closed: 2026-05-31
references:
  - issue: "#31"
  - open-questions: OQ-005
---

# US-004 — MCP Transport Reliability

## Narrative

As the user driving apex-team from Claude Code, I want the MCP transport between my Claude Code and apex-team to survive long-running agent turns without dropping mid-call, so that wave dispatches don't lose work or require recovery via git inspection.

## Acceptance Criteria

**AC1 — Long turn survives without idle timeout**
Given a Claude Agent SDK turn that takes up to 5 minutes (e.g. a `talk_to_product_owner` dispatching 6 peers sequentially, or a Playwright-driven turn with multiple snapshots and tool calls), when it streams responses through `/mcp`, then the HTTP connection from Claude Code to apex-team survives to completion without an `ECONNRESET`, `EPIPE`, or HTTP 408.

**AC2 — Silence gap does not tear down the stream**
Given the same long turn, when the agent emits no data for 30 or more consecutive seconds (model thinking pause, slow tool-use round-trip, LLM rate-limit backoff), then the Node.js HTTP server does NOT close the response stream — the turn resumes and completes when data next flows.

**AC3 — No regression on short turns**
Given the fix is applied (Node `requestTimeout = 0`, `keepAliveTimeout` and `headersTimeout` raised), when a normal short turn (10 seconds or less, e.g. `get_team_status`) runs, then it completes cleanly — no error, no unexpected delay, no change in observable behavior.

**AC4 — Manual verification via deliberate slow turn**
Given the fix is deployed and the server is running, when a manual test dispatches a turn known to exceed 5 minutes OR a synthetic delay is introduced (e.g. a slow tool response), then the transport survives and the calling Claude Code session receives the full response without reconnecting.

## Technical notes

_For Architect / BE Dev reference — not acceptance criteria._

- Root cause: Node default `requestTimeout = 300_000ms` (5 min) closes the connection if the response has not fully flushed. Long agent turns exceed this. `keepAliveTimeout = 5_000ms` is a secondary risk for sequential tool calls over a reused connection.
- Proposed fix (3 lines in `server.ts` after `createServer(...)`):
  ```ts
  server.requestTimeout = 0;        // disable; agent turns can exceed 5 min
  server.keepAliveTimeout = 65_000; // keep connection alive between sequential tool calls
  server.headersTimeout = 66_000;   // must exceed keepAliveTimeout per Node constraint
  ```
- `StreamableHTTPServerTransport` (SDK `src/mcp/handler.ts`) exposes no heartbeat option — SSE comment heartbeats not needed for local traffic with no proxy.
- Single file change: `server.ts`. No type changes, no new dependencies.
- See Architect's Wave 12a design note for full diagnosis.

## Open questions

- **OQ-005** (Architect): Should we implement an application-level SSE heartbeat in `StreamableHTTPServerTransport` as belt-and-braces, if the SDK adds support? Status: open. Not blocking AC1–AC4.

## Links

- impl: `464fe73` (Wave 12b — `server.ts` `applyHttpTimeouts(server)` helper)
- test: `tests/server/timeouts.test.ts` (4 vitest cases locking `requestTimeout=0`, `keepAliveTimeout=65_000`, `headersTimeout=66_000`, and `headersTimeout > keepAliveTimeout`)
- qa-pass-by: Wave 12c — QA verified all 4 ACs, 17/17 tests green
- deployed-by: `03b086f` (Wave 12d — DevSecOps merge to main; `.restart-trigger` touched; new server PID 5527; `pnpm smoke` PASS)
