---
ticket: US-101
parent_feat: FEAT-0004
role: business-analyst
status: done
---

# US-101 — Viewer A11y Polish

**Status:** in-flight (Wave 125)

**Parent feature:** [FEAT-0004 — Viewer A11y Polish](../features/FEAT-0004-viewer-a11y-polish.md)

---

## Story

As a keyboard-only or screen-reader user of the apex-team-viewer, I want the viewer's
FEAT-grouped card UI to be fully keyboard-navigable and WCAG 2.1 conformant, so that I
can open files, browse feature cards, and read card regions without relying on a mouse
or encountering invisible focus indicators.

---

## Background

During the Wave 123 UX gate for FEAT-0002 (Viewer FEAT-Grouped Rendering), the UX
Designer flagged four non-blocking accessibility warns against the newly shipped viewer
UI. The Wave 125 bundle closes all four:

- **#5** — `.search` input: `outline: none` without a `:focus-visible` replacement
  (WCAG 2.4.11 Focus Appearance).
- **#7** — `.feat-card-header` + `.badge-btn`: 25%-alpha focus ring (`#6a8cd640`)
  → ~1.8:1 contrast against `#131318` background (WCAG 1.4.11 Non-text Contrast, 3:1 min).
- **#8** — `.feat-ticket-row .file-open` spans: no `tabindex`, `role`, or keydown handler
  (WCAG 2.1.1 Keyboard).
- **#9** — `.feat-card-body`: missing `role="region"` + `aria-labelledby` (WCAG 4.1.2
  Name, Role, Value).

---

## Acceptance criteria

### AC1 — Focus-visible on `.search` input (viewer issue #5)

**Given** `../apex-team-viewer/public/style.css` exists,
**When** the BA (statically) or QA (via test) inspects the `.search` rule,
**Then** the rule does NOT contain `outline: none` without a matching `.search:focus-visible`
rule in the same file, AND the `.search:focus-visible` rule applies:

```css
.search:focus-visible {
  outline: 2px solid #6a8cd6;
  outline-offset: 1px;
}
```

This matches the canonical `:focus-visible` pattern UX will codify in UX-0001.

---

### AC2 — Solid focus ring on `.feat-card-header` + `.badge-btn` (viewer issue #7)

**Given** `../apex-team-viewer/public/style.css` exists,
**When** the BA (statically) or QA (via test) inspects the focus-ring rules,
**Then** both `.feat-card-header:focus-visible` and `.badge-btn:focus-visible` use a
solid (not alpha) outline of `#6a8cd6`, AND the contrast of `#6a8cd6` against the
background `#131318` is verified ≥3:1 (WCAG 1.4.11).

Prior state (alpha):

```css
/* BEFORE — fails WCAG 1.4.11, ~1.8:1 */
.feat-card-header:focus-visible { outline: 2px solid #6a8cd640; }
.badge-btn:focus-visible        { outline: 2px solid #6a8cd640; }
```

Required state (solid):

```css
/* AFTER — passes WCAG 1.4.11, ≥3:1 */
.feat-card-header:focus-visible { outline: 2px solid #6a8cd6; }
.badge-btn:focus-visible        { outline: 2px solid #6a8cd6; }
```

---

### AC3 — Keyboard accessibility on `.file-open` spans (viewer issue #8)

**Given** `../apex-team-viewer/public/app.js` exists,
**When** the BA (statically) or QA (via test) inspects every location where a `.file-open`
span is rendered (FEAT card rows, Tickets-tab rows, ungrouped rows),
**Then** each `.file-open` span element is created with ALL of the following:

- `tabindex="0"` — makes the span reachable via Tab key.
- `role="button"` — communicates interactive semantics to assistive technology.
- A `keydown` event handler that calls `openFile(path)` when the user presses `Enter`
  or `Space` (key values `"Enter"` and `" "` respectively).
- The existing `click` event handler that calls `openFile(path)` is PRESERVED (not
  replaced).

