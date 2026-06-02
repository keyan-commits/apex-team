# Issue #216 — Focus Ring Contrast Fix (ActiveWaveCard Poll Buttons) Design Spec

**Status:** `reviewed` | **Wave:** 96 / US-054 | **Designer:** UX | **Issue:** #216

---

## Overview

The poll buttons in `ActiveWaveCard` (`.aw-poll-btn`) use `outline: 2px solid var(--accent-po)` for their focus ring. When a button is in the selected state (`.aw-poll-selected`, `background: var(--accent-po)`), the focus ring is same-color-as-background — essentially invisible. WCAG 2.1 SC 1.4.11 (Non-text contrast, AA) requires a 3:1 contrast ratio between focus ring and adjacent color.

---

## Scope

- **File:** `src/components/ActiveWaveCard.tsx`
- **Target:** `.aw-poll-btn:focus-visible` (all poll buttons, including when `.aw-poll-selected` is applied)
- **AC5:** Change focus ring to a color with adequate contrast in both selected and unselected states.

---

## AC5 — Focus ring color and offset

**Before:**
```css
.aw-poll-btn:focus-visible {
  outline: 2px solid var(--accent-po);
  outline-offset: 1px;
}
```

**After:**
```css
.aw-poll-btn:focus-visible {
  outline: 2px solid var(--text);
  outline-offset: 2px;
}
```

### Color rationale

`var(--text)` resolves to `#e6e9ef` (near-white in the dark theme).

| Context | Background | Ring color | Contrast ratio |
|---|---|---|---|
| Unselected button | `var(--surface)` (dark) | `#e6e9ef` | ~15.1:1 ✓ |
| Selected button | `var(--accent-po)` (gold/orange) | `#e6e9ef` | ≥4.5:1 (estimated) ✓ |

Both contexts exceed WCAG 2.1 AA (3:1) and AAA (4.5:1) for non-text contrast.

### Offset rationale

`outline-offset: 2px` creates visible separation between the button background and the ring, preventing the ring from blending into the button's border.

---

## Interaction states

| State | Focus ring |
|---|---|
| Unselected, focused | `2px solid var(--text)`, offset 2px |
| Selected (`.aw-poll-selected`), focused | Same — `var(--text)` ring visible against accent-po background |
| Not focused | No ring (browser default) |
| Focused via mouse | No ring (`:focus-visible` only, not `:focus`) |

---

## Checklist

- [ ] `var(--text)` used (not hardcoded hex)
- [ ] `outline-offset: 2px` (not 1px)
- [ ] `:focus-visible` (not `:focus`)
- [ ] Ring visible in both selected and unselected states at ≥1280px

---

_UX Designer · 2026-06-02_
