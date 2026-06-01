---
id: US-021
title: Issues Panel + Recent Open — Adaptive to Active Workspace
slug: issues-panel-adaptive
status: accepted
owner: BE Dev (team-status route) + UI Dev (dashboard page); Wave 66
closes: "#144"
created: 2026-06-01
last_modified: 2026-06-01
---

## Story

As the user observing the apex-team dashboard pointed at a non-apex-team workspace (e.g. `keyan-commits/lfm-b2b`), I want the Issues panel and Recent Open list to show that repo's actual open issues, so that every user request / bug / feature filed against the active workspace is visible in the dashboard regardless of which workspace I'm working on.

## Acceptance criteria

1. **Issues panel adapts to workspace.** `/api/team-status` (or the relevant endpoint) returns dynamic per-label counts based on every label actually present on open issues in the workspace repo — NOT the hardcoded apex-team labels (`self-improvement`, `skill-proposal`, `mcp-proposal`). The payload must include: `total` (all open issues), `byLabel` (array of `{name, color, count}` sorted by count descending), `unlabeled` (count of issues with no labels), and `recent` (top-10 open issues by updatedAt desc with full label data on each).

2. **Recent Open list always populates.** When `total > 0`, the Recent Open section is ALWAYS rendered — never conditionally hidden (fix the `page.tsx` conditional that currently hides it when `recent.length === 0`). Each row: issue number + title + label chips. No label-set gating.

3. **Empty-state copy.** When the workspace repo has zero open issues: display "No open issues in `<owner>/<repo>`." When `total > 0` but `recent.length === 0` (defensive): "No recently opened issues." Neither state shows silent blank space.

4. **GH label colors.** Each label chip renders using the GitHub label's hex `color` field from the issues API. Compute contrast text color (black or white) for legibility against the label background. Do NOT use apex-team's accent palette for workspace-derived labels.

5. **Per-workspace caching / refetch on workspace switch.** When the user changes the workspace field in the top bar, the Issues panel refetches against the new workspace repo. No stale apex-team data displayed when the user has switched workspaces.

6. **Acceptance test on Mac 2 lfm-b2b.** After Wave 67 (PO issue-filing, US-022) lands and the user submits a new request on Mac 2, the Recent Open list on Mac 2's dashboard (`localhost:3100`) must show that filed issue. (Wave 66 fixes the rendering; Wave 67 produces the data. This AC is the joint acceptance gate for both waves.)

7. **No regression on apex-team's own workspace.** When the workspace is `keyan-commits/apex-team`, apex-team's three triage labels still surface as chips with their counts. The dynamic byLabel rendering includes them when present.

8. **Dev-smoke gate (Wave 64 rubric).** This PR must pass `pnpm build` (build smoke) AND `pnpm dev:test` + `GET /api/health` → 200 (boot smoke) before QA issues a PASS verdict, per US-019.

## Out of scope

- Cross-workspace aggregation (showing issues from multiple repos simultaneously).
- Issue filtering / search inside the panel (covered by #139, Wave 58a).
- Drag-and-drop reordering (#114, Phase D).
- Issue creation from the dashboard panel (separate feature request).
