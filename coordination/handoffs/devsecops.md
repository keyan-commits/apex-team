# DevSecOps — HANDOFF (Wave 111c)

## ⏭️ NOW — 2026-06-04 (Wave 111c)

### Wave-111 PASS verdict — PR #0 — SHA 10c002b723ea2da2e757e57ab42f832253310c0b

- **Gate role:** devsecops
- **Timestamp:** 2026-06-04T12:00:00Z
- **Notes:** Wave 111c deliverables AC1-AC5 complete (PR #388 open). PR #0 is commit-time placeholder per ADR-018 Wave 111b amendment; SHA is branch HEAD at commit time. DevSecOps backfills real PR # and merge SHA post-merge with `chore(handoff): backfill Wave-111c verdict PR # and merge SHA`.

### Wave 111c — Cluster 4 CI/process discipline (#240, #246, #301, #324) + Wave 111a/111b verdict backfills

**Issues addressed:**

- **AC1 / #240** — `gh pr checks` step added to `.claude/agents/devsecops.md` merge protocol (step 2a). Command: `gh pr checks <PR#> --watch`. Pending/in-progress/fail = hard blocker; skipped = OK.

- **AC2 / #246** — New workflow `.github/workflows/ux-gate-check.yml`. Fires on PRs touching `src/**`, `design/**`, and `tests/qa/wave-*/ui-*` / `ux-*`. Greps `coordination/handoffs/ux-designer.md` for ADR-018 canonical UX PASS verdict matching PR# + HEAD SHA (or reachable-ancestor placeholder per ADR-018 Wave 111b amendment). Fails PR if missing. `[skip-ux-gate]` override in PR title/body bypasses for emergencies.

- **AC3 / #301** — `gh pr merge --delete-branch` anomalous-closure playbook added to `.claude/agents/devsecops.md` under new section `### \`gh pr merge --delete-branch\` anomalous-closure playbook`. Matching LESSONS.md entry added (newest-first, top of 2026-06-04 block).

- **AC4 / #324** — `pnpm outdated` returned no output (no outdated deps). Closing #324 with comment: snapshot from Wave 98 is stale; current lockfile is clean.

- **AC5 — ADR-018 CI wiring:** New workflow `.github/workflows/pass-verdict-format-check.yml`. Separate job (PO lean toward (b) accepted). Checks: (1) format check — Wave-111+ verdict headings in `coordination/handoffs/*.md` match canonical regex, line-by-line failure output; (2) placeholder TTL check — soft-warn on PR #0 placeholders for PRs merged >1h ago.

- **AC5 — Wave 111a backfill:** `coordination/handoffs/qa.md` line 69: `### Wave-111 PASS verdict — PR #0 — SHA cae4a773...` → `### Wave-111 PASS verdict — PR #386 — SHA a16c924739eddf928f63a257abdd77fbfa6fb1f8`.

- **AC5 — Wave 111b backfill:** `coordination/handoffs/qa.md` line 3: `### Wave 111b PASS verdict — PR #0 — SHA 09d3d16c...` (non-canonical: space not hyphen, alpha suffix) → normalized to `### Wave-111 PASS verdict — PR #387 — SHA ba0905fc75ca9788cef538e0eab078040336384a`. Alpha-suffix decision: kept regex strict (`\d{1,4}` only); normalized heading to `Wave-111` and distinguished by PR# (#386 vs #387). HANDOFF to Architect to ratify this interpretation (or amend ADR-018 to allow alpha suffixes) filed below.

**Alpha-suffix spec gap decision:**
The Wave 111b verdict used `### Wave 111b PASS verdict` (space + alpha). The ADR-018 canonical regex `Wave-(\d{1,4})` requires a hyphen and pure digits. Two options considered: (i) update ADR-018 to allow optional alpha suffix in wave field; (ii) normalize existing verdicts to pure-digit form and distinguish by PR#. Chose (ii) for this PR: one Wave-111 entry per PR (PR #386 = 111a, PR #387 = 111b), regex unchanged, no ADR edit needed. Filed HANDOFF to Architect to ratify. If Architect prefers (i), ADR-018 amendment + test update in a follow-up.

**Files touched:**
- `.claude/agents/devsecops.md` — AC1 step 2a + AC3 playbook section
- `.github/workflows/ux-gate-check.yml` — new (AC2)
- `.github/workflows/pass-verdict-format-check.yml` — new (AC5)
- `LESSONS.md` — AC3 entry (newest-first)
- `coordination/handoffs/qa.md` — Wave 111a + 111b backfills (AC5)
- `coordination/handoffs/devsecops.md` — this file (Wave 111c state + PASS verdict)

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
