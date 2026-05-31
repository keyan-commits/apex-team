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

**Status:** Resolved 2026-05-31
**Owner:** Architect
**Raised by:** BA (Wave 11a, US-003)
**Affects:** BE implementation scope — determines whether a DB/memory cache layer is needed

**Decision (Architect Wave 11a, implemented in `3c7c71d`):** Option A — per-request `git -C <workspace> remote get-url origin` (~2ms shell exec, no caching of the derivation itself). The 60s in-memory cache that already exists for the expensive `gh issue list` call was REPLACED from a singleton with a `Map<string, …>` keyed by `owner/repo`, so multiple workspaces can be served from one process without cross-contamination. Stale-remote edge case (user changes git origin mid-session) self-heals on the next 60s cache miss.

---

## OQ-005 — Application-level SSE heartbeat in `StreamableHTTPServerTransport`

**Status:** Open
**Owner:** Architect
**Raised by:** BA (Wave 12a, US-004)
**Affects:** US-004 — belt-and-braces option; NOT blocking AC1–AC4

**Question:** Should we implement an application-level SSE comment heartbeat (e.g. `: keep-alive\n\n` emitted every N seconds) in the MCP transport as additional insurance against intermediate proxy or client timeouts? The `StreamableHTTPServerTransport` currently has no heartbeat option. If the SDK adds support, or if we wrap it, is it worth implementing for this local single-user context?

**Context:** Architect confirmed in Wave 12a that no proxy sits between Claude Code and apex-team in the local setup, so SSE heartbeats are not needed to fix #31. This question is for future-proofing only.

---

## OQ-006 — Should the portable workspace bootstrap install gitleaks?

**Status:** Open
**Owner:** DevSecOps
**Raised by:** BA (Wave 14a, US-007)
**Affects:** US-007 AC1 scope — determines whether `gitleaks protect --staged` is added to the bootstrapped pre-commit hook

**Question:** When `pnpm devsecops:bootstrap-workspace` installs hooks in an external workspace, should it also inject a `gitleaks protect --staged` check into the pre-commit hook? Apex-team's own pre-commit already does this. The question is whether it should be a universal default for all bootstrapped workspaces, given gitleaks availability may vary across machines.

**Default intent:** Yes — same posture across workspaces. Fallback: if `which gitleaks` fails, skip the gitleaks step and print a warning rather than aborting the bootstrap.

---

## OQ-007 — Should the bootstrap require explicit user consent per workspace?

**Status:** Open
**Owner:** Product Owner + User
**Raised by:** BA (Wave 14a, US-007)
**Affects:** US-007 AC3 — applying branch protection to a GitHub repo is not easily reversible and deserves explicit consent

**Question:** Should `pnpm devsecops:bootstrap-workspace` prompt for interactive confirmation before applying GitHub branch protection rules (US-007 AC3), or should DevSecOps be able to run it autonomously when dispatched by PO?

**Default intent:** Explicit user approval required — applying branch protection is irreversible enough (especially AC1's "no bypass including admin") to warrant a `[y/N]` prompt or an explicit `--approve` flag before the `gh api` call. Hook installation (AC1) and ops/README update (AC5) can be non-interactive.

---

## OQ-008 — Provenance metadata format for skill sections (US-009 AC4)

**Status:** Open
**Owner:** Architect
**Raised by:** BA (Wave 29a, US-009)
**Affects:** US-009 AC4 — determines implementation approach for skill-section provenance badges

**Question:** Which metadata format should power the per-section provenance badge on the agent profile page?

- **Option A (recommended default):** Sibling `src/lib/skills/<role>.skills.json` — one JSON object keyed by section slug (e.g. `"example-mapping": { "source": "claude" }`). Zero TS-parser changes; readable without building. Missing entry = `claude` default.
- **Option B:** Front-matter comment block in the `.ts` file (e.g. `// @provenance: claude`). Co-locates provenance with the skill text but requires fragile line-by-line parsing.
- **Option C:** `git blame` fallback — derive author from first commit that added the section. No extra files but brittle (section re-worded = author reset); not actionable for `external` sources needing a URL.

**Default intent:** Option A — explicit JSON sidecar is the lightest to implement and the easiest to edit without touching TypeScript.

---

## OQ-009 — Scout trigger dispatch mechanism for `/api/scout/trigger` (US-010 AC2)

**Status:** Open
**Owner:** backend-developer
**Raised by:** BA (Wave 29a, US-010)
**Affects:** US-010 AC2 — determines whether the server endpoint calls PO via `talk_to_product_owner` or runs a leaner internal script

**Question:** Should `/api/scout/trigger` dispatch via:

- **Option A:** `talk_to_product_owner` — sends the PO a scout wave goal; PO orchestrates roles sequentially (full team wave, most thorough).
- **Option B:** A lightweight `/api/scout/run` backend script that iterates roles and calls `run-turn` directly with a scout prompt (faster, no PO overhead, but bypasses PO orchestration).

**Default intent:** Option A is simpler (reuses existing PO flow) but locks a dashboard button to the full PO latency (~60s per role). Option B is faster but adds a new code path. BE Dev to recommend based on scout latency requirements.

---

_Future questions append below this line._
