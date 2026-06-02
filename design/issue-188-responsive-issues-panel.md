# Issue #188 — Responsive Issues Panel Design Spec

**Status:** `reviewed` | **Wave:** 96 / US-054 | **Designer:** UX | **Issue:** #188

Extends `design/US-066-adaptive-issues-panel.md`. This spec covers the CSS layout, semantic HTML, and keyboard-nav requirements for AC6–AC9 of US-054.

---

## Layout

### AC6 — Desktop rail (≥1280px)

The issue panel occupies a fixed 280px fourth column to the right of the 3-column peer grid.

```
┌──────────────────────────────────────────────┐
│              OrchestratorBar                 │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│                  PO Pane                     │
└──────────────────────────────────────────────┘
┌────────────┬────────────┬────────────┬────────┐
│  Peer 1    │  Peer 2    │  Peer 3    │ Issues │
├────────────┼────────────┼────────────┤ Panel  │
│  Peer 4    │  Peer 5    │  Peer 6    │(280px) │
└────────────┴────────────┴────────────┴────────┘
```

**Grid CSS:**
```css
@media (min-width: 1280px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr)) 280px;
    align-items: start;
  }
  .issue-panel {
    grid-column: 4;
    grid-row: 2 / span 2;     /* rows 2–3 = the two peer rows */
    max-height: calc(100vh - 280px);
    overflow-y: auto;
  }
  .span2:not(.issue-panel) { grid-column: span 1; }
}
```

- `max-height: calc(100vh - 280px)` — caps the rail height; internal scroll for long lists.
- `overflow-y: auto` — internal scroll (not page scroll).
- Peer panels that had `.span2` reset to `span 1` at desktop (3-col peer grid = each panel gets 1 col).

### AC7 — Tablet strip (768px–1279px)

Full-width strip above the peer grid.

```
┌──────────────────────────────────────────────┐
│              OrchestratorBar                 │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│                  PO Pane                     │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│  Issues Panel (full width, above peer grid)  │
│  [▼] Issues · Backlog: 24 | In-flight: 3    │
└──────────────────────────────────────────────┘
┌────────────────────┬─────────────────────────┐
│  Peer 1   Peer 2   │  Peer 3  Peer 4 ...    │
└────────────────────┴─────────────────────────┘
```

**CSS:**
```css
@media (max-width: 1279px) and (min-width: 768px) {
  .issue-panel {
    grid-column: 1 / -1;   /* full width */
    order: -1;              /* above peers */
  }
}
```

**Collapsible header (deferred follow-up):** The tablet strip should have a 44px collapsed header showing count badges, expandable to a 200px max-height list via a toggle button. CSS and state management are pre-wired in this wave; the JSX toggle button is a follow-up. Until then the strip renders fully expanded.

### AC8 — Mobile (< 768px / existing 720px breakpoint)

Issues panel reflows into the single-column layout (no separate mobile drawer in this wave).

**Note:** The US-066 spec originally called for a fixed-bottom drawer on mobile. The drawer is deferred to a follow-up wave (#188-mobile-drawer). In this wave the panel stacks below the peer panels in the natural 1-column flow.

At `max-width: 720px` (existing breakpoint): `.grid { grid-template-columns: 1fr; }` — issues panel flows naturally.

---

## AC9 — Semantic HTML, keyboard nav, and ARIA

### Element

The issues panel section element MUST be:
```jsx
<aside className="panel issue-panel" aria-labelledby="issues-panel-title">
```

OR:
```jsx
<section role="complementary" className="panel issue-panel" aria-labelledby="issues-panel-title">
```

**Required:** `role="complementary"` (explicit on `<section>` or implicit via `<aside>`). Do NOT use plain `<section aria-labelledby>` — that yields an implicit `region` role, not `complementary`. The issues panel is supplementary content distinct from the agent panes (main content), making `complementary` the semantically correct landmark.

### Keyboard nav

Issue rows use `<a href={iss.url} target="_blank" rel="noreferrer">` for the main link body — Tab-focusable, Enter opens the GitHub issue. No `role="button"` hacks needed.

Checkboxes and "→ PO" buttons within each row are separately focusable (`<input type="checkbox">` and `<button>`). Tab order within a row: checkbox → link → PO button.

### Focus ring on issue-row interactive elements

Issue-row `<a>` elements inherit browser default focus ring (no custom override needed here; any existing focus ring on `.recent-row-body` must have ≥3:1 contrast). Existing `.issue-order-btn:focus-visible` uses `var(--accent-ui, var(--accent-po))` — acceptable on dark background.

---

## Interaction states

| State | ≥1280px | 768–1279px | <720px |
|---|---|---|---|
| Normal | Rail (280px col 4) | Full-width strip above grid | Stacked in 1-col flow |
| Overflow | Internal scroll | Full-height (deferred collapsible) | Page scroll |
| Scroll behavior | `overflow-y: auto` inside rail | Expand to list height | Normal |

---

## Open follow-ups (deferred, file as issues)

1. **Tablet collapsible header toggle button** — CSS ready, state wired, no JSX button. Track as `[ux:issues-tablet-toggle]` issue.
2. **Mobile drawer** — fixed-bottom drawer from US-066 spec deferred. Track as `[ux:issues-mobile-drawer]` issue.
3. **AC10 deferred-transition RM overrides** — co-locate `@media (prefers-reduced-motion: reduce)` overrides for tablet height transition, chevron rotate, and mobile drawer slide when those features land (see `design/issue-210-reduced-motion.md` §5).

---

## Density checklist

- [x] Desktop rail has `max-height + overflow-y: auto` — unbound height prevented
- [x] Issue list: existing `sortedRecentIssues` render — no max-item cap (acceptable for now; list is paginated by GitHub API)
- [x] Desktop rail does not reflow page — internal scroll only
- [ ] Tablet strip needs collapsible to prevent full-height blowout on long lists (deferred)

---

_UX Designer · 2026-06-02_
