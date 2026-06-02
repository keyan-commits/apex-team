## Done
- #255: single-row Done items now render chip-strip before roleBadge (matching multi-row + spec wireframe)
- #254: renamed `doneKey` → `groupKey` in single-row path so both paths use identical variable names
- Wave 101 / #248 UI layer: `useCiHealth` hook (30s poll, 404→unknown graceful), `CiHealthBanner` component, OrchestratorBar CI pill (5 states, responsive, a11y), `CiHealthData` type added. Branch: `feature/101-ci-health-ui`. Tests: 406/406 ✓, type-check 0, build clean.
- #263: unknown pill stray colon dropped → `? main CI`
- #264: breakpoints corrected `767`→`768`, `479`→`480`

## In flight
- Awaiting UX gate (visual/a11y review) + QA gate before HANDOFF DevSecOps to merge.
- DevSecOps building `/api/ci-health` route in parallel — UI handles 404 gracefully as `unknown`.

## Next
- On UX PASS + QA PASS → HANDOFF DevSecOps to open PR + merge.

## Notes
- Pill `? main CI` renders immediately on first load (before first poll) since the hook returns `null` then transitions to `unknown` once 404 is confirmed. Banner never shows for `unknown` — false-alarm risk per spec.
- Threshold shown in UI comes from API `threshold` field (AC8 N=2 from Architect); component does not hardcode it.
