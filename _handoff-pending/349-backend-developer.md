## Done
- AC1 (US-084) — conflict-marker precompile fence implemented in `scripts/dev-supervisor.mjs`
  - `startConflictWatcher()`: sync scan of `src/**/*.{ts,tsx,mjs}` at startup + `fs.watch({recursive:true})` on changes
  - `_checkFileForMarkers()`: detects `<<<<<<<`, `=======`, `>>>>>>>` with 1-based line numbers; kills child on first detection; auto-resumes on clear
  - `spawnChild()` guards on `_conflictFiles.size > 0` — refuses to spawn with clear stderr error
  - Type declarations updated in `scripts/dev-supervisor.d.mts`
  - 10 new unit tests in `tests/be/dev-supervisor.test.ts`; full suite green (564 pass / 1 skip)
- PR opened: feature/349-us084-be-ac1 → main. Awaiting Architect code review.

## In flight
- Architect code review gate for PR (feature/349-us084-be-ac1)

## Next
- After Architect PASS: HANDOFF QA for AC5 smoke (conflict-marker injection test)
- US-080 stall-detector impl queued behind #339 merge

## Notes
- AC2/AC3/AC4 are DevSecOps lane (separate branch feature/349-us084-devsecops or similar)
- OQ-349-001 (dashboard UI surface for AC4) open — UX routing pending; doesn't block AC1
