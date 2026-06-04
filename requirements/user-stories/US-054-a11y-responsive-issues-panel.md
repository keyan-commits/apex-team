---
id: US-054
title: a11y + responsive Issues panel — reduced-motion, focus ring, grid layout (Wave 97)
status: superseded
wave: 97
closes: "PR #231"
owner: UI Dev
created: 2026-06-02
accepted: 2026-06-02
impl: "419e875"
---

## Resolution — superseded by Plan C cutover

All ACs target `src/app/dashboard/page.tsx` and `src/components/ActiveWaveCard.tsx` — monolith components retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). The a11y + responsive work targeted the dashboard UI. Re-file against the apex-team-viewer repo if needed there.

## Story

As a user with motion sensitivity or keyboard-only navigation, I want the dashboard to respect `prefers-reduced-motion`, provide sufficient focus rings for interactive elements, and present the Issues panel in a readable responsive layout, so that the app is usable regardless of accessibility needs or screen width.

## Acceptance criteria

1. `.issue-order-btn`: `@media (prefers-reduced-motion: reduce)` override — instant state change, no 100ms fade.

2. `.row.row-flash`: `@media (prefers-reduced-motion: reduce)` override — no background flash on reorder.

3. `.aw-poll-btn`: `@media (prefers-reduced-motion: reduce)` override — instant button state, no 120ms fade.

4. `.spinner`: `@media (prefers-reduced-motion: reduce)` → `rm-spinner-pulse` keyframe (1.5s opacity cycle 1→0.3→1, no rotation).

5. `.aw-poll-btn:focus-visible`: `outline-color: var(--text)`, `outline-offset: 2px` (was gold 1px at 2.0:1 contrast; new: 15.1:1 in all states). No `prefers-reduced-motion` rule needed for focus rings.

6. Desktop rail layout: `grid-template-columns: repeat(3,1fr) 280px` at ≥1280px — Issues panel as 4th column.

7. Tablet strip: full-width strip above peers on tablet (below 1280px); Issues panel reflows above 3-col peer grid.

8. Mobile: single-column reflow; all panels stack vertically.

9. Keyboard navigation: issue rows (`.recent-row`) focusable via Tab; Enter/Space opens GitHub link; Escape closes panel.

## Design specs

- Reduced-motion rules: `design/issue-210-reduced-motion.md`
- Focus ring spec: `design/issue-216-focus-ring.md`
- Responsive layout: `design/issue-188-responsive-issues-panel.md`

## Out of scope

- `prefers-color-scheme` dark mode (separate wave).
- Screen-reader ARIA labels beyond what `<a>` and semantic HTML provide.

## Implementation

- impl: `419e875` (PR #231, UX gate in progress as of Wave 97)
- Files changed: `src/app/dashboard/page.tsx`, `src/components/ActiveWaveCard.tsx`

## Notes

- UI label idle badge rendering (deferred from US-052 AC8) is a dependency for a follow-up wave.
- UX Designer gate is required before QA smoke; UX gate triggered after UI Dev push to origin.
