# US-010 — Manual Daily Scout trigger

**Status:** superseded
**Owner role:** ui-developer, backend-developer
**Created:** 2026-05-31
**Superseded:** 2026-06-04
**Story ID:** US-010

## Resolution — superseded by Plan C cutover

All ACs target `/dashboard`, `/api/scout/trigger`, `scripts/skill-scout.mjs`, and `talk_to_product_owner` MCP call — all monolith surfaces retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). Daily scout functionality in the subagent runtime runs within a Claude Code session, not via a dashboard button. Re-file as a viewer-repo or CLI feature if needed.

---

## Narrative

As a user, I want a "Run now" button on the Daily Scout panel, so that I can trigger a skill-proposal scan on demand without waiting for the next scheduled run.

## Acceptance Criteria

- **AC1:** Given the Daily Scout panel on `/dashboard`, when the scout is not currently running, then a "Run now" button is visible. The button is absent (or disabled) while the scout is running.

- **AC2:** Given the user clicks "Run now", when the POST to `/api/scout/trigger` succeeds, then the server responds `202 Accepted` immediately without blocking. The trigger dispatches the scout flow asynchronously (PO posts a scout wave via `talk_to_product_owner`, or a backend script runs the per-role scout). _(See OQ-009 for dispatch mechanism choice.)_

- **AC3:** Given the scout is running, when the panel is displayed, then the "Run now" button is replaced by a "Running…" label with a spinner. The panel polls `/api/scout/status` (or the existing team-status endpoint) every 5s. When the scout finishes, the spinner disappears and the button reappears.

- **AC4:** Given the scout completes, when the panel refreshes, then `Last run` timestamp and `Proposals filed` count update to reflect the completed run. Any new issues filed during the run appear in the Issues panel within 10s (next poll cycle).

- **AC5:** Given the trigger API, when `gh` is not authenticated or the repo cannot be resolved, then the API returns a `400` or `500` with an actionable error message (e.g. "gh auth required"). The panel shows the error inline and re-enables the button.

## Out of Scope

- Scheduled / cron-based auto-trigger (that path already exists — this story covers the manual trigger only).
- Per-role individual scout trigger (all roles or nothing in this story).
- Scout output streaming to the panel in real time (the Issues panel surfaces results; live streaming is a future enhancement).

## Open Questions

- **OQ-009** — Scout trigger dispatch mechanism: should `/api/scout/trigger` call `talk_to_product_owner` (full PO wave) or call a lighter `run-scout.mjs` backend script directly? (Owner: BE Dev) — see `requirements/open-questions.md`.

## Design Spec

- TBD — UX Designer to create `design/US-010-scout-trigger.md` if the panel layout changes materially.

## Links

_(Filled in during and after implementation)_

- impl: _(pending)_
- test: _(pending)_
- design-pass-by: _(pending)_
- qa-pass-by: _(pending)_
- deployed-by: _(pending)_
