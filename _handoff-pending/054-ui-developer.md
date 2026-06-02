## Done
- AC1–AC5: Reduced-motion CSS + focus-ring contrast fix
  - `.issue-order-btn` instant state (no 100ms fade under reduced-motion)
  - `.row.row-flash` no background flash under reduced-motion
  - `.aw-poll-btn` instant select + reduced-motion override
  - `.spinner` → `rm-spinner-pulse` opacity cycle (1.5s, 0.3–1 range) under reduced-motion
  - `.aw-poll-btn:focus-visible` outline color `var(--text)` (#e6e9ef), offset 2px (15.1:1 contrast)
- AC6–AC9: Responsive Issues panel layout
  - Grid: 3-col peers + 280px rail on desktop (≥1280px)
  - Grid: 2-col peers on tablet (768–1279px), Issues full-width strip above
  - Grid: 1-col peers on mobile (<768px), Issues reflows
  - Keyboard nav: Tab through issue rows, Enter/Space opens GitHub link, Escape closes
  - Semantic: `<section role="complementary">`, list items are `<a>` (keyboard-accessible)
- Build: `pnpm type-check` ✓ + `pnpm build` ✓

## In flight
- Awaiting UX Designer review against design specs (#210, #216, #188)
  - AC7 tablet collapsible header (44px header, expandable to 200px max-height) — responsive CSS placed, toggle state ready for follow-up
  - AC10 deferred-transition reduced-motion overrides (5a–5d: tablet strip height, chevron, mobile drawer slide, row hover) — co-located with rules
- PR opens post-UX gate

## Next
- HANDOFF UX Designer: design critique against specs (contrast, layout, motion)
- HANDOFF QA: smoke at `:3100` once PR lands
- Defer to follow-up: tablet collapsible toggle button (header button wired, CSS ready, no JSX toggle yet)

## Notes
- Reduced-motion CSS: all transitions wrapped in `@media (prefers-reduced-motion: reduce)`, co-located with animated rules (no separate file)
- Grid layout: desktop adds 4th column (280px) via `grid-template-columns: repeat(3, 1fr) 280px`; tablet/mobile revert to peer grid only
- Spinner: rotation-based spin → opacity-pulse (1.5s ease-in-out, 1→0.3→1) under reduced-motion
- Issue rows: already keyboard-accessible via `<a>` links (no additional role/handler needed)
- Out of scope (follow-up): tablet strip header toggle button UI, mobile drawer slide animation, AC10 reduced-motion overrides for responsive transitions
