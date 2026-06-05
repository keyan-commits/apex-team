---
ticket: BE-0001
parent_feat: TBD
parent_us: US-095
wave: 119
role: backend-developer
status: retro
---

# BE-0001 — Viewer workspace switcher API (Wave 119 Retro)

**Wave:** 119
**Viewer PR:** keyan-commits/apex-team-viewer#3 (merged)
**Viewer commit:** 467e9a7a889053f3571ad05e33b29f82ba0c1960

## Scope

Initial workspace switcher back-end: multi-workspace registry, two new HTTP API
routes, and a full rewrite of `activeRoot` threading so every server-side read
and `gh` call uses the live workspace rather than a startup-time constant.

Key deliverables:
- `GET /api/workspaces` — returns the registry (depth-1 sibling scan +
  `APEX_TEAM_WORKSPACES` env override) with an `isCurrent` flag on each entry.
- `POST /api/workspace/switch` — mutates the in-memory `activeRoot`; rejects
  paths not in the registry with 400.
- Startup resolution chain: `APEX_TEAM_ROOT` env → cwd → hardcoded fallback,
  logged to stdout.
- `/api/tickets` and `/api/now` emit warning (not 500) when the active
  workspace lacks `requirements/user-stories/` or `HANDOFF.md`.
- Label cache invalidated on workspace switch.

## Files touched (sibling viewer repo)

- `server.mjs` — +206 lines: registry builder, `/api/workspaces`, `/api/workspace/switch`,
  `activeRoot` threading across all existing routes, graceful-fallback guards

## apex-team-side artifacts

- This summary doc
- Wave-119 HANDOFF block in `coordination/handoffs/ui-developer.md` (historical —
  UI Dev was the routed role for this wave)

## Notes

- Retro backfill — this BE-0001 doc was authored after the fact during Wave 137 to
  close the BE Dev artifact gap surfaced by the user during a viewer review. The
  actual implementation happened in the viewer repo under UI Dev's authorship; this
  doc retroactively credits the backend-shaped work.
- Pre-convention wave: Wave 119 predates the FEAT-XXXX grouping standard (Wave 122).
  `parent_feat` is TBD pending BA reconciliation.
