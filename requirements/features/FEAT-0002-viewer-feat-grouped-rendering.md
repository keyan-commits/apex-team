---
feat: FEAT-0002
title: "Viewer FEAT-Grouped Rendering"
status: active
created: 2026-06-04
wave: 123
related-us: US-099
related-adr: "(pending — Architect to assess if NFR impact exists)"
related-design: "(none — viewer HTML/CSS change; UX Designer to confirm no UX gate needed or author UX-XXXX)"
related-tests: "tests/qa/features/FEAT-0002-viewer-feat-grouped-rendering/ (pending Wave 123 QA dispatch)"
related-ops: "(none — viewer is a read-only dashboard; no deployment pipeline needed)"
---

# FEAT-0002 — Viewer FEAT-Grouped Rendering

This feature makes the apex-team-viewer's per-role Output tabs render FEAT-grouped cards
instead of a flat file list. It is the viewer-side implementation of the FEAT-XXXX
grouping convention defined in FEAT-0001 / US-098.

---

## What this feature is

When a user opens the apex-team-viewer and clicks a role's Output tab, they currently
see a flat chronological list of files. This feature replaces that flat list with:

- One collapsible card per FEAT, showing that role's tickets linked to the FEAT.
- A "Legacy / Unsorted" section below for files that carry no `parent_feat:` frontmatter.
- Status pills, mtime, size, and file-content drawer links on each ticket row.
- A search input that filters across FEAT title, slug, ticket ID, and path.

An additional rendering hook on the DevSecOps Output tab surfaces `ops/pipelines/` reusable
templates as a top section above FEAT cards (data provided by US-100 / FEAT-0003).

---

## Motivation (from user directive, Wave 122 follow-up)

> "A link should be shown in the BA Output (instead of the files as shown). Then the QA
> will do the same... it should display all the tests in the QA Output... The Devs (FE, BE)
> should have their own output directories as well, it should also follow the same organization
> as the BA did in their respective output folders, same with the Architect, and UX."

The flat file list gave no indication of which feature a file belonged to. Feature-grouped
cards make the relationship between artifacts and features immediately visible.

---

## Driving user story

[US-099 — Viewer FEAT-Grouped Rendering Across Role Output Tabs](../user-stories/US-099-viewer-feat-grouped-rendering.md)

See US-099 for the full acceptance criteria. This FEAT doc is the feature parent;
US-099 is the child story specifying what "done" looks like.

---

## Scope of FEAT-0002

FEAT-0002 covers the viewer rendering changes only:

- `/api/artifacts?role=<r>` API extension to return `features` + `ungrouped` (AC1–AC2)
- Viewer Output tab card rendering, collapsible UI, status pills, drawer links (AC3–AC5)
- FE Dev + BE Dev tab addition if not already present (AC6)
- Search filter across FEAT/ticket/path (AC7)
- Regression tests at `tests/qa/features/FEAT-0002-viewer-feat-grouped-rendering/` (AC8)
- DevSecOps pipeline templates rendering hook (AC9 — rendering side only; templates are US-100)

Does NOT cover:
- Actual pipeline templates (`ops/pipelines/*.sh`) — FEAT-0003 / US-100
- Tickets tab redesign — separate wave
- Legacy file migration into FEAT groupings — separate housekeeping wave

---

## Per-role artifact directories

| Role | Path | Ticket | Status |
|---|---|---|---|
| BA | `requirements/features/FEAT-0002-viewer-feat-grouped-rendering.md` (this file) | FEAT-0002 | Active |
| Architect | `architecture/features/FEAT-0002-viewer-feat-grouped-rendering/ARCH-XXXX-*.md` | ARCH-XXXX | Pending — Architect to assess NFR impact |
| UX | `design/features/FEAT-0002-viewer-feat-grouped-rendering/UX-XXXX-*.md` | UX-XXXX | Pending — UX to confirm no gate needed |
| QA | `tests/qa/features/FEAT-0002-viewer-feat-grouped-rendering/TEST-XXXX-*.test.ts` | TEST-XXXX | Pending — Wave 123 QA dispatch |
| FE Dev | `src/features/` (apex-team-viewer's `public/` — viewer-specific) | FE-XXXX | Pending — Wave 123 UI Dev dispatch |
| BE Dev | N/A (viewer has no separate BE layer — `server.mjs` is owned by UI Dev for this wave) | — | — |
| DevSecOps | N/A (viewer dashboard; no deployment pipeline) | — | — |

---

## Acceptance criteria summary

See US-099 for the full testable ACs. Feature-level tracking:

- [ ] AC1: `/api/artifacts` returns `features` + `ungrouped` shape (UI Dev — server.mjs)
- [ ] AC2: Server parses `parent_feat:` / `feat:` / `status:` frontmatter; fail-soft on malformed (UI Dev — server.mjs)
- [ ] AC3: Output tab renders collapsible FEAT cards + Legacy/Unsorted section (UI Dev — app.js + index.html)
- [ ] AC4: Ticket links open Wave 119 file-content drawer (UI Dev — app.js)
- [ ] AC5: FEAT order: ID descending; ticket order: ID descending; status pill CSS reuse (UI Dev — app.js + style.css)
- [ ] AC6: All 5 existing Output tabs updated; FE Dev + BE Dev tabs added if absent (UI Dev — index.html)
- [ ] AC7: Search filter across FEAT title + slug + ticket + path (UI Dev — app.js)
- [ ] AC8: Regression tests — happy / empty / malformed-frontmatter / BA-feat-field / multi-FEAT / search-filter (QA)
- [ ] AC9: DevSecOps tab: "Reusable Pipeline Templates" top section from `ops/pipelines/` (UI Dev — app.js; data from US-100)

---

## Status history

| Date | Wave | Status | Note |
|---|---|---|---|
| 2026-06-04 | 123 | draft → active | BA authored US-099 + this FEAT seed file. Requirements phase complete. Wave 123 implementation dispatched to UI Dev (viewer rendering) + QA (regression tests). |
