# Open Questions

_Owned by Business Analyst. Last updated: 2026-05-31._

Open questions are blockers or ambiguities that require an answer before affected work proceeds. Each question has an owner and a status.

---

## OQ-001 — Isolation model: feature branches vs git worktrees vs separate clones

**Status:** ~~Open~~ **RESOLVED**  
**Owner:** User  
**Raised by:** Architect (ADR-002 §Consequences, Wave 9b)  
**Resolved:** Wave 9c (2026-05-31)  
**Affects:** `IMPLEMENTATION_PHASE_PROTOCOL`, ADR-002, DevSecOps isolated-instance scripts

**Decision:** **Feature branches + git worktrees.** Logical isolation via feature branches (`feature/<wave>-<short>`); physical filesystem isolation via `git worktree add` so multiple implementers can work in parallel without touching each other's uncommitted files.

**Implementation:** DevSecOps Wave 9c (`3d2a933`) — `pnpm branch:start <role> <slug>` creates `../apex-team-<role>-<short>/` worktree. `pnpm branch:cleanup <role> <slug>` removes it post-deploy. ADR-002 §Consequences update pending Architect.

---

## OQ-002 — CI/CD tooling: GitHub Actions vs Jenkins vs roll-our-own vs nothing

**Status:** Open  
**Owner:** Architect + DevSecOps  
**Raised by:** BA (Wave 10a, US-002)  
**Affects:** US-002 AC1, AC4 — build verification + dependency scan approach  

**Question:** Which CI/CD approach is appropriate given apex-team's actual constraints (single user, single Mac, no remote infra, no ANTHROPIC_API_KEY, Claude subscription auth only)?

**Options under consideration:**
- GitHub Actions — hosted runners, PR triggers; requires push to GitHub and workflow YAML
- Jenkins — self-hosted CI server; significant overhead for a local dev tool
- GitLab CI — requires migration away from GitHub; likely out of scope
- Roll our own — extend existing `scripts/` with a pre-commit hook + `pnpm verify` script
- Nothing beyond manual steps owned by DevSecOps

**Context:** Architect and DevSecOps are researching and providing recommendations in Wave 10a. BA will update US-002 ACs once the decision lands.

---

_Future questions append below this line._
