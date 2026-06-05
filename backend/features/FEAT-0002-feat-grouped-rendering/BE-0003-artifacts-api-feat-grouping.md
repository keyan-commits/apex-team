---
ticket: BE-0003
parent_feat: FEAT-0002
parent_us: US-099
wave: 123
role: backend-developer
status: retro
---

# BE-0003 — Artifacts API FEAT-grouped response shape (Wave 123 Retro)

**Wave:** 123
**Viewer PR:** keyan-commits/apex-team-viewer#6 (merged)
**Viewer commit:** 28b76aa226ae00bca3c16aac236ff7275ab50560

## Scope

Extended `/api/artifacts` to return a FEAT-grouped response shape alongside the
existing flat list. The server now parses frontmatter from each artifact file
(fail-soft — a parse error yields `{}` rather than a 500), looks up the FEAT
title from `requirements/features/`, and returns:

```json
{
  "features": [
    { "feat": "FEAT-0002", "title": "...", "tickets": [...] }
  ],
  "ungrouped": [...]
}
```

Also added `ROLE_PATHS` entries for the FE Dev and BE Dev tabs so both Output
tabs now populate, and a `pipelines[]` field from `ops/pipelines/` for the
DevSecOps tab.

Key deliverables:
- Fail-soft frontmatter parser (handles YAML-like `key: value` lines in
  file-type-appropriate comment blocks).
- FEAT title lookup from `requirements/features/` directory.
- `features[]` + `ungrouped[]` response shape on `/api/artifacts`.
- `ROLE_PATHS` additions: `frontend-developer`, `backend-developer`.
- `pipelines[]` field: reads `ops/pipelines/` for DevSecOps tab.

## Files touched (sibling viewer repo)

- `server.mjs` — +218 lines: frontmatter parser, FEAT-grouping logic, FEAT
  title resolver, extended ROLE_PATHS, `pipelines[]` field

## apex-team-side artifacts

- This summary doc
- `requirements/user-stories/US-099-*.md` (BA-owned)
- `tests/qa/features/FEAT-0002-viewer-feat-grouped-rendering/` (QA-owned)
- Wave-123 HANDOFF block in `coordination/handoffs/ui-developer.md` (historical —
  UI Dev was the routed role for this wave)

## Notes

- Retro backfill — this BE-0003 doc was authored after the fact during Wave 137 to
  close the BE Dev artifact gap surfaced by the user during a viewer review. The
  actual implementation happened in the viewer repo under UI Dev's authorship; this
  doc retroactively credits the backend-shaped work.
- This wave is the first within the FEAT-0002 grouping; the API shape defined here
  is the contract that the FE-0003 client-side rendering (FE-0003, Wave 123)
  consumes.
