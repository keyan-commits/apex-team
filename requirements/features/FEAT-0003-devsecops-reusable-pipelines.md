---
feat: FEAT-0003
title: "DevSecOps Reusable Pipelines + CLI Runner"
status: active
created: 2026-06-04
wave: 124
related-us: US-100
related-adr: "(pending — Architect to assess if structural guidance needed)"
related-design: "(none — no UI surface)"
related-tests: "tests/qa/features/FEAT-0003-devsecops-reusable-pipelines/ (pending Wave 124 QA dispatch)"
related-ops: "ops/pipelines/ (this feature creates the pipelines dir)"
---

# FEAT-0003 — DevSecOps Reusable Pipelines + CLI Runner

This feature scaffolds reusable POSIX shell pipeline templates per environment (dev/staging/prod),
defines the per-feature overlay convention, and adds CLI runners so the user can invoke
DevSecOps pipelines and QA tests independently of Claude Code agent dispatch.

---

## What this feature is

Today there is no standalone pipeline infrastructure in apex-team. If the user wants to
run CI steps or QA tests for a specific feature, they must either invoke Claude Code or
run `pnpm test:run` directly (which runs all tests, not per-feature).

This feature introduces:

- `ops/pipelines/<env>.sh` — one per environment tier, each composing base steps + feature overlay.
- `ops/pipelines/_template.sh` — a copy-paste skeleton for new environments.
- `ops/features/FEAT-XXXX-<slug>/OPS-NNNN-<slug>.sh` — per-feature overlay convention.
- `pnpm run ops:run --env=<env> --feat=FEAT-XXXX` — CLI runner for pipelines.
- `pnpm run qa:feat --feat=FEAT-XXXX` — CLI runner for per-feature QA tests.
- `ops/README.md` — user-readable documentation for independent invocation.
- `.claude/agents/devsecops.md` body section codifying the pipeline authoring standard.

---

## Motivation (from user directive, Wave 122 follow-up)

> "The DevSecOps output folder should show the CI/CD pipelines for all applicable
> environments, it should be reusable. I should be able to run both the DevSecOps pipeline
> and QA tests on my own if I wanted to."

No standalone pipeline tooling meant every CI/CD change required agent dispatch. The user
wants to drive pipelines and tests directly from the shell.

---

## Driving user story

[US-100 — DevSecOps Reusable Pipelines + CLI Runner](../user-stories/US-100-devsecops-reusable-pipelines-cli.md)

See US-100 for the full acceptance criteria. This FEAT doc is the feature parent;
US-100 is the child story specifying what "done" looks like.

---

## Scope of FEAT-0003

FEAT-0003 covers the pipeline scaffolding and CLI runner infrastructure:

- `ops/pipelines/dev.sh`, `staging.sh`, `prod.sh` (AC1)
- Per-feature overlay shape at `ops/features/FEAT-XXXX-<slug>/OPS-NNNN-<slug>.sh` (AC2)
- `package.json` `ops:run` + `qa:feat` scripts (AC3)
- `ops/README.md` independent-execution documentation (AC4)
- `ops/pipelines/_template.sh` skeleton (AC5)
- `devsecops.md` body section `### ops/pipelines standard (Wave 124 — MANDATORY)` (AC6)
- Regression tests at `tests/qa/features/FEAT-0003-devsecops-reusable-pipelines/` (AC7)

Does NOT cover:
- Specific cloud/CI vendor wiring (GitHub Actions, GitLab CI, AWS) — per-feature overlays when deployment targets are known
- Viewer rendering of `ops/pipelines/` in the DevSecOps Output tab — FEAT-0002 / US-099 AC9 owns that surface
- Automated CI triggering of `ops/pipelines/*.sh` — separate wave when a project has a real deploy target

---

## Scaffolding vs live pipeline note

Templates ship as placeholder skeletons with commented-out step functions. Existing features
(FEAT-0001 Grouping Convention, FEAT-0002 Viewer Rendering) do NOT get real pipeline overlays
until there is something to deploy. The templates provide the skeleton; feature-specific
overlays authored by DevSecOps when actual deployment steps exist provide the substance.
This is documented in `ops/README.md`.

---

## Per-role artifact directories

| Role | Path | Ticket | Status |
|---|---|---|---|
| BA | `requirements/features/FEAT-0003-devsecops-reusable-pipelines.md` (this file) | FEAT-0003 | Active |
| Architect | `architecture/features/FEAT-0003-devsecops-reusable-pipelines/ARCH-XXXX-*.md` | ARCH-XXXX | Pending — Architect to assess if structural guidance needed |
| UX | N/A — no UI surface | — | Not applicable |
| QA | `tests/qa/features/FEAT-0003-devsecops-reusable-pipelines/TEST-XXXX-*.test.ts` | TEST-XXXX | Pending — Wave 124 QA dispatch |
| FE Dev | N/A | — | — |
| BE Dev | N/A | — | — |
| DevSecOps | `ops/pipelines/dev.sh`, `ops/pipelines/staging.sh`, `ops/pipelines/prod.sh`, `ops/pipelines/_template.sh`, `ops/features/FEAT-XXXX-*/OPS-XXXX-*.sh` | OPS-XXXX | Pending — Wave 124 DevSecOps dispatch |

---

## Acceptance criteria summary

See US-100 for the full testable ACs. Feature-level tracking:

- [ ] AC1: `ops/pipelines/dev.sh` + `staging.sh` + `prod.sh` — POSIX sh, `$1=FEAT`, overlay source, exit-on-failure, executable (DevSecOps)
- [ ] AC2: Per-feature overlay shape + mandatory frontmatter (DevSecOps — convention + first example)
- [ ] AC3: `package.json` `ops:run` + `qa:feat` scripts (DevSecOps)
- [ ] AC4: `ops/README.md` — direct + pnpm invocation documented; overlay how-to; scaffolding note (DevSecOps)
- [ ] AC5: `ops/pipelines/_template.sh` — copy-paste skeleton; NOT executable (DevSecOps)
- [ ] AC6: `devsecops.md` body section `### ops/pipelines standard (Wave 124 — MANDATORY)` (DevSecOps)
- [ ] AC7: Regression tests — existence / executability / shebang / syntax / CLI scripts / README phrases / overlay-skip (QA)
- [x] AC8: Scaffolding ≠ pipeline-on-day-one documented in README + this file (BA, this wave)

---

## Status history

| Date | Wave | Status | Note |
|---|---|---|---|
| 2026-06-04 | 124 | draft → active | BA authored US-100 + this FEAT seed file. Requirements phase complete. Wave 124 implementation dispatched to DevSecOps (pipeline scaffolding + body amendment) + QA (regression tests). |
