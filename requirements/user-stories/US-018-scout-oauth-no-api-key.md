---
name: US-018-scout-oauth-no-api-key
description: Scout 'Run now' rewrites skill-scout.mjs onto Claude Agent SDK + apex-engine web_search MCP — removes ANTHROPIC_API_KEY dependency for users on Claude subscription
metadata:
  type: user-story
  status: superseded
  owner: BE Dev
  closes: "#115"
  wave: Wave 57
---

## Resolution — superseded by Plan C cutover

All ACs target `scripts/skill-scout.mjs`, `src/app/api/scout/trigger/route.ts`, and `src/lib/providers.ts` — all monolith files retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). Scout functionality in the subagent runtime runs inside a Claude Code session via subagent invocations; it does not use REST API calls or a dashboard button.

## Story

As a user on Claude subscription (no API key), I want scout's 'Run now' to work via local Claude Code OAuth like every other team agent, so that I can manually re-run scout without provisioning an API key.

## Acceptance criteria

1. **`scripts/skill-scout.mjs` is rewritten** to invoke the Claude Agent SDK `query()` path (per `src/lib/providers.ts`) — replacing the current raw REST `fetch` loop to `api.anthropic.com/v1/messages` and the `web-search-2025-03-05` beta header. The `API_KEY` const and the line-27 hard-exit (`[FAIL] ANTHROPIC_API_KEY not set`) are deleted. Apex-engine's `web_search` MCP tool is wired as an allowed tool in the `query()` options.
2. **Scout's web-search capability survives the migration.** The research step must invoke web search via apex-engine's `web_search` MCP tool (not the Anthropic beta API). This is load-bearing — silently losing web-search guts the scout's research output.
3. **`src/app/api/scout/trigger/route.ts`** — the `ANTHROPIC_API_KEY` pre-flight block (lines 9-20) is deleted entirely. Any OAuth-absent check is handled inside the script's SDK call, not at the route layer.
4. Manual 'Run now' from the dashboard succeeds when `ANTHROPIC_API_KEY` is unset but Claude Code is logged in (OAuth present).
5. Error path returns a clear, user-readable message — `"Claude Code not logged in — run 'claude login' to authenticate"` — when OAuth is absent, rather than a generic auth failure, silent hang, or raw stack trace. HTTP 503 is acceptable.
6. Regression test mocks the Claude Agent SDK `query()` call for the scout path and asserts: (a) the mock is invoked, (b) no `process.env.ANTHROPIC_API_KEY` read remains in the trigger route, (c) the OAuth-missing path returns the clear error message.

## Out of scope

- Changing the scout schedule / cron logic.
- Adding a new auth mode for non-Claude providers (Groq, Gemini) — those remain key-based.
- Dashboard UI changes to the 'Run now' button or spinner (existing button stays; only the server-side auth path changes).
- Supporting multiple simultaneous auth modes (OAuth + key fallback) — AC1 explicitly removes the key path; one auth mode only.

## Notes

- Observed: `scripts/skill-scout.mjs` calls Anthropic REST API directly (`fetch` to `api.anthropic.com/v1/messages`, ~line 60) with the `web-search-2025-03-05` beta tool, requiring `ANTHROPIC_API_KEY` (~line 26-27). The route guard at `route.ts:9` is only the pre-flight check; removing it alone just moves the hard-exit into a silent detached child. The real fix is the script rewrite.
- Constraint: no `ANTHROPIC_API_KEY` available in this environment by design — see memory `reference_no_anthropic_api_key.md`. Any path requiring it is broken for this user.
- Scope clarification (Architect Wave 57 design): this is a **script rewrite**, not a one-line edit. The web-search beta (`web-search-2025-03-05`) is an API-only feature; the SDK/OAuth path does not expose it. Team agents get web-search via apex-engine's `web_search` MCP tool — scout must migrate to that path or lose its research capability.
- BE Dev must verify: spawned child inherits OAuth environment automatically (process-ambient); verify before committing.
- Discovered during: Wave 55+ backlog drain (BA).
