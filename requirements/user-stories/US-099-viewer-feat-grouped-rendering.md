---
ticket: US-099
parent_feat: FEAT-0002
role: business-analyst
status: accepted
---

# US-099 — Viewer FEAT-Grouped Rendering Across Role Output Tabs

**Status:** accepted
**Wave:** 123
**FEAT:** FEAT-0002
**Triggered by:** User directive (screenshots, Wave 122 follow-up) — "A link should be shown in the BA Output (instead of the files as shown). Then the QA will do the same... it should display all the tests in the QA Output... The Devs (FE, BE) should have their own output directories as well, it should also follow the same organization as the BA did in their respective output folders, same with the Architect, and UX."

---

## Story

As a user viewing the apex-team-viewer's per-role Output tab for any project,
I want per-role Output tabs to render FEAT-grouped cards (one card per FEAT, listing that role's tickets allocated against it with links to each ticket file),
so that I can see at-a-glance what work each role has done per feature instead of a flat file list.

---

## Acceptance criteria

### AC1 — `/api/artifacts?role=<r>` returns FEAT-grouped output

The existing `/api/artifacts?role=<r>` endpoint is extended (non-breaking) to return:

```json
{
  "role": "ba",
  "features": [
    {
      "feat": "FEAT-0001",
      "slug": "feat-grouping-convention",
      "title": "Feature grouping convention",
      "tickets": [
        {
          "path": "requirements/features/FEAT-0001-feat-grouping-convention.md",
          "ticket": "FEAT-0001",
          "status": "active",
          "size": 7423,
          "mtime": 1717459200000
        }
      ]
    }
  ],
  "ungrouped": [
    {
      "path": "requirements/scope.md",
      "size": 1024,
      "mtime": 1717459200000
    }
  ]
}
```

`features` is ordered by FEAT ID descending (newest first). Each `features[].tickets` array is ordered by the role's own ticket ID descending. `ungrouped` contains legacy files that carry no `parent_feat:` frontmatter — they remain visible.

### AC2 — Server parses frontmatter to group files

The server reads each file in the role's artifact directories and extracts from YAML frontmatter (between `---` delimiters):
- `ticket:` — the role's own ticket identifier (e.g. `TEST-0001`, `FEAT-0001`, `ARCH-0002`)
- `parent_feat:` — the FEAT-XXXX parent (e.g. `FEAT-0001`). BA-owned FEAT files use `feat:` instead of `parent_feat:`.
- `status:` — the ticket's current status

Files with a resolvable `parent_feat:` (or `feat:` for BA) are placed in the matching `features[]` group. Files without are placed in `ungrouped`.

Fail-soft on malformed frontmatter: if parsing throws or yields no `parent_feat:`, the file is treated as ungrouped. A `console.warn` with the file path is logged — never a 500.

### AC3 — Viewer Output tab renders one collapsible card per FEAT per role

Each role's Output tab renders:

1. A `features` section at top: one collapsible card per FEAT that has at least one ticket for this role.
   - Card header: FEAT identifier + slug + title (from FEAT file if readable; fallback: slug derived from file name). Collapsed by default; click expands.
   - Expanded body: list of this role's tickets under that FEAT. Each ticket row: filename link + status pill + relative mtime + file size.

2. A `Legacy / Unsorted` section below features: plain file list (same as current rendering) for `ungrouped` files.

Status pills are color-coded reusing the existing CSS classes from the Tickets tab (`.status-done`, `.status-accepted`, etc.). No new CSS class names for status colors.

### AC4 — Ticket links open the existing file-content drawer

Clicking a ticket path link triggers the Wave 119 drawer pattern (the existing file-content drawer used in the Tickets tab). No new drawer implementation needed — reuse the existing `openDrawer(path)` call signature.

### AC5 — FEAT ordering and status color coding

- FEAT cards ordered by FEAT ID **descending** (FEAT-0009 before FEAT-0001) — newest feature first.
- Tickets within a FEAT card ordered by role-own ticket ID **descending** (TEST-0009 before TEST-0001).
- Status pills reuse the Tickets-tab CSS variables/classes exactly — zero new color rules.

### AC6 — Apply to all 5 existing role Output tabs; add FE Dev + BE Dev tabs

All existing role tabs (BA, Architect, UX, QA, DevSecOps) receive the FEAT-grouped rendering.

FE Developer (`fe`) and BE Developer (`be`) tabs are added to `#role-tabs` nav in `public/index.html` if not already present. The server adds `ROLE_PATHS['fe']` and `ROLE_PATHS['be']` pointing to `src/features/` (or `src/` as fallback for the active workspace). Both follow the same FEAT-grouped rendering.

Implementation must verify current state of `public/index.html` role-tab nav before adding tabs — if the tabs already exist, do not duplicate.

### AC7 — Search filter works across FEAT title, slug, ticket, and path

The existing per-tab search input (if present; add one per tab if absent) filters visible content in real time across:
- FEAT card title
- FEAT slug
- Individual ticket `ticket:` identifier
- Individual ticket file path

A FEAT card is hidden if none of its tickets match the filter. The `Legacy / Unsorted` section also filters by path.

### AC8 — Regression tests under `tests/qa/features/FEAT-0002-viewer-feat-grouped-rendering/`

QA must author regression tests at `tests/qa/features/FEAT-0002-viewer-feat-grouped-rendering/TEST-NNNN-*.test.ts`. Per Wave 118 comprehensive-coverage discipline, tests must cover:

- **Happy path**: API response shape contains `features` + `ungrouped` arrays; a file with valid `parent_feat: FEAT-0001` frontmatter is grouped correctly; status is extracted correctly.
- **Empty features path**: workspace with no `requirements/features/` directory returns `{ features: [], ungrouped: [...] }` without 500.
- **Malformed frontmatter path**: file with broken YAML frontmatter (e.g. unterminated `---`) lands in `ungrouped`; no exception thrown; `console.warn` called.
- **BA `feat:` field path**: BA FEAT files that use `feat: FEAT-0001` (not `parent_feat:`) are correctly grouped as that FEAT's root entry.
- **Multi-FEAT, multi-role path**: multiple FEATs, each with multiple tickets, are returned sorted newest-first (FEAT ID descending).
- **Search filter (UI)**: filtering by a FEAT slug hides cards not matching; filtering by a ticket ID shows only the matching card.

All existing `pnpm test:run` tests remain green after this wave ships.

### AC9 — DevSecOps Output tab: pipeline templates section

The DevSecOps Output tab renders a top section **above** FEAT cards: **"Reusable Pipeline Templates"**. This section lists files from `ops/pipelines/` (the env templates introduced by US-100 / Wave 124):

- Each template row: filename link + description (first non-comment line of the script) + run button (calls `pnpm run ops:run <env>` if the template is `<env>.sh`).
- If `ops/pipelines/` does not exist or is empty, the section is hidden (not an error).
- The section is static; it does not participate in FEAT grouping.

This AC provides the **viewer rendering hook** for US-100's pipeline scaffolding. The templates themselves are US-100's deliverable. This AC ships even if US-100 has not yet shipped — the section renders as empty/hidden until the data exists.

---

## Out of scope

- Wave 124's actual pipeline scaffolding (`ops/pipelines/*.sh`) — US-100 owns that.
- Tickets tab redesign (the existing Tickets tab from Wave 119 is fine as-is).
- Migrating legacy `requirements/docs/` files into FEAT groupings — separate housekeeping wave.
- Real-time file watching / auto-refresh on the Output tab (polling is acceptable; new feature if desired).
- Backend rendering / SSR for the viewer — it stays a client-side SPA.

---

## HANDOFF routing (Wave 123 auto-routing)

- **UI Developer** — owns viewer `server.mjs` + `public/index.html` + `public/app.js` + `public/style.css` changes (AC1–AC7, AC9).
- **QA** — authors regression tests under `tests/qa/features/FEAT-0002-viewer-feat-grouped-rendering/TEST-NNNN-*.test.ts` (AC8). Can run in parallel with UI Developer.

Implementation lives in the `apex-team-viewer` repo (sibling at `../apex-team-viewer/`).

---

## Traceability

- **Parent FEAT:** FEAT-0002 — Viewer FEAT-Grouped Rendering (see `requirements/features/FEAT-0002-viewer-feat-grouped-rendering.md`)
- **Spawned from:** US-098 AC9 (deferred viewer rendering)
- **Peer:** US-100 (DevSecOps pipelines — provides data for AC9's pipeline templates section)
- **Wave:** 123
- **Main SHA at authoring:** a4ce3c752aa3cd75d25030ca47ec964038aee8a3