Keyboard activation pattern (illustrative):

```js
span.setAttribute('tabindex', '0');
span.setAttribute('role', 'button');
span.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openFile(path);
  }
});
```

---

### AC4 — Landmark regions on `.feat-card-body` (viewer issue #9)

**Given** `../apex-team-viewer/public/app.js` exists,
**When** the BA (statically) or QA (via test) inspects every location where a
`.feat-card-body` element is rendered,
**Then**:

- Every `.feat-card-body` element has `role="region"`.
- Every `.feat-card-body` element has `aria-labelledby="feat-header-${feat.feat}"` where
  `feat.feat` is the FEAT identifier string (e.g. `"FEAT-0004"`).
- The corresponding `.feat-card-header` element for the same card has
  `id="feat-header-${feat.feat}"` set so the `aria-labelledby` reference resolves.

---

### AC5 — Regression: no bare `outline: none` in `public/style.css`

**Given** `../apex-team-viewer/public/style.css` exists,
**When** QA statically parses the file,
**Then** every occurrence of `outline: none` or `outline: 0` in the file is accompanied
by a corresponding `:focus-visible` rule in the same selector context.

This is a file-wide sweep, not limited to `.search`. Any bare `outline: none` without a
paired `:focus-visible` override is a test failure.

---

### AC6 — QA static-parse conformance test (TEST-0004)

**Given** the apex-team-viewer sibling repo is present at `../apex-team-viewer/`,
**When** QA authors and runs the Wave 125 test,
**Then** a test file exists at:

```
tests/qa/features/FEAT-0004-viewer-a11y-polish/TEST-0004-viewer-a11y-polish.test.ts
```

The test uses the same static-parse pattern established in Wave 123 TEST-0003
(reading `../apex-team-viewer/public/{style.css,app.js}` as strings and asserting
patterns with `expect(...).toMatch` / `expect(...).not.toMatch`).

The test is runtime-gated on `existsSync('../apex-team-viewer/public/style.css')` — if
the sibling repo is absent, the test is skipped (not failed), matching Wave 123 practice.

The test file carries mandatory FEAT-XXXX frontmatter:

```ts
// ticket: TEST-0004
// parent_feat: FEAT-0004
// parent_us: US-101
// role: qa
// status: in-flight
```

---

## Out of scope

- WCAG gaps not enumerated in issues #5/#7/#8/#9 (file new issues for those).
- Server-side viewer changes (`server.mjs`).
- Any other apex-team-viewer files beyond `public/style.css` and `public/app.js`.
- Automated browser/axe-core test run (static-parse pattern from Wave 123 is sufficient
  for this wave; full browser automation is a separate proposal).
- Changes to apex-team repo source code (beyond this requirements + QA test layer).

---

## Implementation notes (for UI Dev)

- Both `public/style.css` and `public/app.js` live in sibling repo
  `../apex-team-viewer/` (not in apex-team itself).
- The viewer PR should reference `US-101` in its PR body.
- Cross-repo PR pattern mirrors Wave 123: one apex-team PR (this US + FEAT-0004 +
  UX-0001 + ARCH-0001 + TEST-0004 + HANDOFF updates) + one viewer PR (`public/` edits).

---

## Linked artifacts

| Artifact | Location |
|---|---|
| FEAT-0004 | `requirements/features/FEAT-0004-viewer-a11y-polish.md` |
| ARCH-0001 | `architecture/features/FEAT-0004-viewer-a11y-polish/ARCH-0001-viewer-a11y-polish.md` |
| UX-0001 | `design/features/FEAT-0004-viewer-a11y-polish/UX-0001-viewer-a11y-polish.md` |
| TEST-0004 | `tests/qa/features/FEAT-0004-viewer-a11y-polish/TEST-0004-viewer-a11y-polish.test.ts` |
| viewer style.css | `../apex-team-viewer/public/style.css` |
| viewer app.js | `../apex-team-viewer/public/app.js` |
