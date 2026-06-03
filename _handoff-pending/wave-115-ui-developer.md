## Done
- US-073 / #286: deleted `.stall-drawer.open { transform: translateX(0) }` from StallSettingsDrawer.tsx. Zero visual regression (conditional-render open/close, base `.stall-drawer` carries no transform). 474/474 Vitest · 0 src TS errors. Branch `feature/286-us073-remove-stall-drawer-noop`.

## In flight
- #311 (US-070 Wave 112) — awaiting UX re-gate on 4 REVISE deltas applied @ 32b3ff2.

## Next
- UX PASS on #311 → HANDOFF Architect → QA → DevSecOps merge.
- UX visual no-regression confirm on US-073 → Architect → QA → DevSecOps merge.

## Notes
- Pre-existing playwright TS failure (#309) present on both branches; not introduced by either wave.
