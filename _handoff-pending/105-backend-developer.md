## Done
- US-064 AC4: added `startedAt: BOOT_TIME` (module-level constant) to `/api/health` response
- US-064 AC4: bumped `serverInfo.version` to `BOOT_SESSION_ID` in `src/mcp/handler.ts`
- type-check 0, 433/433 tests green

## In flight
- PR open, awaiting Architect code review gate

## Next
- After Architect PASS → HANDOFF QA
- US-018 (scout OAuth rewrite) is next backend wave — queued behind QA PASS here

## Notes
- BOOT_TIME is stable per process lifetime (module-level, not call-time)
- BOOT_SESSION_ID was already exported from handler.ts — no new import needed
- UI Dev owns the banner render (dependency-gated behind this field landing on main)
