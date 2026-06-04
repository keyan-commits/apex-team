---
ticket: UX-0001
parent_feat: FEAT-0004
parent_us: US-101
role: ux-designer
status: accepted
---

# UX-0001 — Viewer A11y Polish

## Scope

Four accessibility regressions filed during Wave 123 UX gate against `keyan-commits/apex-team-viewer`. All four are in the Output tab of the viewer (`public/style.css` + `public/app.js`). Implementation is a CSS + JS patch; no layout reflow expected.

| Issue | WCAG 2.1 SC | Severity |
|---|---|---|
| #5 — `.search` input missing `:focus-visible` replacement | **SC 2.4.11** Focus Appearance | block |
| #7 — `.feat-card-header` + `.badge-btn` 25%-alpha focus ring (~1.4:1) | **SC 1.4.11** Non-text Contrast | block |
| #8 — `.file-open` spans not keyboard-reachable (no tabindex/role/keydown) | **SC 2.1.1** Keyboard | block |
| #9 — `.feat-card-body` missing `role="region"` + `aria-labelledby` | **SC 4.1.2** Name, Role, Value | block |

---

## 1. Canonical Focus-Ring Style

### Token definition

```
color : #6a8cd6  (solid, no alpha)
width : 2px
style : solid
offset: 1px (positive — ring draws outside element boundary)
selector: :focus-visible only (never :focus)
```

### Contrast verification

| Surface | Ring color | Background | Contrast ratio | Passes |
|---|---|---|---|---|
| FEAT card bg (`#131318`) | `#6a8cd6` | `#131318` | **5.59:1** | Yes (min 3:1, SC 1.4.11) |
| Page bg (`#0d0d12`) | `#6a8cd6` | `#0d0d12` | **5.85:1** | Yes |

Old value (`.feat-card-header:focus-visible`): `#6a8cd640` at 25% alpha over `#131318` blends to approximately `rgb(40,49,71)` — contrast **1.43:1**. Fails SC 1.4.11.

### Why positive offset, not negative

Negative `outline-offset` draws the ring inside the element boundary. Against a dark card background the inside-ring can visually merge with the element's own background color when using low-alpha values. Positive offset draws the ring cleanly against the surrounding page background, maximizing perceived contrast without depending on element-interior color.

### CSS rule pattern (apply consistently)

```css
.some-interactive:focus-visible {
  outline: 2px solid #6a8cd6;
  outline-offset: 1px;
}
```

This replaces every existing `:focus-visible` rule that uses `#6a8cd640` (25% alpha) or `outline-offset: -2px`.

---

## 2. Element-by-Element Changes

### 2a. `.search` input (issue #5)

**Current state:**
```css
.search { outline: none; }
.search:focus { border-color: #6a8cd6; }
/* no :focus-visible rule */
```

**Required state:**
```css
.search { outline: none; }
.search:focus { border-color: #6a8cd6; }
.search:focus-visible {
  outline: 2px solid #6a8cd6;
  outline-offset: 1px;
}
```

Interaction states:
- **default**: no ring, border `#1e2028`
- **hover**: no ring change
- **focus (mouse click)**: `border-color: #6a8cd6` only (`:focus` rule) — matches existing pattern for `.select`
- **focus-visible (keyboard Tab)**: ring `2px solid #6a8cd6`, offset 1px, plus `border-color: #6a8cd6` from the existing `:focus` rule
- **disabled**: not applicable (search is never disabled)
- **error**: not applicable (no validation on this input)

### 2b. `.feat-card-header:focus-visible` (issue #7)

**Current state:**
```css
.feat-card-header:focus-visible {
  outline: 2px solid #6a8cd640;   /* 25% alpha — 1.43:1 contrast */
  outline-offset: -2px;
}
```

**Required state:**
```css
.feat-card-header:focus-visible {
  outline: 2px solid #6a8cd6;   /* solid — 5.59:1 contrast */
  outline-offset: 1px;
}
```

No other change to `.feat-card-header` rules.

Interaction states:
- **default**: no ring
- **hover**: background shift (existing `.feat-card-header:hover` rule unchanged)
- **focus-visible**: ring per canonical style above
- **aria-expanded="true"**: expanded indicator (chevron rotation, existing) + focus ring when focused
- **loading / disabled**: not applicable

### 2c. `.badge-btn:focus-visible` (issue #7, same pass)

**Current state:**
```css
.badge-btn:focus-visible {
  outline: 2px solid #6a8cd640;   /* 25% alpha */
  outline-offset: 2px;
}
```

**Required state:**
```css
.badge-btn:focus-visible {
  outline: 2px solid #6a8cd6;
  outline-offset: 1px;
}
```

