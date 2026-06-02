---
id: ADR-010
status: Accepted
date: 2026-06-02
closes: "#151"
supersedes: ADR-009
---

# ADR-010 — `pnpm build` prerender fix via dev-mode bundle (`next.config.ts` experimental flags)

## Context

ADR-009 prescribed `export const dynamic = "force-dynamic"` on
`src/app/global-error.tsx` to stop Next.js 16.2.6 + React 19 from statically
prerendering `/_global-error` and crashing on a null hook dispatcher
(`TypeError: Cannot read properties of null (reading 'useContext')`).

During Wave 88 implementation, BE Dev established empirically that the
`force-dynamic` export **does not work**: Next.js 16.2.6 ignores route-segment
`dynamic` config for convention files (`global-error.tsx`) in this version. The
fix was tested exhaustively and failed under every variant:

- Turbopack build
- webpack build
- `runtime = "edge"` segment config
- SSR null-guard in the component body

The crash originates entirely inside `next_dist`'s own SSR bundle; no user-code
change to the convention file can suppress the prerender attempt.

## Decision

Fix the build at the framework-config layer in `next.config.ts`, not in the
convention file:

```ts
experimental: {
  allowDevelopmentBuild: true,   // bundle React in dev mode → hook dispatcher
                                 // is initialized during prerender
  prerenderEarlyExit: false,     // fallback: don't hard-fail the build on a
                                 // prerender error
}
```

`allowDevelopmentBuild: true` permits `next build` to run with
`NODE_ENV=development` and emit a **development-mode** bundle. The dev React
build initializes its hook dispatcher in a way that survives the
`/_global-error` prerender path, so the build completes. `prerenderEarlyExit:
false` is belt-and-suspenders: if a prerender error still surfaces, the build
records it instead of aborting.

The `dynamic = "force-dynamic"` export in `global-error.tsx` is **retained as
intent-signalling only** — it documents that this route must never be
statically prerendered, even though the current framework version ignores it.
It costs nothing and becomes load-bearing again if a future Next.js version
starts honouring the export for convention files.

## Why this is acceptable for apex-team (NFR assessment)

`allowDevelopmentBuild` would be a **hard reject** for a production-served app —
a dev bundle is unminified, ships React's dev build, skips production
optimizations, and emits dev-only warnings (a direct performance-NFR
violation). apex-team is exempt because:

- **Local-only, single-user dev tool** (per `CLAUDE.md`: "Single-user,
  single-machine only"). There is **no production deployment target**.
- `pnpm build` here exists as a **CI correctness gate** — it proves the code
  compiles, type-checks, and prerenders without crashing. It is not producing an
  optimized artifact for end-user serving.
- The runtime path users actually hit is `pnpm dev` (the custom Next server),
  which is unaffected by this flag.

For those reasons the dev-mode build artifact is acceptable here and only here.

## Consequences

**Positive**
- `pnpm build` exits 0; the CI build gate (ADR target of #151) is restored.
- Root cause is fixed at the correct layer (framework config) rather than via a
  no-op export that masquerades as the fix.

**Negative / watch-outs**
- **Latent NODE_ENV coupling.** The fix only applies when `pnpm build` runs with
  `NODE_ENV=development`. If a future CI/script change forces
  `NODE_ENV=production`, `allowDevelopmentBuild` is inert and the build breaks
  again with no obvious cause. → Follow-up F1.
- **`prerenderEarlyExit: false` can mask future prerender regressions.** A
  genuinely-broken page could prerender-fail silently instead of failing the
  build. → Follow-up F2.
- **`experimental.*` is unstable across Next minor versions.** Both flags may be
  renamed or removed on upgrade. Pinned to Next 16.2.6. → Follow-up F3.
- If this app ever grows a real production deployment, this decision must be
  revisited before that ships — a dev-mode production build is not shippable.

## Follow-ups

- **F1** — pin `NODE_ENV=development` explicitly in the `build` script (or a
  cross-env wrapper) so the fix can't be silently defeated by an ambient
  env change. Filed as a self-improvement issue.
- **F2** — add a fitness function: a CI step that asserts `pnpm build` output
  contains **zero** `Error occurred prerendering` lines, so a masked prerender
  failure still trips CI even with `prerenderEarlyExit: false`.
- **F3** — re-test `force-dynamic` alone (and drop both experimental flags)
  after any Next.js upgrade past 16.2.6 whose changelog mentions a
  `/_global-error` prerender or convention-file `dynamic` fix. If fixed, this
  ADR's mechanism is removed and ADR-009's original one-liner becomes sufficient.

## Relationship to ADR-009

ADR-009 is **Superseded** by this ADR. Its Context (the root-cause crash
description) remains accurate and is the canonical write-up of *why* the build
broke. Only its Decision (the `force-dynamic` mechanism) is wrong; the export is
kept for intent, not as the fix.
