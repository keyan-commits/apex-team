# US-002 — DevSecOps pipeline ownership

**Status:** proposed
**Owner role:** devsecops
**Created:** 2026-05-31
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

- **OQ-002:** Which CI/CD approach is appropriate for apex-team's single-user single-machine context — GitHub Actions (hosted runners), Jenkins (self-hosted), roll-our-own scripts, or nothing beyond manual steps? Status: **open**. Owner: Architect + DevSecOps. Blocking: AC1, AC4. See `requirements/open-questions.md`.

## Design spec

- No UI involved — backend/ops change only. No `design/` spec needed.

## Links (filled after implementation)

- impl: (pending OQ-002 resolution + implementation dispatch)
- test: (pending)
- qa-pass-by: (pending)
- deployed-by: (pending)