Interaction states:
- **default**: no ring, `color: #6a6e78`, no border-color
- **hover**: `color: #9ca0aa`, `border-color: #2a2a32`
- **focus-visible**: ring per canonical style; `border-color: #6a8cd6` (existing rule retained)
- **aria-pressed="true"**: `color: #4a4e58` (existing rule unchanged)

### 2d. `.file-open` spans — keyboard reachability (issue #8)

**Scope:** all `.file-open` spans rendered by `renderTicketRow()` (line 121), `renderFeatGrouped()` lines 169–170 and 188–189, and flat row at line 260. The fix must be applied uniformly — not only to FEAT card rows.

#### HTML attribute changes (`app.js`)

Every `<span class="row-main file-open" data-path="...">` must become:

```html
<span class="row-main file-open" tabindex="0" role="button" data-path="...">
  ...
</span>
```

**Decision rationale — `<span tabindex="0" role="button">` vs. native `<button>`:**

Using a native `<button>` would be semantically cleaner and give Enter/Space activation for free. However, the existing codebase applies `.file-open` click handlers by querying `$$('#output-list .file-open')` and `$$('#tickets-list .file-open')` after render. Switching to `<button>` would require CSS reset work (removing default button appearance: `border`, `background`, `padding`, `cursor`) across `.file-row`, `.feat-ticket-row`, and the flat row styles — a wider surface change not scoped to this wave.

`<span tabindex="0" role="button">` makes the element keyboard-reachable and announces as "button" to assistive technology with zero CSS change. Trade-off: Enter and Space must be wired explicitly (see below). Accepted for this wave. A follow-on refactor to native `<button>` can be filed as a self-improvement issue if desired.

#### Keyboard handler (wired at the same event-wiring site where click handlers are attached)

```javascript
// After existing click-handler wire-up for .file-open:
$$('#output-list .file-open, #tickets-list .file-open').forEach(el => {
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFile(el.dataset.path);
    }
  });
});
```

`e.preventDefault()` on Space prevents the page from scrolling.

Interaction states:
- **default**: focusable via Tab, `role="button"` announced by AT as "button"
- **hover**: `color: #9bb8e6` (existing CSS unchanged)
- **focus-visible**: ring per canonical style — no new CSS needed IF the canonical `.file-open:focus-visible` rule is added to style.css (see CSS below)
- **active (Enter/Space)**: `openFile(path)` fires; no visual state change required (same as click)
- **disabled**: not applicable

#### CSS addition for `.file-open` focus ring

```css
.file-open:focus-visible {
  outline: 2px solid #6a8cd6;
  outline-offset: 1px;
  border-radius: 2px;
}
```

`border-radius: 2px` prevents a sharp-cornered ring on inline-ish text content. Matches the subtle rounding on `.feat-card-header`.

Tab order: DOM order. No `tabindex` value other than `0`. SR reads elements in source order, which matches visual order for all three rendering paths.

### 2e. `.feat-card-body` landmark (issue #9)

**Scope:** `renderFeatGrouped()` in `app.js`, the body div at line 233.

**Current HTML (generated):**
```html
<div class="feat-card-body" id="${bodyId}" hidden>
  <div class="list feat-card-list">...</div>
</div>
```

**Required HTML (generated):**
```html
<div class="feat-card-body"
     id="${bodyId}"
     role="region"
     aria-labelledby="feat-header-${feat.feat}"
     hidden>
  <div class="list feat-card-list">...</div>
</div>
```

The parent button (`.feat-card-header`) must receive a matching `id`:

**Current button (line 227):**
```html
<button class="feat-card-header" aria-expanded="false" aria-controls="${bodyId}">
```

**Required:**
```html
<button class="feat-card-header" id="feat-header-${feat.feat}" aria-expanded="false" aria-controls="${bodyId}">
```

`feat.feat` is the FEAT identifier string (e.g. `FEAT-0002`). No sanitization needed beyond what `esc()` already provides.

Expected SR announcement when user navigates into the region:
> "FEAT-0002 — Viewer FEAT-grouped rendering, region"

(SR reads the button label, which is composed of `feat-card-id` + `feat-card-title` spans already in the DOM.)

Interaction states (AT-facing):
- **hidden (aria-expanded="false")**: body is `hidden`; AT skips the region
- **visible (aria-expanded="true")**: body is shown; AT announces the region on navigation

No visual change. `role="region"` and `aria-labelledby` are AT-only attributes.

---

## 3. ASCII Wireframe — Output Tab Focus Flow

