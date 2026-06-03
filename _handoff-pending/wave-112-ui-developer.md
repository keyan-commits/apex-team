## Done
- US-070 Wave 112 implemented on `feature/112-us070-dashboard-density`
- AC1: done-panel CSS-grid expand (`data-done-expands`, `grid-column: 1/4`, ≥1280px, instant snap)
- AC2: workspace path RTL truncation on blur when len>40; full path in `title` tooltip
- AC3 (re-fixed per UX REVISE): `.ctx-model-select` hidden by default (`display:none`); revealed via `.ctx-card:hover .ctx-model-select, .ctx-card:focus-within .ctx-model-select { display:inline-block }` — focus-within parity for keyboard a11y
- AC4: peer-idle-row `overflow-x:auto` + `flex-wrap:nowrap` (was already correct); `.recent-row-body` gap 6→12px (re-fixed per UX REVISE)
- AC5: done[] pre-sorted by wave descending (nulls last) before `groupDone`
- AC6 (re-fixed per UX REVISE): "awaiting input" in ActiveWaveCard Section D (Next) → "Tick scheduler idle — queue is empty. Send a goal via your Claude Code session, or use the composer."
- AC7 (re-fixed per UX REVISE): NOW-panel chip-strip `slice(0,3)` → `slice(0,2)`; +N overflow badge retained
- Tests: 468/468 (pre-existing playwright #309 excluded)
- type-check: 0 (excl pre-existing playwright TS errors)

## In flight
- Awaiting UX re-gate on feature/112-us070-dashboard-density

## Next
- After UX PASS → HANDOFF Architect code review
- After Arch PASS → HANDOFF QA on :3100
- After QA PASS → HANDOFF DevSecOps squash-merge
- US-073 (trivial CSS deletion — vestigial `translateX(0)` from StallSettingsDrawer; triad complete)

## Notes
- Pre-existing playwright failure (`@playwright/test` not installed, #309) unaffected — all Vitest tests green
- AC4A (peer-idle-row) was already correct at e008945; no re-edit needed
- UX REVISE line numbers shifted vs. actual file; applied by value matching not line number
