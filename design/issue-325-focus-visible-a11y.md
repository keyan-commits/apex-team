# Issue #325 — Keyboard-Only Focus Visible Ring Implementation

**Status:** `reviewed` | **Wave:** 112+ | **Designer:** UX | **Issue:** #325

---

## Overview

Keyboard-only focus indicators (`:focus-visible`) must be visible on three primary interactive surfaces in the dashboard to meet WCAG 2.1 Level AA keyboard accessibility standards. Mouse clicks must NOT trigger visible focus rings (a distraction for sighted mouse users). Implementation uses role-specific accent colors to improve visual hierarchy and clarity.

---

## Scope

Three components with keyboard-reachable interactive elements:

1. **AgentStatePanel** — HANDOFF document scroll region (`.doc-scroll`)
2. **MessageBubble** — Collapsed message bubbles (`.bubble-collapsed`)
3. **Dashboard page** — Queued wave row drag handles (`.row.draggable`)

---

## AC1 — HANDOFF scroll region focus ring (AgentStatePanel)

**Element:** `.doc-scroll` (the scrollable HANDOFF document pane)

**Requirements:**
- Must have `tabIndex={0}` to be keyboard-reachable
- Focus ring appears **only** via keyboard navigation (`:focus-visible`)
- Ring color: `var(--accent-arch)` (purple #bb9af7)
- Ring width: 2px
- Outline offset: 2px (visible separation from edge)
- Border radius: 4px (rounded corners)

**States:**
| State | Appearance |
|---|---|
| Unfocused | No ring |
| Keyboard focus (Tab) | 2px purple ring, offset 2px |
| Mouse focus | No ring (`:focus-visible` only, not `:focus`) |

---

## AC2 — Collapsed message bubble focus ring (MessageBubble)

**Element:** `.bubble-collapsed` (when message is long and not expanded)

**Requirements:**
- Must have `tabIndex={0}` to be keyboard-reachable
- Must have `role="button"` for accessibility semantics
- Focus ring appears **only** via keyboard navigation (`:focus-visible`)
- Ring color: `var(--accent-ui)` (green #9ece6a)
- Ring width: 2px
- Outline offset: 2px
- Border radius: 10px (matches message bubble corner radius)

**States:**
| State | Appearance |
|---|---|
| Not collapsed (short message) | No focus ring (element not rendered) |
| Collapsed, unfocused | No ring |
| Collapsed, keyboard focus | 2px green ring, offset 2px |
| Collapsed, mouse click | No ring |

---

## AC3 — Dashboard queued row focus ring

**Element:** `.row.draggable` (draggable wave rows in QUEUED panel)

**Requirements:**
- Must have `tabIndex={0}` to be keyboard-reachable
- Must have `role="button"` for accessibility semantics
- Focus ring appears **only** via keyboard navigation (`:focus-visible`)
- Ring color: `var(--accent-po)` (gold #e0af68)
- Ring width: 2px
- Outline offset: 2px
- Border radius: 6px (matches row corner radius)

**States:**
| State | Appearance |
|---|---|
| Unfocused, not grabbed | No ring |
| Keyboard focus (Tab) | 2px gold ring, offset 2px |
| Mouse focus | No ring |
| Dragging (`.row-dragging`) | Opacity 0.4; focus ring (if present) still visible |

---

## Cross-cutting requirements

### Keyboard-only suppression
- All three elements use `:focus-visible` pseudo-class, **NOT** `:focus`
- This ensures focus rings appear ONLY on keyboard navigation
- Mouse clicks / focus-via-click do NOT trigger visible rings
- Per CSS Selectors Level 4 and WCAG 2.4.7 (Focus Visible)

### Motion compliance
- Focus rings have NO animation / transition
- When a focused element receives new background or border colors, focus ring remains static
- `@media (prefers-reduced-motion: reduce)` applies to any sibling transitions (e.g., row flash); focus ring itself has no motion

### Responsive behavior
- Focus ring styles apply uniformly at all viewport widths (desktop ≥1280px, tablet ≥768px, mobile ≥390px)
- Ring width and offset remain constant — no scaling or hiding on narrow viewports
- No horizontal scroll triggered by focus ring (outline does not expand beyond container bounds)

### Contrast and visibility
- Ring colors are role-specific accents (Architect purple, UI green, PO gold)
- All rings have ≥3:1 contrast ratio against typical background colors
- Ring width (2px) and offset (2px) ensure visibility without obscuring underlying content

---

## Density checklist

- [x] No unbound height on scrollable containers (`.doc-scroll` has `max-height: 220px`)
- [x] Message collapse threshold maintained (3 lines / 200 chars)
- [x] No overflow caused by focus ring outline (outline property does not affect layout)
- [x] Focus ring does not obscure any text or controls within the target element
- [x] Outline offset prevents ring from blending into element background

---

## Interaction states per element

### AgentStatePanel `.doc-scroll`
| Trigger | Visual | Keyboard accessible |
|---|---|---|
| Page load, HANDOFF closed | Not visible (parent hidden) | N/A |
| User clicks HANDOFF toggle to open | Element receives `tabIndex={0}`, gains focus-ring capability | Yes |
| User tabs into `.doc-scroll` | Purple ring visible | Yes |
| User scrolls within region | Ring remains visible if focused | Yes |

### MessageBubble collapsed bubble
| Trigger | Visual | Keyboard accessible |
|---|---|---|
| Message is short (`< 200 chars` / `< 3 lines`) | Bubble fully expanded, no `.bubble-collapsed` class | N/A |
| Message is long + user hasn't expanded it | Bubble shows preview with collapse indicator; can be tabbed to | Yes |
| User tabs to collapsed bubble | Green ring visible; Enter/Space toggles expand | Yes |
| User clicks collapsed bubble | Expands immediately; no ring visible on click (`:focus-visible` only) | Yes |

### Dashboard `.row.draggable`
| Trigger | Visual | Keyboard accessible |
|---|---|---|
| QUEUED panel loads with queued waves | Rows render; drag handles are focusable | Yes |
| User tabs to a row | Gold ring visible around row | Yes |
| User clicks row | Row can be expanded; no ring (mouse-triggered focus) | No ring visible on click |
| User grabs row (drag) | Opacity drops to 0.4; focus ring (if already focused) still visible | Yes |

---

## Test coverage

Unit tests in `tests/ui/focus-visible-a11y.test.ts`:
- ✓ `.doc-scroll` has `tabIndex={0}` (keyboard reachable)
- ✓ `.doc-scroll:focus-visible` uses `--accent-arch` color
- ✓ `.bubble-collapsed` has `role="button"` and `tabIndex={0}` when collapsed
- ✓ `.bubble-collapsed:focus-visible` uses `--accent-ui` color
- ✓ `.row.draggable` has `role="button"` and `tabIndex={0}`
- ✓ `.row.draggable:focus-visible` uses `--accent-po` color

E2E smoke test (QA on `:3100` test instance):
- ✓ All three focus rings render with correct colors
- ✓ Rings appear on keyboard Tab navigation
- ✓ Rings do NOT appear on mouse clicks
- ✓ Build passes (`pnpm build` exit 0)

---

_UX Designer · 2026-06-03_