```
┌─────────────────────────────────────────────────────────────┐
│  [Tab 1: Tickets]  [Tab 2: Output] ←─ keyboard Tab stops    │
├─────────────────────────────────────────────────────────────┤
│  [🔍 Search...     ]  [Badge A] [Badge B]                   │
│   ↑ :focus-visible ring 2px solid #6a8cd6, offset 1px       │
│                       ↑ same ring on :focus-visible          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ▶  FEAT-0001  Some title         (3 files)          │   │
│  │     ↑ :focus-visible ring on button, offset 1px      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ▼  FEAT-0002  Another title      (5 files) [button] │◄─ ring  
│  │  ╔══════════════════════════════════════════════════╗ │   │
│  │  ║  role="region" aria-labelledby="feat-header-…"  ║ │   │
│  │  ║  ┌──────────────────────────────────────────┐   ║ │   │
│  │  ║  │ [span role="button" tabindex="0"] path/a │◄──╫─┼── ring (focus-visible)
│  │  ║  └──────────────────────────────────────────┘   ║ │   │
│  │  ║  ┌──────────────────────────────────────────┐   ║ │   │
│  │  ║  │ [span role="button" tabindex="0"] path/b │   ║ │   │
│  │  ║  └──────────────────────────────────────────┘   ║ │   │
│  │  ╚══════════════════════════════════════════════════╝ │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Tab order (within Output tab):
  Search → Badge buttons → FEAT-0001 header → (if expanded: file rows) → FEAT-0002 header → …
```

---

## 4. Responsive Behavior

This wave introduces no layout changes. Existing breakpoints (`@media (max-width: 1100px)` and `@media (max-width: 768px)`) are unaffected.

The `@media (prefers-reduced-motion: reduce)` block in style.css already nulls `.feat-card-header` transitions. No new motion introduced by this wave — no additions needed.

---

## 5. Visual-Regression Posture

No pixel-level changes expected on mouse-driven paths:

- Focus rings use `:focus-visible` — they only appear on keyboard focus. Mouse clicks do not trigger `:focus-visible` in modern browsers (Chrome/Firefox/Safari all implement the heuristic).
- `role="region"` and `aria-labelledby` are AT-only attributes — no visual rendering.
- `tabindex="0"` and `role="button"` on `.file-open` spans add no default styling.

The only visual diff visible in a screenshot tool: a keyboard-focus outline on `.search`, `.badge-btn`, `.feat-card-header`, or `.file-open` elements when focus is placed programmatically. This is expected and correct.

---

## 6. A11y Verification Checklist

UI Dev verifies all items before HANDOFF to UX gate:

| # | Check | Pass criterion |
|---|---|---|
| 1 | VoiceOver rotor (Safari, macOS) — Landmarks | All FEAT card bodies appear as named regions (e.g. "FEAT-0002 — Another title"). No unnamed regions. |
| 2 | Tab through Output tab — `.file-open` rows | Every file row receives visible focus ring (2px solid blue, offset outside element). No rows skipped. |
| 3 | Enter on focused `.file-open` | `openFile()` fires (viewer opens the file). Behavior identical to click. |
| 4 | Space on focused `.file-open` | Same as Enter. Page does NOT scroll. |
| 5 | Tab to `.search` input | `:focus-visible` ring visible at 1px positive offset. Distinct from resting border. |
| 6 | Tab to `.badge-btn` | `:focus-visible` ring visible, solid blue. No alpha wash. |
| 7 | Tab to `.feat-card-header` | `:focus-visible` ring visible, solid blue (5.59:1 vs. card bg). No alpha wash. |
| 8 | Contrast check — `.feat-card-header:focus-visible` | Ring `#6a8cd6` vs `#131318`: ≥3:1. Computed: 5.59:1. |
| 9 | Contrast check — `.search:focus-visible` | Ring `#6a8cd6` vs page bg: ≥3:1. Computed: 5.85:1. |
| 10 | ≥1280px viewport | All FEAT cards visible simultaneously; no layout shift from ring changes. |
| 11 | 390px viewport | No overflow introduced by ring (positive offset does not break mobile layout). |
| 12 | `prefers-reduced-motion` | No new animations or transitions introduced; nothing to verify. |

---

## 7. Copy Inventory

This wave introduces no new visible copy. All strings are pre-existing:
- FEAT card titles: rendered from data (unchanged)
- Search placeholder: `"Search…"` (unchanged)
- Badge button labels: pre-existing (unchanged)

ARIA labels / AT-facing strings:
- Region name: derived from button text — `"${feat.feat} — ${feat.title}"` (SR reads the button content; no `aria-label` override needed)
- `role="button"` on `.file-open` spans: SR announces element text as button label; no separate `aria-label` needed unless path text is ambiguous (it is a file path — sufficient)

---

## 8. Out of Scope (this wave)

- Replacing `<span role="button">` with native `<button>` elements (scoped out to avoid CSS reset churn)
- Keyboard reorder in QUEUED panel (separate issue #21)
- Dashboard poll error banner (issue #22)
- Error pill expand (issue #24)
- Any `accesslint` / `eslint-plugin-jsx-a11y` integration (deferred per Wave 111b)
