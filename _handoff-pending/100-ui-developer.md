## Done
- Wave 100 — US-056 Done-panel grouping implemented (`feature/100-us056-done-panel`)
  - Fix 1: `done-panel` class adds `max-height: 60vh; overflow-y: auto` (→ `50vh` at `<768px`)
  - Fix 2: `groupedDone` useMemo gains Tier-3 `sharesHour` block + `hour-<epoch>` key (drops `single-*`)
  - Fix 3: Single-row chip strip added when `waves/tickets` present; multi-row hour-bucket groups render `.now-chip-hour` time chip
  - New CSS: `.now-chip-hour`, `.done-panel`, responsive breakpoint
  - Type-check 0, build clean

## In flight
- PR open, awaiting Architect gate + UX visual gate + QA smoke

## Next
- DevSecOps merge after all gates PASS

## Notes
- Branch: `feature/100-us056-done-panel`, base: `daa970e`
- Closes #251 (US-056)
- Visual surface: UX gate required
- Data logic: Architect gate required
- QA: smoke after both design gates
