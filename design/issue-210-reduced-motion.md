# Issue #210 — Reduced-Motion Overrides Design Spec

**Status:** `reviewed` | **Wave:** 96 / US-054 | **Designer:** UX | **Issue:** #210

---

## Overview

Add `@media (prefers-reduced-motion: reduce)` overrides for every CSS animation and transition in the dashboard and ActiveWaveCard. WCAG 2.1 SC 2.3.3 (AAA) and common accessibility practice require that motion is suppressable. Overrides must be co-located with the animated rule (not in a separate block) to prevent drift.

---

## Interaction states — animated elements

### AC1 — Sort-toggle button (`.issue-order-btn`)

**Default animation:** `transition: background 0.1s, color 0.1s`

**Reduced-motion override (co-located immediately after `.issue-order-btn` rule):**
```css
@media (prefers-reduced-motion: reduce) {
  .issue-order-btn { transition: none; }
}
```

State table:
| State | Normal | Reduced-motion |
|---|---|---|
| hover→active | 100ms fade | instant |
| active→hover | 100ms fade | instant |

### AC2 — Row flash (`.row.row-flash`)

**Default animation:** `transition: background 200ms ease-out` (background flashes to `var(--surface-2)` on content update)

**Reduced-motion override (co-located immediately after `.row.row-flash` rule):**
```css
@media (prefers-reduced-motion: reduce) {
  .row.row-flash {
    transition: none;
    background: var(--surface-0);
  }
}
```

Setting `background: var(--surface-0)` ensures no visual pop even when the class is toggled — the row returns to its base surface color.

State table:
| State | Normal | Reduced-motion |
|---|---|---|
| content update | 200ms background flash | no color change |

### AC3 — Poll button (`.aw-poll-btn` in ActiveWaveCard)

**Default animation:** `transition: background …` (inherits from button default or explicit rule)

**Reduced-motion override (co-located immediately after `.aw-poll-btn` rule, inside `ActiveWaveCard.tsx`):**
```css
@media (prefers-reduced-motion: reduce) {
  .aw-poll-btn { transition: none; }
}
```

State table:
| State | Normal | Reduced-motion |
|---|---|---|
| select | animated fill | instant fill |
| deselect | animated unfill | instant unfill |

### AC4 — Loading spinner (`.spinner`)

**Default animation:** `animation: spin 0.6s linear infinite` (full rotation)

**Reduced-motion override — opacity pulse, NOT `animation: none` (co-located after the spinner + @keyframes spin block):**
```css
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: rm-spinner-pulse 1.5s ease-in-out infinite;
    border-top-color: currentColor;
  }
  @keyframes rm-spinner-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
}
```

`animation: none` would leave a static ring with no loading signal. The opacity pulse conveys "working" without vestibular-triggering rotation. Cycle: 1.5s (slower than the 1s default to reduce anxiety). Opacity range: 0.3–1 (visible at lowest).

`border-top-color: currentColor` normalizes all border segments (the spin effect uses a highlighted top border; without rotation, all borders should be uniform).

State table:
| State | Normal | Reduced-motion |
|---|---|---|
| loading | 0.6s spin | 1.5s opacity pulse |
| idle | hidden | hidden |

---

## §5 — Deferred-transition overrides (AC10)

These reduced-motion overrides apply to responsive layout transitions that are themselves deferred to a follow-up wave. They should be added co-located with their respective rules when those features land:

- **5a — Tablet strip height transition:** suppress `height` / `max-height` CSS transition on the issues panel's tablet expand/collapse.
- **5b — Tablet strip chevron rotation:** suppress `transform: rotate()` CSS transition on the chevron icon.
- **5c — Mobile drawer slide:** suppress `transform: translateY()` transition on the mobile bottom-drawer slide-up.
- **5d — Row hover:** suppress any hover background transition on `.recent-row` (if a transition is added in a later wave).

---

## Checklist

- [ ] All overrides co-located with animated rule (not in a separate file or block)
- [ ] Spinner uses pulse, not `animation: none`
- [ ] `@media (prefers-reduced-motion: reduce)` (not `no-preference`)
- [ ] No layout shifts introduced by the overrides themselves
- [ ] Verified at ≥1280px and ≥390px viewports

---

_UX Designer · 2026-06-02_
