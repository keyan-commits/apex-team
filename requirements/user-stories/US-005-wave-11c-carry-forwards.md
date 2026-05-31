# US-005 — Issues panel polish: attribution prefix, per-status copy, visited style, no-flicker

**Status:** done
**Owner role:** ui-developer (AC1, AC3, AC4) + backend-developer (AC2 — `repoStatus` enum)
**Created:** 2026-05-31
**Story ID:** US-005

---

## Narrative

As a user of the dashboard Issues panel, I want the attribution label and empty states to be visually clean and contextually accurate, so that I understand at a glance which repo is active and why issues aren't shown when they're not.

## Background

Four UX findings from the Wave 11c gate (UX Designer review of US-003 implementation) were non-blocking but are worth fixing as a bundle:

1. **(warn)** Attribution reads "Issues: keyan-commits/apex-team" — "Issues:" is redundant with the panel heading "ISSUES" above it.
2. **(warn)** Empty-state copy "This workspace has no GitHub remote — Issues panel unavailable" conflates four distinct null-repo causes, making it inaccurate for non-GitHub remotes, bad paths, and non-git workspaces.
3. **(nit)** `.issue-repo-link:visited` — browser UA purple overrides the monospace `var(--text-dim)` style after the first click.
4. **(nit)** Stale-attribution flicker — during workspace change, the old repo name briefly shows for ~100ms while the new fetch is in flight.

References: US-003 (parent story), Wave 11c UX HANDOFF, `design/US-003-workspace-scoped-issues.md`.

## Acceptance Criteria

- **AC1 — Drop redundant attribution prefix:** Given a workspace with a valid GitHub remote (`repoStatus === "ok"`), when the Issues panel renders the attribution line, then the label shows only the repo name/link (e.g. `keyan-commits/apex-team`) **without** a "Issues:" prefix — the panel heading "ISSUES" already provides that context. The exact format is defined in `design/US-003-workspace-scoped-issues.md` (UX Designer to finalize this wave).

- **AC2 — Per-`repoStatus` empty-state copy:** Given a workspace where `repoStatus` is one of `none`, `not-git`, `non-github`, or `bad-path`, when the dashboard polls `/api/team-status`, then the Issues panel shows the status-specific copy matching that exact cause:
  - `none` — no `origin` remote in a valid git repo
  - `not-git` — path exists but is not a git repo
  - `non-github` — has an origin remote but it's not a GitHub URL
  - `bad-path` — path doesn't exist or is unreadable
  The copy for each state is non-blaming and factually accurate to the condition. Exact strings finalized by UX Designer spec this wave.

- **AC3 — Visited link color preserved:** Given the user has previously clicked the attribution repo link, when they return to the dashboard, then the link color is `var(--text-dim)` — matching the unvisited style — rather than the browser UA purple default.

- **AC4 — No stale-attribution flicker on workspace change:** Given the user changes the workspace field, when the new `/api/team-status` fetch is in flight, then the Issues panel shows a loading or blank state (not the previous workspace's repo name) until the new response arrives.

## Out of Scope

- OQ-003 (manual repo override) — explicitly deferred by user. Not MVP.
- Changing the attribution link target or opening behavior — stays `https://github.com/{repo}/issues` in new tab.
- Any Issues panel changes beyond the 4 items above — no new features in this story.

## Open Questions

None blocking. OQ-003 explicitly deferred.

## Design Spec

UX Designer to update `design/US-003-workspace-scoped-issues.md` this wave with:
- Final attribution format for AC1 (no "Issues:" prefix — exact wording TBD by UX)
- Per-`repoStatus` copy strings for AC2 (one sentence per state, non-blaming)
- `:visited` CSS fix spec for AC3
- Flicker-fix UX spec for AC4 (null out `data` on workspace change → loading state)

## Links

- impl-be: `35533b0` — `RepoStatus` type + `RepoInfo` return + `deriveGithubRepo` rewrite + `_noIssues`/`fetchIssues`/GET handler updates + 9 test cases
- impl-ui: `e73bfa7` — drop attribution prefix + per-`repoStatus` copy switch + `:visited` fix + `setData(null)` flicker fix
- design-pass-by: Wave 13c — UX Designer PASS (all 4 amendments verified against `design/US-003-workspace-scoped-issues.md`)
- qa-pass-by: Wave 13d — QA PASS (all 4 ACs: AC1 grep, AC2 live API on :3100, AC3 grep, AC4 code inspection; 26/26 tests green)
- deployed-by: _(pending — Wave 13e merge)_
