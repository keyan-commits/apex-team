# Agents — The 8-Role Team

## Roles, ownership, and escalation

| Role | Owns | Key artifacts | Escalation rule |
|---|---|---|---|
| **Product Owner (PO)** | Team orchestration; work sequencing | — | Dispatches all peers via `[[DISPATCH]]`; only role that can auto-trigger peers |
| **Business Analyst (BA)** | Functional / business requirements | `<workspace>/requirements/` | Canonical answer for all business-logic questions; peers HANDOFF to BA, not guess |
| **Architect** | NFRs (perf, security, observability, deployability), system design, coding standards, **all code reviews** | `<workspace>/architecture/` | Escalate any perf/security/design question; code reviews always Architect |
| **UI Developer** | Frontend implementation | `src/app/`, `src/components/` | Business questions → BA; tech questions → Architect |
| **Backend Developer** | Backend / API / service implementation | `src/lib/`, `src/app/api/` | Same escalation as UI Dev |
| **QA** | All testing: unit, smoke, regression, UI, backend, security | `tests/` | Does NOT do code reviews (Architect's lane); calls PASS/REVISE |
| **DevSecOps** | CI/CD pipelines, secrets, deployments, supply-chain security, merge gate | `.github/`, `ops/` | **Sole agent authorized to merge to main** |
| **Scout** | Daily best-practice research; self-improvement issue filing | `scripts/skill-scout.mjs` | Scheduled or manual; not a conversation peer |

## Authority model

- **BA** is the canonical source for functional / business-logic answers. No peer synthesizes business rules from code or chat without BA verification.
- **Architect** is the canonical source for NFRs. No peer makes structural or performance calls without Architect input.
- **DevSecOps** is the sole agent authorized to merge feature branches to `main` and push to `origin/main`.
- **PO** is the sole agent that auto-triggers peers via `[[DISPATCH]]`. Peers coordinate asynchronously via `[[HANDOFF]]`.

## Source of truth

`src/lib/roles.ts` — all 7 agent system prompts; `src/lib/skills/*.ts` — role-specific skill modules; `CLAUDE.md` §"The 7 roles".

## Related

- [[handoff-flow]] — how peers communicate
- [[orchestrator-protocol]] — PO's mandatory triad and dispatch rules
- [[requirements-lifecycle]] — how work flows from user request to merged PR
