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

_Future questions append below this line._
