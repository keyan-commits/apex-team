# Verification and Smoke — QA Gate Rubric

## Mandatory steps before any QA PASS (Wave 64+, US-019)

All four steps are required. BOTH smoke legs must pass — neither alone is sufficient.

### 1. Type-check
```bash
pnpm type-check
```
Must return 0 errors. (14 pre-existing warnings are acceptable.) Tests compile coverage, not runtime behavior.

### 2. Test suite
```bash
pnpm test:run
```
All tests must be green. PRs touching protocol/skill constants must add regression-guard substring assertions.

### 3. Build smoke (mandatory, Wave 64)
```bash
pnpm build
```
`pnpm build` runs `next build`, which uses SWC/Turbopack to eagerly compile the **entire Next route graph** — every `src/app/**` route plus everything they transitively import (including `src/lib/roles.ts` → `src/lib/skills/*.ts`).

`tsc --noEmit` and `vitest run` do NOT invoke this compiler. A file can be type-clean and test-green and still fail to parse at server startup.

**Incident reference:** Wave 55-roles commit `e7d4ba6` shipped a parse error in `src/lib/skills/architect.ts` (em-dash + escaped backticks inside a template literal). It passed tsc AND vitest. `pnpm build` would have caught it in ~30s. See `LESSONS.md`.

### 4. Boot smoke (mandatory, Wave 64)
```bash
pnpm dev:test  # port 3100
curl http://localhost:3100/api/health
# Must return HTTP 200
```
`server.ts` and `src/mcp/*.ts` run via tsx/esbuild at runtime and are **NOT** in the next-build graph. `pnpm build` cannot catch parse or boot failures there. The boot+health check is the only leg that covers this surface.

### For UI-touching PRs (additive, Wave 53b)

Playwright browser verification at **≥1280px AND ≥390px** viewports. Full-page scan including pre-existing widgets on touched routes. Not a replacement for the build + boot smokes above — additive.

## Gate sequence

```
pnpm type-check (pass)
  → pnpm test:run (all green)
  → pnpm build (success)
  → pnpm dev:test + GET /api/health → 200
  → [UI PRs only] browser verification ≥1280px + ≥390px
  → QA issues PASS verdict
  → DevSecOps merges
```

Architect gates non-UI code (patterns, naming, abstraction) BEFORE QA. UX gates UI (visual, a11y, responsive) BEFORE QA. QA always gates AFTER all design gates return.

## Source of truth

`src/lib/protocols.ts` — `VERIFICATION_PHASE_PROTOCOL`; `src/lib/skills/qa.ts` — `### Mandatory build smoke before PASS (Wave 64)`.

## Related

- [[orchestrator-protocol]] — where verification fits in the phase sequence
- [[requirements-lifecycle]] — full gate chain from PR to merge
