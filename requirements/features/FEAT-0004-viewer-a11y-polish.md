---
ticket: FEAT-0004
parent_feat: FEAT-0004
parent_us: US-101
role: business-analyst
status: active
feat: FEAT-0004
title: "Viewer A11y Polish"
created: 2026-06-04
wave: 125
related-us: US-101
related-adr: "ARCH-0001 (Architect ratification — see architecture/features/FEAT-0004-viewer-a11y-polish/ARCH-0001-viewer-a11y-polish.md)"
related-design: "UX-0001 (see design/features/FEAT-0004-viewer-a11y-polish/UX-0001-viewer-a11y-polish.md)"
related-tests: "tests/qa/features/FEAT-0004-viewer-a11y-polish/TEST-0004-viewer-a11y-polish.test.ts"
related-ops: "(none — viewer is a read-only dashboard; no deployment pipeline needed)"
---

# FEAT-0004 — Viewer A11y Polish

This feature closes four WCAG conformance gaps surfaced as non-blocking warns during the
Wave 123 UX gate of FEAT-0002 (Viewer FEAT-Grouped Rendering). All four issues are
targeted at the sibling `keyan-commits/apex-team-viewer` repo (`public/style.css` and
`public/app.js`).

---

## What this feature is

The Wave 123 UX gate raised four viewer-side accessibility issues against the viewer's
new FEAT-grouped card UI:

- **Issue #5** — `.search` input: `outline: none` present with no `:focus-visible`
  replacement (violates WCAG 2.4.11 Focus Appearance).
- **Issue #7** — `.feat-card-header` + `.badge-btn` focus rings use 25%-alpha colour
  (`#6a8cd640`) yielding ~1.8:1 contrast against the `#131318` background — below the
  WCAG 1.4.11 non-text contrast minimum of 3:1.
- **Issue #8** — `.feat-ticket-row .file-open` spans are click-interactive but lack
  `tabindex="0"`, `role="button"`, and a keydown handler. Keyboard-only users cannot
  activate them (violates WCAG 2.1.1 Keyboard).
- **Issue #9** — `.feat-card-body` regions lack `role="region"` and `aria-labelledby`,
  breaking landmark navigation for screen-reader users (violates WCAG 4.1.2 Name, Role,
  Value).

All four issues are single-file or two-file edits; bundling them into one focused wave
beats four micro-waves in review overhead.

---

## Driving user story

[US-101 — Viewer A11y Polish](../user-stories/US-101-viewer-a11y-polish.md)

See US-101 for the full acceptance criteria. This FEAT doc is the feature parent;
US-101 is the child story specifying what "done" looks like.

---

## Scope of FEAT-0004

FEAT-0004 covers:

- `public/style.css` — `:focus-visible` replacement for `.search` (issue #5) and solid
  focus rings for `.feat-card-header` + `.badge-btn` (issue #7).
- `public/app.js` — `tabindex`, `role="button"`, and keydown handler on every
  `.file-open` span (issue #8); `role="region"` + `aria-labelledby` on every
  `.feat-card-body` (issue #9).
- Regression sweep: every `outline: none` in `public/style.css` must have a paired
  `:focus-visible` replacement (AC5).

Out of scope:

- Other WCAG gaps not enumerated in issues #5/#7/#8/#9.
- Viewer server-side changes.
- Any apex-team repo source other than apex-team's own BA/QA/spec artifacts.

---

## Per-role artifact links

| Role | Ticket | Path | Status |
|---|---|---|---|
| BA | FEAT-0004 (this file) + US-101 | `requirements/features/FEAT-0004-viewer-a11y-polish.md` + `requirements/user-stories/US-101-viewer-a11y-polish.md` | active |
| Architect | ARCH-0001 | `architecture/features/FEAT-0004-viewer-a11y-polish/ARCH-0001-viewer-a11y-polish.md` | pending — Wave 125 triad |
| UX Designer | UX-0001 | `design/features/FEAT-0004-viewer-a11y-polish/UX-0001-viewer-a11y-polish.md` | pending — Wave 125 triad |
| QA | TEST-0004 | `tests/qa/features/FEAT-0004-viewer-a11y-polish/TEST-0004-viewer-a11y-polish.test.ts` | pending — Wave 125 Lane 2 |
| UI Dev | (no FE-XXXX — code in sibling viewer repo) | `../apex-team-viewer/public/style.css` + `../apex-team-viewer/public/app.js` | pending — Wave 125 Lane 2 |
| DevSecOps | (no OPS-XXXX — no pipeline change) | — | not applicable |

---

## Acceptance criteria summary

See US-101 for full testable ACs. Feature-level tracking:

- [ ] AC1 — `.search` `:focus-visible` replacement (issue #5)
- [ ] AC2 — `.feat-card-header` + `.badge-btn` solid focus ring ≥3:1 contrast (issue #7)
- [ ] AC3 — `.file-open` spans keyboard-accessible (issue #8)
- [ ] AC4 — `.feat-card-body` landmark regions (issue #9)
- [ ] AC5 — regression: every `outline: none` has a `:focus-visible` pair
- [ ] AC6 — QA static-parse test (TEST-0004) green

---

## Status history

| Date | Wave | Status | Note |
|---|---|---|---|
| 2026-06-04 | 125 | draft → active | BA authored FEAT-0004 + US-101. Wave 125 requirements phase (triad) complete. Implementation dispatched to UI Dev (viewer `public/` edits) + QA (TEST-0004). Bundling 4 viewer a11y issues (#5/#7/#8/#9) from Wave 123 UX gate warns. |
