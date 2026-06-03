## Done
- AC1 (US-084) — conflict-marker precompile fence implemented in `scripts/dev-supervisor.mjs`
  - `startConflictWatcher()`: sync scan of `src/**/*.{ts,tsx,mjs}` at startup + `fs.watch({recursive:true})` on changes
  - `_checkFileForMarkers()`: detects `<<<<<<<`, `=======`, `>>>>>>>` with 1-based line numbers; kills child on first detection; auto-resumes on clear
  - `spawnChild()` guards on `_conflictFiles.size > 0` — refuses to spawn with clear stderr error
  - Type declarations updated in `scripts/dev-supervisor.d.mts`
  - 10 unit tests; regex hand-fixed to `={7}$` after Wave 105 incident (a098bf5)
  - 3 Wave 105 regression tests added (divider false-positive, exact-7 still detected, trailing-text boundary)
  - Full suite green: 567 pass / 1 skip (62 files)
- PR #367 (`feature/349-us084-be-ac1`): Architect PASS. Awaiting #360 merge then rebase.

## In flight
- Waiting for DevSecOps to confirm PR #360 merged to origin/main

## Next
- Rebase `feature/349-us084-be-ac1` onto post-#360 main; integrate AC1 block per Architect snippet
- Push rebased branch; confirm suite still green
- HANDOFF QA for AC5 smokes (conflict-marker injection + duplicate-supervisor)
- US-080 stall-detector impl queued behind #339 merge

## Notes
- Merge order: #360 first (DevSecOps mandate from Architect); then #367 rebases
- Integration point: `startConflictWatcher()` slots after `checkStaleChildOnStartup()` in `start()`
- AC2/AC3/AC4 are DevSecOps lane (PR #360, Architect PASS)
