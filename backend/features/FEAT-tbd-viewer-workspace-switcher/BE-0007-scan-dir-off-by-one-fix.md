---
ticket: BE-0007
parent_feat: TBD
parent_us: TBD
wave: 133
role: backend-developer
status: retro
---

# BE-0007 — Scan-dir off-by-one fix (Wave 133 Retro)

**Wave:** 133
**Viewer PR:** keyan-commits/apex-team-viewer#19 (merged)
**Viewer commit:** 50adba02a6b7257501d0292898c574e8812911be

## Scope

Bugfix: the depth-1 sibling workspace scanner used `__dirname` (the directory
containing `server.mjs`) as the scan root rather than its parent, causing the
scan to find only files co-located with `server.mjs` instead of sibling
repositories. The fix changes the scan root to `path.dirname(__dirname)` (one
level up), which is the correct behavior: sibling repos of `apex-team-viewer/`
are now discoverable.

Impact: without this fix, `GET /api/workspaces` always returned only the viewer
itself as a discovered workspace, making the workspace switcher (BE-0001)
effectively non-functional for multi-workspace setups.

## Files touched (sibling viewer repo)

- `server.mjs` — net +7/-2 lines: scan-root corrected from `__dirname` to
  `path.dirname(__dirname)` with inline comment explaining SELF vs. parent

## apex-team-side artifacts

- This summary doc
- Wave-133 HANDOFF block in `coordination/handoffs/ui-developer.md` (historical —
  UI Dev was the routed role for this wave)

## Notes

- Retro backfill — this BE-0007 doc was authored after the fact during Wave 137 to
  close the BE Dev artifact gap surfaced by the user during a viewer review. The
  actual implementation happened in the viewer repo under UI Dev's authorship; this
  doc retroactively credits the backend-shaped work.
- Groups under FEAT-tbd-viewer-workspace-switcher as a bugfix on the scanner
  first introduced in Wave 119 (BE-0001).
