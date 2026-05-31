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

**Status:** ~~Open~~ **RESOLVED**
**Owner:** Architect + DevSecOps
**Raised by:** BA (Wave 10a, US-002)
**Resolved:** Wave 10a-d (2026-05-31)
**Affects:** US-002 AC1, AC4

**Decision:** **GitHub Actions + Dependabot + gitleaks + `pnpm smoke`.** Free hosted CI on PR + push to main; 5-line `dependabot.yml` for supply-chain CVEs; gitleaks pre-commit hook for secrets; post-deploy smoke script curls `/api/health`. No Jenkins, no IaC tooling. See `ops/README.md` "Pipeline & security tooling" and ADR-002 §Consequences.

---

## OQ-003 — Manual repo override in workspace-scoped Issues panel

**Status:** Open
**Owner:** UX Designer + BA
**Raised by:** BA (Wave 11a, US-003)
**Affects:** US-003 AC5 — wording may need adjustment if override is supported

**Question:** Should the user be able to manually override the derived `owner/repo` (e.g. type `keyan-commits/other-repo` directly) to handle the case where the git origin is a private mirror but issues live on a public GitHub repo?

**Context:** The default behavior (derive from `git remote get-url origin`) covers the common case. The override path addresses a power-user edge case. UX Designer to weigh in on whether an explicit override field adds complexity vs. value at current scope.

---

## OQ-004 — Caching strategy for `git remote` lookup in `/api/team-status`

**Status:** Open
**Owner:** Architect
**Raised by:** BA (Wave 11a, US-003)
**Affects:** BE implementation scope — determines whether a DB/memory cache layer is needed

**Question:** Should the `git -C <workspace> remote get-url origin` lookup be (A) executed fresh on every `/api/team-status` request (~5ms, always fresh), (B) cached in SQLite keyed by workspace path (avoids repeated shell execs, risk of stale data), or (C) cached in memory with a short TTL?

**Context:** apex-team is single-user, single-machine. The remote URL rarely changes. Architect to recommend — BA's default is Option A (no cache, simplest, correct-by-design) unless Architect identifies a performance concern.

---

_Future questions append below this line._
