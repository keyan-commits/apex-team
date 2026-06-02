## Done
- PR #252 REVISE: extracted `groupDone` to `src/lib/group-done.ts` (S10 resolved)
- Added `tests/ui/group-done.test.ts` — 3 Vitest cases (cardinality, hour-bucket, wave boundary); 372/372 pass
- Fixed AC4: expanded sub-rows inside multi-row done groups now render wave chip strip (`e.waves`) or hour fallback
- type-check 0, build clean

## In flight
- Awaiting QA re-gate on PR #252 (seed data at thread `test-done-panel-252` on :3100 still in place)

## Next
- After QA re-PASS + Architect gate: HANDOFF DevSecOps to merge #252

## Notes
- #255 (chip render order) stays deferred per PO
- Commit is path-scoped: page.tsx, group-done.ts, group-done.test.ts, this fragment only
