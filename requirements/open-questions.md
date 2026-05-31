# Open Questions

_Owned by Business Analyst. Last updated: 2026-05-31._

Open questions are blockers or ambiguities that require an answer before affected work proceeds. Each question has an owner and a status.

---

## OQ-001 — Isolation model: feature branches vs git worktrees vs separate clones

**Status:** Open  
**Owner:** User  
**Raised by:** Architect (ADR-002 §Consequences, Wave 9b)  
**Affects:** `IMPLEMENTATION_PHASE_PROTOCOL`, ADR-002, DevSecOps isolated-instance scripts

**Question:**
ADR-002 interprets "their own source code" as **feature branches** — one repo, each implementer works on a separate branch from main. A stronger interpretation would be **git worktrees** (separate working directories but same `.git` object store) or **separate filesystem clones** (completely isolated repos).

Feature branches are the current implementation default. Worktrees or clones would prevent an implementer from accidentally viewing or touching the other's uncommitted files.

**What the user needs to decide:**
- Feature branches (current) — simpler, lower overhead, correct for most cases
- Git worktrees — stronger file-level isolation, still one `.git` object store; DevSecOps would provision via `git worktree add`
- Separate clones — maximum isolation; requires separate clone + sync protocol; significant DevSecOps overhead

**Action required:** User confirms preferred isolation level. If worktrees or clones, Architect updates ADR-002 §Consequences and DevSecOps updates the provisioning scripts.

---

_Future questions append below this line._
