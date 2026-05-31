# US-009 — Per-agent profile page

**Status:** proposed
**Owner role:** ui-developer, backend-developer
**Created:** 2026-05-31
**Story ID:** US-009

---

## Narrative

As a user, I want to navigate to a dedicated profile page for any agent on my team, so that I can understand that agent's identity, skills provenance, and the improvements proposed for it — all in one place without digging through source files.

## Acceptance Criteria

- **AC1:** Given the apex-team UI, when I click a role name in an AgentPane on `/` OR a role badge in the CONTEXT panel on `/dashboard`, then I navigate to `/agents/[role]` (e.g. `/agents/business-analyst`). All 8 role IDs are valid routes; an unknown role ID shows a 404.

- **AC2:** Given the profile page, when it loads, then the header card shows: role display name, accent colour swatch, current model name, and a 1–2 sentence summary of the agent's purpose (derived from the first paragraph of the system prompt in `src/lib/roles.ts`).

- **AC3:** Given the profile page, when the "Skills" section loads, then each skill section from the role's `src/lib/skills/<role>.ts` file is rendered as a collapsible panel (collapsed by default, click to expand) with role-coloured headings. All content is Markdown-rendered.

- **AC4:** Given each skill panel, when the panel header is shown, then it displays a provenance badge: `claude` (written by Claude Code), `user` (written by the workspace owner), or `external` (sourced externally — badge links to source URL). Provenance is stored in a sibling metadata file `src/lib/skills/<role>.skills.json` (one entry per section slug). If no entry exists for a section, badge defaults to `claude`. _(See OQ-008 for the choice of metadata format vs. git blame.)_

- **AC5:** Given the profile page, when the "Improvements" section is shown, then it contains: a read-only list of open GitHub issues labelled `skill-proposal` + the role's ID, fetched from the same `/api/issues` endpoint used by the Issues panel (filtered by role label). Below the list, a textarea + "File issue" button. Submitting the form POSTs to `/api/file-improvement-issue` with `{ role, title, body }`, which runs `gh issue create --label skill-proposal --label <role> --title <title> --body <body>` server-side and returns the new issue URL on success. Error state shows an inline error message with the raw `gh` output.

- **AC6:** Given the page layout, when rendered at 1280×800 or wider, then the header card occupies the top 1 screen of vertical space; Skills and Improvements sections below are accessible by scrolling. The page uses the existing global colour tokens and typography scale — no new design system primitives required.

## Out of Scope

- Real-time streaming of the agent's current turn output (that's the AgentPane on `/`).
- Editing the system prompt or skills file from the UI (read-only view in this story).
- Nested skill section provenance (per-bullet granularity) — section-level provenance is sufficient.
- Bulk "file all improvement suggestions" flow.

## Open Questions

- **OQ-008** — Provenance metadata format: `*.skills.json` sibling vs. front-matter in the `.ts` file vs. git blame fallback? (Owner: Architect) — see `requirements/open-questions.md`.

## Design Spec

- TBD — UX Designer to create `design/US-009-agent-profile.md` before implementation begins.

## Links

_(Filled in during and after implementation)_

- impl: _(pending)_
- test: _(pending)_
- design-pass-by: _(pending)_
- qa-pass-by: _(pending)_
- deployed-by: _(pending)_
