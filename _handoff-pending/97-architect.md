## Done
- #200 NODE_ENV pin: `build` script now `NODE_ENV=development next build` (package.json). Hardens ADR-010 — an ambient `NODE_ENV=production` can no longer silently defeat `experimental.allowDevelopmentBuild` and reintroduce the `/_global-error` prerender crash. Verified: `NODE_ENV=production pnpm build` exits 0 (inline pin overrides ambient). `next.config.ts` comment updated to point at the pin instead of "already set in the environment". PR opened (see below).
- #201 prerender fitness function: added F2 grep step to `build-smoke` CI job; removed stale `continue-on-error: true` (#151 closed 25c57a4). Build output captured via `tee`; F2 runs `if: always()` so it catches masked errors even on non-zero build exit. MERGED as #234.

## In flight
- #200: PR open off `f623bfd`, self-review PASS. HANDOFF DevSecOps to merge as low-risk car.
- #235 (ADR-015 no-broker): DevSecOps doc tail car.
- #231 (US-054 a11y dashboard): UX re-gate pending; QA ran all 7 gates on `5949321`.

## Next
- US-042 design (#196): blocked on OQ-BA-001 (US-042–US-045 identity unknown); resume once user clarifies.
- #194 ESLint warn→error: next unblocked arch-lane item after #200 clears.
- #205 SHA-pin UX skills: queued.

## Notes
- #200 is a TINY-tier config change. No `cross-env` dep added — repo's dev:* scripts already use bare inline `NODE_ENV=` (single-user mac), so inline pin is consistent and keeps deps lean.
- ADR-015 no-broker fitness fn still queued for DevSecOps's ci.yml (future wave, not this tick).
