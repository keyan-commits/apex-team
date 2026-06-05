---
ticket: BE-0008
parent_feat: TBD
parent_us: TBD
wave: 135
role: backend-developer
status: retro
---

# BE-0008 — Cache-Control: no-cache on static asset responses (Wave 135 Retro)

**Wave:** 135
**Viewer PR:** keyan-commits/apex-team-viewer#21 (merged)
**Viewer commit:** 0127d918c2610ff13df7367080788d156b95c875

## Scope

Server-side HTTP header fix: the viewer's static asset handler (serving
`public/app.js`, `public/style.css`, `public/index.html`) omitted
`Cache-Control` headers, causing browsers to aggressively cache stale JS/CSS
after a viewer update. This wave adds `Cache-Control: no-cache` to static asset
responses so the browser revalidates on each load.

This is a pure backend / HTTP-layer change — no client code changed.

Key deliverables:
- `Cache-Control: no-cache` header set on all static file responses served
  from `server.mjs`'s `public/` handler.

## Files touched (sibling viewer repo)

- `server.mjs` — net +4 lines: `res.setHeader('Cache-Control', 'no-cache')` in
  the static-file response path

## apex-team-side artifacts

- This summary doc
- Wave-135 HANDOFF block in `coordination/handoffs/ui-developer.md` (historical —
  UI Dev was the routed role for this wave)

## Notes

- Retro backfill — this BE-0008 doc was authored after the fact during Wave 137 to
  close the BE Dev artifact gap surfaced by the user during a viewer review. The
  actual implementation happened in the viewer repo under UI Dev's authorship; this
  doc retroactively credits the backend-shaped work.
- Placed under FEAT-tbd-viewer-polyglot-runner by proximity (Wave 135 co-shipped
  with runner work); BA may reassign to a housekeeping FEAT if preferred.
