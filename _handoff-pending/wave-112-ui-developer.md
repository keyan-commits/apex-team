## Done
- US-070 Wave 112 implemented on `feature/112-us070-dashboard-density`
- AC1: done-panel CSS-grid expand (`data-done-expands`, `grid-column: 1/4`, ≥1280px, instant snap)
- AC2: workspace path RTL truncation on blur when len>40; full path in `title` tooltip
- AC3: model dropdown hidden by default; `pane-header:hover` + `:focus-within` reveal (a11y gate satisfied)
- AC4: peer-idle-row `overflow-x:auto` + `flex-wrap:nowrap`; `recent-row` gap 6→8px
- AC5: done[] pre-sorted by wave descending (nulls last) before `groupDone`
- AC6: empty-state copy → "Tick scheduler idle — queue is empty. Send a goal via your Claude Code session, or use the composer." with `href="#"` link stub
- AC7: chip-strip limit 4→2; +N badge with tooltip of hidden chips
- Tests: 478/478 (17 new pure-function tests for AC1/AC2/AC5/AC7)
- type-check: 0 (excl pre-existing QA playwright TS errors unrelated to this wave)

## In flight
- PR #302 (Wave 108) — focus-ring fix, pending UX re-gate
- Wave 112 PR pending open; branch `feature/112-us070-dashboard-density`

## Next
- Open PR for Wave 112 → HANDOFF UX Designer for design critique
- After UX PASS → HANDOFF QA on :3100
- After QA PASS → HANDOFF DevSecOps squash-merge

## Notes
- Pre-existing playwright test failure (`tests/playwright/dashboard-smoke.spec.ts`) is QA's untracked file missing `@playwright/test` package — was failing on main before this wave
- AC6 docs link uses `#` stub per US-070 OQ-070-003 (non-blocking for tiny-lane ship)
- AC3 CSS uses `display: none` / `display: flex` toggle (not visibility:hidden) so hidden dropdown is removed from tab order, satisfying keyboard a11y
