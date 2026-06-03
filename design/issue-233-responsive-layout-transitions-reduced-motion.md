# Issue #233 — Responsive-Layout Transitions Reduced-Motion Overrides Design Spec

**Status:** `draft` | **Wave:** 108 (pre-stage, deferred implementation) | **Designer:** UX | **Issue:** #233

---

## Overview

This spec documents reduced-motion overrides for three responsive-layout features that are themselves deferred to follow-up implementation waves. When each feature lands, its RM guard must be added co-located with the transition rule (per US-062/063 and #210 precedent).

- Tablet strip height transition (issues panel collapsible header)
- Chevron rotation animation (tablet strip expand/collapse indicator)
- Mobile bottom-drawer slide-up transition
- `.recent-row` hover background transition (if added in a future wave)

All overrides follow the discipline: instant/suppress motion under `prefers-reduced-motion: reduce`, co-located with the animated rule.

---

## Scope

- **Files:** `src/app/dashboard/page.tsx` (tablet strip, chevron, recent-row) + responsive layout components for mobile drawer (deferred, location TBD)
- **Target:** All layout transitions triggered by expand/collapse, slide-in, or rotation
- **AC1–AC4:** RM guards for each transition pattern

---

## AC1 — Tablet strip height transition (expand/collapse)

**Context:** Issues panel on tablet (768–1279px width) renders as a collapsible header strip (e.g., max-height: 40px when collapsed → 200px when expanded).

**Default animation:** `transition: max-height 250ms ease-in-out` (or `height 250ms ease-in-out` depending on implementation)

**Reduced-motion override (co-located with the height transition rule):**
```css
@media (prefers-reduced-motion: reduce) {
  .issue-panel { /* or the specific collapsible container */
    transition: none;
  }
}
```

State table:
| State | Normal | Reduced-motion |
|---|---|---|
| Collapse (expanded→collapsed) | 250ms height shrink | instant collapse |
| Expand (collapsed→expanded) | 250ms height grow | instant expand |

---

## AC2 — Chevron rotation transition (tablet strip indicator)

**Context:** A chevron icon rotates 180° to indicate expanded/collapsed state on the tablet strip header.

**Default animation:** `transition: transform 250ms ease-in-out` on `transform: rotate(0deg)` ↔ `rotate(180deg)`

**Reduced-motion override (co-located with the transform transition rule):**
```css
@media (prefers-reduced-motion: reduce) {
  .issue-panel-chevron { /* or the specific chevron element */
    transition: none;
  }
}
```

State table:
| State | Normal | Reduced-motion |
|---|---|---|
| Collapse indicator | 250ms rotate 180°→0° | instant rotate to 0° |
| Expand indicator | 250ms rotate 0°→180° | instant rotate to 180° |

---

## AC3 — Mobile drawer slide-up transition

**Context:** On mobile (<768px width), the issues panel slides up from the bottom as a drawer overlay. The drawer's bottom-sheet behavior includes a slide-in transition when opened and a slide-out transition when closed.

**Default animation:** `transition: transform 250ms ease-in-out` on `transform: translateY(100%)` (off-screen) ↔ `translateY(0)` (on-screen)

**Reduced-motion override (co-located with the transform transition rule):**
```css
@media (prefers-reduced-motion: reduce) {
  .issue-drawer { /* or the specific drawer container */
    transition: none;
  }
}
```

State table:
| State | Normal | Reduced-motion |
|---|---|---|
| Slide up (open) | 250ms translateY(100%)→0 | instant appear |
| Slide down (close) | 250ms translateY(0)→100% | instant disappear |

---

## AC4 — Recent-row hover background transition (future-wave placeholder)

**Context:** The `.recent-row` container in the issues list may receive a hover background color transition in a future wave.

**Deferred to:** When AC4 is assigned to an implementation wave, add this override co-located with the hover transition rule:

```css
@media (prefers-reduced-motion: reduce) {
  .recent-row {
    transition: none;
  }
}
```

State table (when/if AC4 lands):
| State | Normal | Reduced-motion |
|---|---|---|
| Hover enter | X ms background fade | instant background |
| Hover exit | X ms background fade | instant background |

---

## Implementation notes

### Timing

All responsive-layout transitions should use **250ms** with **ease-in-out** to match the tablet strip animations. This provides adequate visual feedback without over-animating layout reflows.

### Co-location discipline

Each override must be placed **immediately after** its corresponding transition rule in the same CSS block — never consolidated into a separate reduced-motion block. This prevents the overrides from drifting out of sync if the animation rules are later modified.

### Deferred features

**AC1, AC2, AC3** are deferred pending their respective implementation waves (estimated Wave 109–110 based on current roadmap). Once each feature lands, the RM guard is added immediately — no separate RM follow-up wave.

**AC4** is explicitly deferred and may never land if `.recent-row` hover never receives a transition. This spec serves as a reference for reviewers: if a hover transition is added, the RM guard must accompany it.

---

## Checklist (per feature, when implemented)

- [ ] `@media (prefers-reduced-motion: reduce)` placed immediately after the transition rule
- [ ] `transition: none` applied (not omitted or deleted)
- [ ] No layout shift or visual pop when transition is removed
- [ ] Verified at 768px (tablet/mobile boundary) and ≥390px (mobile) viewports
- [ ] Drawer slide-in uses 250ms (match the overall responsive-layout timing)

---

## Related specs

- **US-062:** Reduced-motion guards (co-location discipline, established pattern)
- **US-063:** Stall-drawer motion cleanup (confirms no-transition via conditional render)
- **US-066:** Adaptive Issues panel (responsive layout foundation, pre-transition state)
- **#210:** Issues panel sort-toggle RM override (same co-location pattern)
- **#215:** ActiveWaveCard poll button RM override (same co-location pattern)

---

_UX Designer · 2026-06-03_
