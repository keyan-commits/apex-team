---
id: ADR-009
status: Superseded
superseded_by: ADR-010
date: 2026-06-02
closes: "#151"
---

# ADR-009 — `force-dynamic` export on `global-error.tsx`

> **SUPERSEDED by [ADR-010](ADR-010-build-dev-mode-prerender-bypass.md)
> (2026-06-02).** The Decision below — `export const dynamic = "force-dynamic"` —
> was verified during Wave 88 to **not work**: Next.js 16.2.6 ignores
> route-segment `dynamic` config for convention files. The Context section
> (root-cause crash) remains accurate. The actual fix is the two
> `next.config.ts` experimental flags documented in ADR-010. The export is
> retained as intent-signalling only.

## Context

Next.js 16.2.6 + React 19 attempts to statically prerender `/_global-error` during
`pnpm build`. During that prerender, Next.js's own SSR bundle
(`next_dist/...`) calls `useContext` before React's hook dispatcher is
initialized. This produces a hard build failure:

```
Error occurred prerendering page "/_global-error"
TypeError: Cannot read properties of null (reading 'useContext')
digest: 2919768151
```

The error is entirely inside `next_dist` — no user code is at fault. The
`"use client"` directive on `global-error.tsx` does not prevent Next.js from
attempting to statically prerender the error page at build time in this version.

## Decision

Export `dynamic = "force-dynamic"` from `src/app/global-error.tsx`.

```ts
export const dynamic = "force-dynamic";
```

This route-segment config, when placed in a Next.js convention file, instructs
the framework to skip static prerendering and only render the page at request
time. Next.js 16 respects this export even for special convention files.

## Consequences

**Positive**
- Build unblocked; no more `pnpm build` failure on `/_global-error`.
- One-line change; zero risk to runtime behavior (the error page only renders
  when a top-level error actually occurs).

**Negative / watch-outs**
- `dynamic = "force-dynamic"` on a convention file is counter-intuitive. Without
  this ADR, a future reader may remove it as "unnecessary", re-breaking the build.
- This is a workaround for a Next.js 16.2.x + React 19 bug. If the framework
  fixes the issue in a future minor release, this export can be removed. Check
  after any Next.js upgrade past 16.2.6.

## Follow-ups

- Remove this export and verify `pnpm build` still passes after any Next.js
  upgrade where the framework changelog mentions a fix for `/_global-error`
  prerender errors.
