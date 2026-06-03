# Issue #215 — Reduced-Motion Override for ActiveWaveCard Poll Button Design Spec

**Status:** `ready` | **Wave:** 108 | **Designer:** UX | **Issue:** #215

---

## Overview

The poll-cadence button in `ActiveWaveCard` (`.aw-poll-btn`) uses `transition: background 120ms, color 120ms` for visual feedback when selected/deselected. Under `prefers-reduced-motion: reduce`, this transition must be suppressed instantly. WCAG 2.1 SC 2.3.3 (Animation from Interactions, AAA) requires that all motion transitions be suppressable.

---

## Scope

- **File:** `src/components/ActiveWaveCard.tsx`
- **Target:** `.aw-poll-btn` (poll-interval selector buttons)
- **AC1:** Add `@media (prefers-reduced-motion: reduce)` override co-located with the animated rule.

---

## AC1 — Poll button transition override

**Default animation:** `transition: background 120ms, color 120ms`

**Reduced-motion override (co-located immediately after `.aw-poll-btn` rule):**
```css
@media (prefers-reduced-motion: reduce) {
  .aw-poll-btn { transition: none; }
}
```

State table:
| State | Normal | Reduced-motion |
|---|---|---|
| Select option | 120ms fill | instant fill |
| Deselect option | 120ms unfill | instant unfill |

---

## Implementation pattern

Follow the same co-location discipline as US-062/063 and #210:
- Place the `@media (prefers-reduced-motion: reduce)` block **immediately after** the animated rule.
- Do NOT move it to a separate CSS file or consolidate into a single RM block elsewhere — each component owns its RM guards.

---

## Interaction states

All states remain functionally identical; only timing changes under reduced-motion:

| State | Focus | Motion |
|---|---|---|
| Default (not selected, not focused) | none | no animation |
| Hover (not selected) | hover background | 120ms → instant |
| Selected | any | background instant |
| Selected + focused | `:focus-visible` ring | ring always present, background instant |

---

## Checklist

- [ ] `@media (prefers-reduced-motion: reduce)` placed immediately after `.aw-poll-btn` rule
- [ ] `transition: none` applied (not omitted, not deleted)
- [ ] No layout shift or visual pop when transition is removed
- [ ] Verified at ≥1280px and ≥390px viewports

---

_UX Designer · 2026-06-03_
