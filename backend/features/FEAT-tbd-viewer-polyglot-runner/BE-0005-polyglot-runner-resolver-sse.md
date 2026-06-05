---
ticket: BE-0005
parent_feat: TBD
parent_us: TBD
wave: 130
role: backend-developer
status: retro
---

# BE-0005 — Polyglot runner resolver + SSE streaming (Wave 130 Retro)

**Wave:** 130
**Viewer PR:** keyan-commits/apex-team-viewer#13 (merged)
**Viewer commit:** b205ec18159017ec154709d8025d6bb2b4798215

## Scope

The largest single backend wave in the viewer. Introduced a project-agnostic
runner detection library (`lib/runner-resolver.mjs`) and wired it into both the
`/api/run-test` SSE endpoint and the `/api/artifacts` response shape.

Runner resolution walks parent directories from the test file's path looking for
build-tool manifests in priority order: `vitest.config.*`, `jest.config.*`,
`playwright.config.*`, `pom.xml` (Maven), `gradlew` (Gradle wrapper). The
resolver returns `{ runner, command, args, cwd }` or `null` for unknown
ecosystems. Nested test discovery: the server now recursively finds test files
under a FEAT directory, not only at depth 1.

SSE shape change: the `/api/run-test` stream now emits structured
`{ type: "stdout"|"stderr"|"exit", data }` JSON frames so the client can
distinguish output channels from exit-code events.

Key deliverables:
- `lib/runner-resolver.mjs` — 198-line resolver: manifest walking, priority
  order, `detectPackageManager` helper, orphan-test fallback.
- `server.mjs` — +242 lines: runner resolver integration, nested test
  discovery, structured SSE frame shape.
- `__tests__/runner-resolver.test.ts` — 307-line test suite covering all five
  runner types + edge cases (nested paths, missing manifests, orphan fallback).

## Files touched (sibling viewer repo)

- `lib/runner-resolver.mjs` — new file, 198 lines
- `server.mjs` — +242 lines: runner resolver wired into `/api/run-test` and
  `/api/artifacts`; nested test discovery; structured SSE frame output
- `__tests__/runner-resolver.test.ts` — new file, 307 lines (QA-authored
  equivalent; tests co-shipped in the same PR)

## apex-team-side artifacts

- This summary doc
- Wave-130 HANDOFF block in `coordination/handoffs/ui-developer.md` (historical —
  UI Dev was the routed role for this wave)

## Notes

- Retro backfill — this BE-0005 doc was authored after the fact during Wave 137 to
  close the BE Dev artifact gap surfaced by the user during a viewer review. The
  actual implementation happened in the viewer repo under UI Dev's authorship; this
  doc retroactively credits the backend-shaped work.
- Pre-convention wave for FEAT allocation: no FEAT-NNNN was open for "polyglot
  runner" at Wave 130. `parent_feat` is TBD pending BA reconciliation.
- The `existsSync` passthrough fix (dd70fffa) that landed as a fixup commit in
  the same PR is part of this wave's scope.
