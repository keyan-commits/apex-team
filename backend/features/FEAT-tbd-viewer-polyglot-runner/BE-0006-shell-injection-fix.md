---
ticket: BE-0006
parent_feat: TBD
parent_us: TBD
wave: 131
role: backend-developer
status: retro
---

# BE-0006 — shell:true security fix on Gradle/Maven spawn (Wave 131 Retro)

**Wave:** 131
**Viewer PR:** keyan-commits/apex-team-viewer#16 (merged)
**Viewer commit:** 847b7c45037f7933ad95f66433c91b30c46c6f12

## Scope

Security fix: the Wave 130 polyglot runner initially used `shell: true` on the
`child_process.spawn` call for Gradle and Maven commands, which opens the
spawned command to shell injection via adversarially crafted test-file paths or
command arguments. This wave drops `shell: true` across all runner types and
uses explicit argument arrays instead.

Concretely:
- Gradle wrapper invocation changed from `spawn('sh', ['-c', `./gradlew ...`],
  { shell: true })` to `spawn('./gradlew', [...args], { shell: false })` with
  the test path sanitized as a separate argument element.
- Maven invocation receives the same treatment.
- Regression test suite added in `__tests__/` covering the injection vector
  (a test path containing shell metacharacters must not execute injected
  commands).

## Files touched (sibling viewer repo)

- `server.mjs` — net +5/-3 lines: `shell: true` removed from Gradle and Maven
  spawn calls; argument arrays constructed explicitly
- `__tests__/runner-resolver-shell-injection.test.ts` (or equivalent) — new
  regression tests for the injection fix (see PR #16)

## apex-team-side artifacts

- This summary doc
- Wave-131 HANDOFF block in `coordination/handoffs/ui-developer.md` (historical —
  UI Dev was the routed role for this wave)
- Closes apex-team-viewer issue #14 (shell injection vulnerability report)

## Notes

- Retro backfill — this BE-0006 doc was authored after the fact during Wave 137 to
  close the BE Dev artifact gap surfaced by the user during a viewer review. The
  actual implementation happened in the viewer repo under UI Dev's authorship; this
  doc retroactively credits the backend-shaped work.
- Security classification: this is a backend security fix (process-spawn hardening),
  not a UI change. Under the going-forward routing rule (see Wave 137 HANDOFF), this
  class of change dispatches BE Dev in parallel with UI Dev.
- Groups with BE-0005 under the same FEAT-tbd-viewer-polyglot-runner directory
  because it directly patches the runner spawn surface introduced in Wave 130.
