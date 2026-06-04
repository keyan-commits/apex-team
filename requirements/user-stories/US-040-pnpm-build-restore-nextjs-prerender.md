---
id: US-040
title: Restore pnpm build — Next.js 16.2.6 prerender crash fix
slug: pnpm-build-restore-nextjs-prerender
status: superseded
owner: backend-developer
raised: 2026-06-02
closes: "#151"
wave: 88
---

## Resolution — superseded by Plan C cutover

All ACs target `src/app/global-error.tsx`, `next.config.ts`, and the Next.js `pnpm build` pipeline — monolith files retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). There is no Next.js app or `pnpm build` under the subagent runtime.

# US-040 — Restore pnpm build: Next.js 16.2.6 prerender crash fix

## Narrative

As a developer, I want `pnpm build` to exit 0 again so that the QA two-leg smoke gate (US-019 Leg A) is enforceable and CI remains a meaningful safety check.

## Context

`pnpm build` regressed after upgrading to Next.js 16.2.6. During prerender of `src/app/global-error.tsx`, the React dispatcher was uninitialized (`null`), causing an invariant violation that killed the build. ADR-009 originally prescribed `export const dynamic = "force-dynamic"` in `global-error.tsx` as the fix, but this export is ignored by Next.js 16.2.6 for convention files (both Turbopack and webpack) — it was tested exhaustively (runtime, edge, SSR null guard, all failed).

The actual fix is in `next.config.ts`:
- `experimental.allowDevelopmentBuild: true` — bundles React in dev mode, which initializes the dispatcher during prerender. Requires `NODE_ENV=development` (the apex-team environment already has this, as it's a local-only dev tool).
- `experimental.prerenderEarlyExit: false` — fallback so the build doesn't halt on a prerender error.

For apex-team (local-only dev tool), the dev-mode bundle is acceptable. See ADR-009 amendment (or ADR-010) for the rationale.

Issue #151 tracks this fix.

## Acceptance Criteria

- **AC1:** `pnpm build` exits 0 on a clean checkout of `main` after this fix merges.

- **AC2:** `src/app/global-error.tsx` carries `export const dynamic = "force-dynamic"` (retained per ADR-009 original intent, even though it has no effect on 16.2.6 — documents the intent).

- **AC3:** `next.config.ts` sets `experimental.allowDevelopmentBuild: true` and `experimental.prerenderEarlyExit: false`.

- **AC4:** ADR-009 is amended (or ADR-010 is created) to document that the real fix for Next.js 16.2.6 is the `next.config.ts` flags, and why `dynamic="force-dynamic"` alone is insufficient. Future developers must be able to understand why these experimental flags exist.

- **AC5:** `pnpm type-check` exits 0. All existing tests pass without regression.

## Out of Scope

- Removing the `export const dynamic = "force-dynamic"` line from `global-error.tsx` (it stays as documentation of intent).
- Switching to production-mode React bundle — dev-mode is acceptable for a local-only tool; perf-sensitive production deployment is future scope.
- Changing any behavior of `global-error.tsx` beyond adding the `dynamic` export.

## Technical Notes

_For implementer reference._

- `allowDevelopmentBuild: true` is a Next.js experimental flag that bundles React in dev mode regardless of `NODE_ENV`. This satisfies the dispatcher initialization requirement during SSR prerender.
- `prerenderEarlyExit: false` prevents the build from exiting early when it hits the prerender invariant before the allowDevelopmentBuild bundle takes effect.
- Both flags are `experimental` — track them in upgrade notes for future Next.js upgrades.

## Links

- impl: PR #197 (`feature/88-restore-ci-protocol`, Wave 88)
- adr: `architecture/decisions/ADR-009-global-error-dynamic-export.md` (amendment pending per AC4)
- qa-pass-by: (pending)
- deployed-by: (pending)
