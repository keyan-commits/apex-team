---
id: US-040
title: Fix /_global-error prerender hard build failure
slug: global-error-prerender-build-fix
status: superseded
owner: backend-developer
raised: 2026-06-02
closes: "#151"
---

## Resolution — superseded by Plan C cutover

All ACs target `src/app/global-error.tsx` and the Next.js `pnpm build` pipeline — monolith files retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). There is no Next.js app to build under the subagent runtime.

# US-040 — Fix `/_global-error` Prerender Hard Build Failure

## Narrative

As a developer building apex-team, I want the `pnpm build` command to succeed without crashing on the `/_global-error` route prerender, so that the application can be deployed and shipped.

## Acceptance Criteria

- **AC1:** `src/app/global-error.tsx` has a single line added before the default export: `export const dynamic = "force-dynamic"`. This prevents Next.js from attempting to statically prerender the error boundary at build time.

- **AC2:** `pnpm build` exits 0 (zero exit code) and completes without crashing. The `/_global-error` prerender no longer throws an exception.

- **AC3:** `pnpm test:run` passes all 314 tests (or current count) without regression — no new failures introduced.

- **AC4:** The ADR-009 documentation (already committed) explains WHY this export must never be removed in future cleanup — implementer confirms this cross-reference exists and is readable.

## Out of Scope

- Changes to ADR-009 itself (Architect owns the ADR; it is already written and committed).
- Workarounds or conditional exports — the required fix is unconditional and permanent.

## Technical Notes

_For implementer reference, not acceptance criteria._

- **Root cause:** Next.js 16.2.6 + React 19 bug — the framework's own SSR bundle calls `useContext` during static prerender, but React's dispatcher context hasn't been initialized yet. The error occurs at build time, not runtime.

- **Why `dynamic = "force-dynamic"` works:** It tells Next.js to defer rendering of this route to request time (runtime), skipping the static prerender. The error boundary still works normally in production.

- **Why this export is permanent:** Error boundaries that reference `useContext` (directly or via library code) cannot be prerendered with React 19 + Next.js 16.2.6. This is a framework-level constraint, not a bug to "fix later." The export prevents silent build breakage in future dependency upgrades.

## Links

_(Filled in during implementation)_

- impl: (pending)
- adr: architecture/decisions/ADR-009-global-error-dynamic-export.md
- qa-pass-by: (pending)
