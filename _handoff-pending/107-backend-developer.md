## Done
- US-017 (#131): PO auto-compact peer HANDOFF docs — 2 files, ~12 lines, 7 new tests.
  - `src/mcp/tools.ts`: `get_team_status` now emits `needsCleanup:true` when HANDOFF ≥8000 chars.
  - `src/lib/roles.ts`: PO auto-assign section prepended with Step 0 compaction pre-check (1h cooldown, `[exception: housekeeping]`, one-DISPATCH-per-peer-per-turn).
  - `tests/lib/roles.test.ts`: Wave 107 describe block, 7 assertions.
  - Gates: type-check 0, 443/443 tests.

## In flight
- Awaiting Architect code-review gate (PR #TBD — Wave 107).

## Next
- After Architect PASS: HANDOFF QA for verification on :3100.

## Notes
- Branch: `feature/107-po-autocompact`.
- No DB schema change, no new module — extension of existing prompt-encoded loop.
- The soft compaction hint in the Tools section (roles.ts line 256) is intentionally left; the Step 0 pre-check is the authoritative mandatory path.
