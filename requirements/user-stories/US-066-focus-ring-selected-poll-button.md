---
name: US-066-focus-ring-selected-poll-button
description: Focus-ring contrast on selected poll-cadence button (#216) — `.aw-poll-selected.aw-poll-btn:focus-visible` specificity override so the ring is visible against the accent-colored selected state. WCAG 2.1 SC 1.4.11 ≥3:1. UX owns ring-color/token decision.
metadata:
  type: user-story
  status: accepted
  owner: UI Dev
  closes: "#216"
  wave: Wave 108
---

## Story

As a keyboard user, I want the focus ring on the selected poll-cadence button to be clearly visible against the button's selected-state background, so that I can determine which button has focus when navigating by keyboard.

## Acceptance criteria

1. **Specificity override present** — `src/components/ActiveWaveCard.tsx` contains a CSS rule matching `.aw-poll-selected.aw-poll-btn:focus-visible` (or an equivalent higher-specificity selector) that sets an `outline-color` distinct from the selected-state background (`--accent-po`, approximately `#e0af68`).

2. **UX-specified ring color** — UX Designer's parallel Wave 108 pre-stage spec confirmed `var(--text)` is reused as the ring color (no new token). Implementation uses `outline-color: var(--text)` on the specificity override, unless UX spec specifies otherwise. UX spec is authoritative if it diverges.

3. **WCAG contrast** — the focus ring achieves ≥3:1 contrast against the selected button background (`--accent-po`) per WCAG 2.1 SC 1.4.11 Non-Text Contrast. Verify with a color-contrast checker (e.g. APCA or the browser DevTools accessibility inspector) against both light and dark theme values of `--text` and `--accent-po`.

4. **No regression** — unfocused poll buttons and unselected (but focused) poll buttons retain their existing focus-visible appearance without change.

## Open questions

None. OQ-065-001 resolved (Architect split rec, Wave 108 pre-stage). UX parallel spec confirmed `var(--text)` reused, no new design token.

## Out of scope

- Changing the `--accent-po` token value.
- Audit of focus rings on other dashboard elements.
- Reduced-motion transitions on poll buttons — that is US-065 (#215).

## Notes

- **Split from US-065** on Architect's Wave 108 pre-stage recommendation: #216 is focus-visible *contrast* (WCAG 1.4.11/2.4.7), structurally distinct from the RM-transition trio; it warrants a separate test axis and a separate lane (UX owns the fix).
- **RM lineage context:** US-061 → US-062 → US-063 → US-065 (RM trio) / **US-066** (this story, focus-ring contrast).
- **#188 coupling:** US-066 and #188 (responsive-layout transitions) share the `ActiveWaveCard.tsx` surface. If both land in the same wave, verify no CSS conflicts.
- Implementation held — Lane B single-occupancy (Wave 107 owns Lane B until its PR lands).
- Discovered during: Wave 122 UX gate PR #213 (#216).
