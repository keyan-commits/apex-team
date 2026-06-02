## Done
- **#208** (ADR-015): no Redis/MQ decision written, status **Accepted**, with 4-condition tripwire and drafted no-broker CI fitness function. `architecture/INDEX.md` updated. Closes #208. MERGED as #235.
- **#200** (NODE_ENV pin): `build` script now `NODE_ENV=development next build` (package.json). Hardens ADR-010 prerender fix. Verified: inline pin overrides ambient env, no silent regress risk. MERGED as #238.
- **#201** prerender fitness function: added F2 grep step to `build-smoke` CI job, removed stale `continue-on-error: true`. PR #234 MERGED.
- **#228** (US-053 max-prompt-guard): Architect PASS → MERGED.

## In flight
- #239 (NFT over-trace suppression): Architect PASS, awaiting #238 merge to clear CI failures.
- #231 (US-054 a11y dashboard): UX re-gate pending.

## Next
- #194 (ESLint warn→error) after #239 clears.
- US-042 design (#196) blocked on OQ-BA-001 (user to clarify identity).

## Notes
- ADR-015 no-broker fitness function (dependency-graph guard) drafted, queued for DevSecOps to wire into ci.yml as follow-up.
- `architecture/INDEX.md` dead-link bug (#206) filed separately.
