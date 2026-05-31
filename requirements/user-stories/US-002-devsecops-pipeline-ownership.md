# US-002 — DevSecOps pipeline ownership

**Status:** done
**Owner role:** devsecops
**Created:** 2026-05-31
**Closed:** 2026-05-31
**Story ID:** US-002

## Narrative

As the user, I want the DevSecOps role to own all pipeline, IaC, and standard DevSecOps tasks, so that there is a single accountable role for build automation, deployment, supply-chain security, and infrastructure — and the team doesn't improvise ad-hoc.

## Acceptance criteria

- AC1: Given any commit that lands on main, when the commit is made, then a build verification step (type-check + test run) executes — either automatically (CI trigger) or as a documented manual step that DevSecOps performs and records evidence for.
- AC2: Given QA PASS + UX PASS HANDOFFs for a feature branch, when a feature branch is ready to merge, then DevSecOps is the sole role that executes `git merge` + `git push origin main` — no other role merges directly.
- AC3: Given any change to pipeline behavior (CI config, deploy scripts, dependency scan rules, ops runbooks), when the change is made, then it lives exclusively under `<workspace>/ops/` and DevSecOps is the only authorized editor of that directory.
- AC4: Given a new npm dependency being added to the project, when the addition is proposed, then a dependency security check (e.g. `npm audit` or equivalent) is performed by DevSecOps before the merge is approved.
- AC5: Given apex-team's no-remote-infra constraint, when IaC tooling is considered for this project, then DevSecOps explicitly documents in `ops/README.md` which IaC approach (if any) applies and why — including an explicit "not applicable" if no external infra exists.

## Out of scope

- Selecting specific CI/CD tooling (Jenkins vs GitHub Actions vs custom scripts) — pending OQ-002 resolution.
- Multi-machine or cloud deployment pipelines — out of scope for apex-team (see `requirements/scope.md`).
- Monitoring or alerting infrastructure beyond the local single-machine context.

## Open questions

- **OQ-002:** ~~Which CI/CD approach is appropriate for apex-team's single-user single-machine context~~ — **RESOLVED 2026-05-31**: GitHub Actions (free hosted) for PR-time CI + Dependabot + CodeQL; gitleaks pre-commit hook for secrets; `pnpm smoke` for post-deploy health. No Jenkins, no IaC tooling. See `ops/README.md` "Pipeline & security tooling" + ADR-002 §Consequences.

## Design spec

- No UI involved — backend/ops change only. No `design/` spec needed.

## Links (filled after implementation)

- impl: `88fd8d1` (DevSecOps Wave 10b — CI / CodeQL / Dependabot / smoke / gitleaks) + `93015c7` (Wave 10d — IaC N/A doc fix)
- test: `tests/ops/post-deploy-smoke.test.ts` (5 vitest cases, all green)
- qa-pass-by: QA Wave 10c — initial FAIL on AC5, RE-PASS at `93015c7` after IaC doc fix
- deployed-by: `6eaab70` (DevSecOps merge to main, pushed origin/main 2026-05-31)
