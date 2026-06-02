## Done
- #255: single-row Done items now render chip-strip before roleBadge (matching multi-row + spec wireframe)
- #254: renamed `doneKey` → `groupKey` in single-row path so both paths use identical variable names
- Branch `feature/101-chip-strip-order` off main `16dd229`; type-check 0, 377/377 tests, build clean

## In flight
- Awaiting UX gate (visual order change — chip-strip before roleBadge)
- Awaiting QA gate

## Next
- On UX + QA PASS: HANDOFF DevSecOps to merge

## Notes
- Change is cosmetic render-order only; no logic change, no new state, no API touch
- Both issues (#254, #255) closed in a single commit on `page.tsx` only
