# US-003 — Workspace-scoped Issues panel

**Status:** proposed
**Owner role:** ui-developer (frontend) + backend-developer (API)
**Created:** 2026-05-31
**Story ID:** US-003

---

## Narrative

As a user running apex-team against any project workspace, I want the Issues panel to show issues from that workspace's GitHub repo (derived from its git origin), so that I have actionable context for the project I'm actually working on — not hardcoded apex-team issues.

## Acceptance Criteria

- **AC1:** Given workspace `/path/to/project` whose `git remote get-url origin` resolves to `https://github.com/org/repo.git` (or the SSH form `git@github.com:org/repo.git`), when the dashboard polls `/api/team-status`, then the Issues panel renders issues from `org/repo`.

- **AC2:** Given a workspace with no git remote configured, when the dashboard polls `/api/team-status`, then the Issues panel shows an empty state with a message like "No GitHub repo detected for this workspace" — it does NOT fall back to `keyan-commits/apex-team` or any other hardcoded repo.

- **AC3:** Given a workspace whose git remote is not a GitHub URL (e.g. GitLab, Bitbucket, self-hosted), when the dashboard polls `/api/team-status`, then the Issues panel shows "Non-GitHub remote — issues not available" or equivalent empty state.

- **AC4:** Given the MCP session set the workspace via `talk_to_product_owner(workspace: "/some/path")` and the browser has no cached workspace in `localStorage`, when the user opens the dashboard, then the workspace field is seeded from `/api/health`'s `defaultCwd` rather than showing the placeholder string `/absolute/path/to/project`.

- **AC5:** Given the user manually changes the workspace field in the OrchestratorBar, when they submit (press Enter) or the field loses focus, then the Issues panel refreshes to show issues for the new workspace's repo.

## Out of Scope

- Multi-remote git configurations — only the `origin` remote is consulted (first remote if no `origin` exists is out of scope for now).
- Non-GitHub issue trackers (Linear, Jira, etc.) — not in scope for this story.
- Manual override of the derived `owner/repo` — pending OQ-003 resolution.
- Caching strategy for the `git remote` lookup — pending OQ-004 resolution (default: per-request, no cache, since simplicity beats optimization at this scale).

## Open Questions

- **OQ-003:** Should the user be able to manually OVERRIDE the derived repo (e.g. type `owner/repo` directly) to handle the case where the git origin is a private mirror but issues live on a public GitHub repo? Affects AC5 wording. Owner: UX Designer + BA. Status: open.
- **OQ-004:** Should the derived `owner/repo` be computed fresh on every `/api/team-status` request (simple, ~5ms shell exec) or cached in memory/DB keyed by workspace path? Affects BE implementation scope. Owner: Architect. Status: open.

## Design Spec

- UX Designer to file spec at `<workspace>/design/US-003-workspace-scoped-issues.md` covering:
  - Auto-seed of workspace field from `defaultCwd` on page load
  - "Issues source" label placement near the Issues panel
  - Empty/error state copy for AC2 + AC3
  - AC5 interaction (debounce vs submit-on-blur vs button)

## Links

_(Filled in during and after implementation)_

- impl: `(pending)`
- test: `(pending)`
- design-pass-by: `(pending)`
- qa-pass-by: `(pending)`
- deployed-by: `(pending)`
