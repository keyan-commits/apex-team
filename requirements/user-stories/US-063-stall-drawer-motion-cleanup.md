# US-063 — StallSettingsDrawer Motion Cleanup

**Status:** accepted
**Owner role:** ui-developer
**Created:** 2026-06-03
**Story ID:** US-063

---

## Narrative

As a user with `prefers-reduced-motion: reduce` enabled, I want the stall-settings drawer to appear without motion, so that I am not exposed to vestibular-triggering CSS transitions when the drawer opens.

## Acceptance Criteria

- **AC1 (dead-code removal):** Given that `StallSettingsDrawer.tsx` is conditionally rendered and always mounts with the `open` class simultaneously (so the `.stall-drawer` base rule `transform: translateX(100%)` is immediately overridden by `.stall-drawer.open`'s `translateX(0)` with no transition firing), when the motion cleanup is applied, then the `transition: transform 250ms ease-in-out` rule on `.stall-drawer` is **removed**. _(Removal is safe: the transition is inert and produces no user-visible animation under the current conditional-render model. If Architect determines a guarded slide-in is architecturally preferable, AC1-alt applies instead: the transition is retained but wrapped in `@media (prefers-reduced-motion: no-preference)` so it never fires for RM users.)_ _(Testable: verify `.stall-drawer` CSS contains no `transition` property, or verify the property is inside a `no-preference` media query only.)_

- **AC2 (RM user — no motion):** Given a browser/OS with `prefers-reduced-motion: reduce` active, when the drawer opens (mounts), then no CSS transition fires on `.stall-drawer` — the drawer appears instantaneously with no slide-in. _(Testable: DevTools → Emulate CSS media → prefers-reduced-motion: reduce; open drawer; no translateX movement observed.)_

- **AC3 (non-RM user — no regression):** Given a user without reduced-motion preference, after AC1 (removal branch) is applied, when the drawer opens, then the drawer appears instantly — the same as before cleanup, since the transition was already inert. No visible regression in the non-RM experience. _(Testable: observe drawer open with RM emulation off; instant appearance expected.)_

- **AC4 (functional correctness preserved):** Given the drawer conditionally mounts and unmounts on open/close events, when the drawer is opened or closed via any trigger (close button, backdrop click, `Escape` key), then: focus trap activates on open; focus returns to trigger on close; backdrop click dismisses; ARIA attributes (`role="dialog"`, `aria-modal`, `aria-label`) are unchanged. _(Testable: keyboard-navigate through the drawer open/close cycle.)_

- **AC5 (CI gates):** `pnpm type-check` passes with 0 errors; `pnpm test:run` passes with all existing tests green.

## Out of Scope

- Pill-pulse (`AgentPane.tsx`) and pending-dot (`MessageBubble.tsx`) reduced-motion guards — those are US-062, the prior wave.
- Any new open/close slide animation design for the drawer — would require a separate UX design wave and fresh triad.
- Other CSS transitions in the codebase not on `.stall-drawer`.
- Changing the conditional-render behavior of `StallSettingsDrawer` — that shipped in US-060 (PR #278).

## Open Questions

- **OQ-063-001:** Architect verdict (Wave 105 Lane-A dispatch): remove the transition outright (AC1 primary) OR retain guarded by `prefers-reduced-motion: no-preference` (AC1-alt)? Either satisfies NFR-MOTION-002. UX Designer concurrence expected in the same wave. Implementation must wait for both replies before coding AC1.

## Design Spec

- Architect NFR-MOTION-002 (`architecture/nfr.md`): all CSS animations/transitions must have a `@media (prefers-reduced-motion: reduce)` override or be provably inert for RM users. Removal satisfies this without adding an override clause.
- UX interaction note: pending UX Designer reply from Wave 105 Lane-A dispatch (keep-vs-remove recommendation + RM fallback confirmation). Will link to design doc when authored.

## Links

_(Filled in during and after implementation)_

- impl: `(SHA-pending)`
- closes: #281, #282
