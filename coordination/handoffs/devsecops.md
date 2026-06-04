# DevSecOps — HANDOFF (Wave 110)

## ⏭️ NOW — 2026-06-04 (Wave 110)

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
