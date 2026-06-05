---
ticket: BE-0009
parent_feat: TBD
parent_us: TBD
wave: 136
role: backend-developer
status: retro
---

# BE-0009 — Playwright headed-mode toggle via ?headed=1 query param (Wave 136 Retro)

**Wave:** 136
**Viewer PR:** keyan-commits/apex-team-viewer#22 (merged)
**Viewer commit:** a3281ec7d578a066404492febe4e55e71fb6c915

## Scope

Extended the `/api/run-test` SSE endpoint to accept a `?headed=1` query
parameter. When the parameter is present and the resolved runner is
`playwright`, the server injects `--headed` into the spawned command's
argument array before exec. All other runners and all calls without the
parameter are unaffected — the flag is a no-op outside the Playwright
resolution branch.

This is a server-side argument-injection feature: the decision of whether to
pass `--headed` is made on the server based on the URL query, not as a client
passthrough of raw flags, which preserves the server's control over the full
command shape.

Key deliverables:
- `?headed=1` query parameter parsed in `/api/run-test` route handler.
- `--headed` injected into Playwright spawn args when `headed=1` and runner is
  `playwright`.
- No change to the SSE frame protocol — caller observes the same structured
  `{ type, data }` frames.

## Files touched (sibling viewer repo)

- `server.mjs` — net +12 lines: `headed` query-param check, conditional
  `--headed` arg injection for Playwright runner branch

## apex-team-side artifacts

- This summary doc
- Wave-136 HANDOFF block in `coordination/handoffs/ui-developer.md` (historical —
  UI Dev was the routed role for this wave)

## Notes

- Retro backfill — this BE-0009 doc was authored after the fact during Wave 137 to
  close the BE Dev artifact gap surfaced by the user during a viewer review. The
  actual implementation happened in the viewer repo under UI Dev's authorship; this
  doc retroactively credits the backend-shaped work.
- Groups with BE-0005/BE-0006 under FEAT-tbd-viewer-polyglot-runner as an
  extension to the Playwright runner path introduced in Wave 130.
