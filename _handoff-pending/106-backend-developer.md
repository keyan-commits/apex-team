## Done
- US-018 Wave 106 shipped: `feature/106-scout-oauth` — scout rewritten onto OAuth `query()` + apex `apex_web_search` MCP, no ANTHROPIC_API_KEY anywhere in src/ or scripts/ (NFR-SEC-001 grep gate added to package.json)
- `scripts/skill-scout.mjs`: removed `API_KEY` const + hard-exit; replaced `callAnthropic()` raw REST loop with `query()` from `@anthropic-ai/claude-agent-sdk` wired to apex-engine MCP
- `src/lib/scout-runner.ts` (new): in-process TypeScript scout called by trigger route — same OAuth/MCP path
- `src/app/api/scout/trigger/route.ts`: deleted `ANTHROPIC_API_KEY` 503 guard; auth probe via `query()` + fire-and-forget `runScout()`; OAuth-absent → 503 "Claude Code not logged in — run 'claude login' to authenticate"
- `src/lib/scout-state.ts`: KEPT — still imported by status route (`scoutRunning` flag)
- `src/lib/db.ts`: added `recordScoutRun()` (reuses existing scout_runs table)
- `tests/api/scout-trigger.test.ts`: rewritten — covers AC6a (query() invoked), AC6b (no API key read), AC6c (503 on OAuth absent), 409 still-running guard
- type-check 0, 434/434 tests, `pnpm lint:security:nfr001` exits 0

## In flight
- PR #288 (US-064 AC4 health field) awaiting Architect PASS → QA

## Next
- Await Architect PASS on this PR → QA on :3100

## Notes
- `scout-state.ts` is NOT dead code: status route still imports `scoutRunning`
- NFR-SEC-001 grep gate: `pnpm lint:security:nfr001` — blocks `"x-api-key"` and raw `fetch("https://api.anthropic.com"` in src/ + scripts/
- Closes #115
