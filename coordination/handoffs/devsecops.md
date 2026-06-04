# DevSecOps — HANDOFF (Wave 111b Phase 2)

## ⏭️ NOW — 2026-06-04 (Wave 111b Phase 2)

### Wave 111b Phase 2 — Cluster 3 skills #368 + #369

**Issues addressed:**

- **#368 (OIDC workload identity)** — ADDRESSED. Added `### OIDC workload identity federation` section to `.claude/agents/devsecops.md` (after `### GitHub Actions hardening`). Content: rule (long-lived CI cloud credentials = finding), how OIDC exchange works (GitHub Actions OIDC JWT → cloud IAM trust policy → short-lived credentials), minimal GA pattern for AWS, when to apply, fallback when OIDC unavailable, audit signal. Issue #368 can be closed.

- **#369 (Policy-as-code gates)** — ADDRESSED with scope note. Added `### Policy-as-code gates` section (after `### Shift-left security`). Content: OPA vs Kyverno tool selection table, representative invariants (image provenance, privilege escalation, attestation, labels, resource limits), CI gate patterns for both tools, evidence convention. apex-team current status documented: no k8s/OCI deploy surface — section is a when-needed baseline; activate by filing HANDOFF to Architect when a container or k8s surface is introduced. Issue #369 can be closed.

**Files touched:**
- `.claude/agents/devsecops.md` — two new sections added

**Gates:**
- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS
- `pnpm vitest run tests/qa/wave-110/subagent-body-completeness.test.ts` → 12/12 PASS
- `pnpm vitest run tests/qa/wave-111/pass-verdict-format.test.ts` → 21/21 PASS
- `pnpm lint` → clean
- `pnpm type-check` → clean

**Token discipline:** new sections describe classes (OIDC federation, policy-as-code) without using any ADR-017 denylisted tokens. Cleanliness test confirms this mechanically.

---

## PREV — 2026-06-04 (Wave 110)

### Wave 110 — CI hook eval (Deliverable C)

**Verdict: Already covered — no new path-conditional job needed.**

`ci.yml` runs `pnpm test:run` globally on every push and PR (`branches: ["**"]`). Vitest globs `tests/**`, which includes `tests/qa/wave-108/subagent-body-cleanliness.test.ts`. Test runs clean locally (153 tests, 124ms). A path-conditional job filtering on `.claude/agents/` changes would not save wall-clock (the global `Tests` job runs regardless), would add YAML complexity, and would produce a duplicate failure signal. The generic "Tests" job failure on an agent-body violation is sufficient — the failing test name makes the cause clear from the test output. No new job added.

### Wave 110 — ops/README.md rewrite (Deliverable D, closes #380)

**Files touched:**
- `ops/README.md` — full rewrite for Plan C runtime

**Retired content removed:**
- Environments table (`:3100/:3110/:3120/:3130` ports, `pnpm dev:test:*` scripts)
- Per-role isolated work section (`pnpm branch:start`, `pnpm branch:cleanup`, worktree workflows)
- `.restart-trigger` reference from merge + deploy flow
- `pnpm fold-handoff` / `_handoff-pending/` references
- `scripts/post-deploy-smoke.mjs` + `pnpm smoke` references (script does not exist)
- `APEX_MCP_URL`, `APEX_TEAM_DB_PATH` env vars (no server to connect to)

**Plan C equivalents added:**
- Runtime table: `coordination/handoffs/<role-id>.md`, Agent tool invocation, `pnpm vitest run`, `scripts/install-agents-user-scope.sh`
- Cross-links to `architecture/workspace-conventions.md` and `architecture/decisions/ADR-017-subagent-body-rewrite-rules.md`
- `pr-hygiene.yml` documented in pipeline table (was missing from old README)

**Preserved accurate sections:**
- `## Secrets` (trimmed to Plan C-relevant vars only)
- `## Pipeline & security tooling` (all 4 active workflows + 2 hooks confirmed)
- `## Branch protection (US-006)`
- `## Portable workspace bootstrap (US-007)` (bootstrap script verified clean — no retired command refs)
- `## Infrastructure as Code (IaC)` (updated prose for subagent runtime)

**Follow-up issues filed:** none. Bootstrap script stub is generic and accurate. No new operational procedures needed.

## Done (prior waves)

- **Wave 107 PR #376** — `fix(ci): prevent shell injection in pr-hygiene.yml body validation`
  - Commit: `903fb62`
  - Branch: `feature/375-pr-hygiene-injection-fix`
  - Closes issue #375

## Notes

- Gates clean: `pnpm lint` (0 warnings), `pnpm type-check` (0 errors), `pnpm test:run` (153 passed)
- Wave-108 cleanliness test (153 tests) still passes — `ops/README.md` does not touch `.claude/agents/*.md`
- No Architect co-authorship gate: `architecture/` not touched this wave
