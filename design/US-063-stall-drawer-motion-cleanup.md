# US-063 — StallSettingsDrawer motion cleanup

**Issue refs:** #281 (dead transition), #282 (missing RM guard)  
**Status:** design note (interaction audit)

## Context

The `StallSettingsDrawer` conditionally renders when `open === true` (mounts with `.open` class already present). This pattern — element-only-exists-when-open — makes the slide-in `transition: transform 250ms` dead code. The drawer never animates from off-screen to on-screen; it appears instantly at `translateX(0)`.

## Interaction decision

**Remove the transition entirely.** Justification:
- Dead code adds visual confusion (readers may assume animation is intended).
- Conditional render is the correct interaction: the drawer exists and is visible the instant the user triggers it. No motion required.
- No animation on open = no animation-related a11y concern + no RM guard needed.

## Spec

- **CSS to remove:** `.stall-drawer { transition: transform 250ms ease-in-out }` and `.stall-drawer.open { transform: translateX(0) }` — keep the base `transform: translateX(100%)` gone (the opening state is handled by conditional render).
- **No `@media (prefers-reduced-motion)` needed:** animation is removed entirely, not guarded.
- **Rendered behavior:** drawer appears in `translateX(0)` frame immediately when element mounts. No slide.

## Verification

- [ ] Drawer opens instantly (no slide-in animation).
- [ ] Drawer closes instantly (conditional render removes element).
- [ ] No visual regression vs. before this wave (drawer was opening instantly already; spec just codifies removal).

---

_UX Designer · Wave 105, Lane-A pre-stage (N+1)_
