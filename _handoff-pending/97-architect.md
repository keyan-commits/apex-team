## Done
- **#208** (ADR-015): no Redis/MQ decision written, status **Accepted**, with 4-condition tripwire and drafted no-broker CI fitness function. `architecture/INDEX.md` updated. Closes #208. MERGED as #235.
- **#200** (NODE_ENV pin): `build` script now `NODE_ENV=development next build` (package.json). Hardens ADR-010 prerender fix. Verified: inline pin overrides ambient env, no silent regress risk. MERGED as #238.
- **#201** prerender fitness function: added F2 grep step to `build-smoke` CI job, removed stale `continue-on-error: true`. PR #234 MERGED.
- **#228** (US-053 max-prompt-guard): Architect PASS → MERGED.
- **#245** (ADR link recovery): delisted ADR-008/-011 (INDEX phantoms), recovered ADR-006/-013 (git + ADR-014 evidence), added ADR-007 (disk, missing from index). MERGED.

## In flight
- #239 (NFT over-trace suppression): Architect PASS, awaiting #238 merge to clear CI failures.
- #231 (US-054 a11y dashboard): UX re-gate pending; #245 (ADR docs) merged.
- #244 (providers.ts prefer-const): gate pending (trivial 1-line fix, tests pass).

## Next
- #244 gate → #239 merge (both gated).
- #194 (ESLint warn→error) after #239 clears.
- US-042 design (#196) blocked on OQ-BA-001 (user to clarify identity).

## Notes
- Union-merge conflict on feature/200-node-env-pin resolved: rebased onto current main (`f4f3258`), conflict in append-mostly `_handoff-pending/97-architect.md` resolved by keeping both sides.
- ADR-015 no-broker fitness function (dependency-graph guard) drafted, queued for DevSecOps to wire into ci.yml as follow-up.
