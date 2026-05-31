# apex-team ops

DevSecOps lane: CI config, deployment manifests, secrets documentation, and runtime security.

## Environments

| Port | Script | DB | Purpose |
|---|---|---|---|
| **3000** | `pnpm dev` | `data/apex-team.db` | **Live instance** — user's validation environment |
| **3100** | `pnpm dev:test:qa` | `data/apex-team-test-qa.db` | QA verification instance |
| **3110** | `pnpm dev:test:ui` | `data/apex-team-test-ui.db` | UI Developer isolated instance |
| **3120** | `pnpm dev:test:be` | `data/apex-team-test-be.db` | BE Developer isolated instance |
| **3130** | `pnpm dev:test:ux` | `data/apex-team-test-ux.db` | UX Designer review instance |

The legacy `pnpm dev:test` (port 3100, `data/apex-team-test.db`) remains for backward compat but new waves should use `pnpm dev:test:qa`.

## Per-role isolated work (ADR-002)

### Branch + worktree creation

Implementers start every wave with:

```bash
pnpm branch:start <role> <wave>-<short>
# e.g. pnpm branch:start ui-developer 10a-workflow-ui
# Creates ../apex-team-ui-developer-10a-workflow-ui/ + feature/10a-workflow-ui branch
```

Valid roles: `ui-developer | backend-developer | qa | ux-designer`

Requires: clean working tree, current branch is `main`. Fetches `origin/main` before creating the branch.

Branch naming convention: `feature/<wave>-<short>` (lowercase, hyphens only).

Each worktree is a physical filesystem clone at `../apex-team-<role>-<short>` — multiple implementers can work in parallel without seeing each other's uncommitted files.

After creating, `cd` into the worktree and run `pnpm install` once before starting the dev server.

### Worktree cleanup (DevSecOps post-deploy)

```bash
pnpm branch:cleanup <role> <wave>-<short>
# Removes worktree; deletes feature branch if merged into main.
```

Run this after `git push origin main` confirms the merge is live.

### UI Developer workflow

1. `pnpm branch:start ui-developer <wave>-<short>` — create worktree + branch
2. `cd ../apex-team-ui-developer-<short> && pnpm install`
3. `pnpm dev:test:ui` — spin up on port 3110 with isolated DB
4. Implement + write unit tests in `tests/ui/`
5. `pnpm test:run` must pass locally
6. HANDOFF to QA + UX Designer (if UI changes)
7. Do NOT push to main — HANDOFF to DevSecOps with PASS evidence

### BE Developer workflow

1. `pnpm branch:start backend-developer <wave>-<short>` — create worktree + branch
2. `cd ../apex-team-backend-developer-<short> && pnpm install`
3. `pnpm dev:test:be` — spin up on port 3120 with isolated DB
4. Implement + write unit tests in `tests/be/`
5. `pnpm test:run` must pass locally
6. HANDOFF to QA
7. Do NOT push to main — HANDOFF to DevSecOps with PASS evidence

### QA workflow

1. Receive HANDOFF from implementer(s) with UX PASS evidence (if UI)
2. `pnpm dev:test:qa` — spin up on port 3100
3. Exercise changes against BA's acceptance criteria in `requirements/user-stories/`
4. Return PASS (with evidence) or FAIL (with repro) to DevSecOps

### UX Designer workflow

1. Receive HANDOFF from UI implementer
2. `pnpm dev:test:ux` — spin up on port 3130 for visual review
3. Verify against spec in `<workspace>/design/INDEX.md`
4. Return PASS or REVISE to implementer; final PASS goes to DevSecOps

## DevSecOps merge + deploy flow

DevSecOps is the **sole agent authorized** to merge feature branches to main and push to `origin/main`.

**Trigger:** HANDOFF from QA with PASS evidence (+ UX PASS if UI changes).

**Steps:**

```bash
# 1. Switch to main + pull latest
git checkout main
git pull origin main

# 2. Merge the feature branch (no-fast-forward to preserve history)
git merge --no-ff feature/<wave>-<short>

# 3. Run type-check + tests
pnpm type-check
pnpm test:run

# 4. Push to origin/main (the live user instance picks this up)
git push origin main

# 5. If MCP-side modules changed, trigger restart
echo "$(date -u +%s)" >> .restart-trigger
```

**Rollback:** if the live instance shows regressions after deploy, `git revert HEAD` + push. No force-push.

## Secrets

No secrets are committed to source. The only non-default env vars are:

| Var | Where it lives | Purpose |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | `.env.local` (gitignored) | Gemini agents |
| `GROQ_API_KEY` | `.env.local` (gitignored) | Groq agents |
| `APEX_MCP_URL` | `.env.local` or shell | apex-engine override |
| `APEX_TEAM_DB_PATH` | Script env vars only | Per-instance DB path |

All `.env*.local` files are gitignored. Never commit them.

## Pipeline & security tooling

Implemented in Wave 10b (US-002, ADR-002). DevSecOps owns all artifacts below — the only path to change pipeline behavior is a PR touching `ops/` or `.github/`.

| Artifact | Purpose |
|---|---|
| `.github/workflows/ci.yml` | Runs `pnpm type-check` + `pnpm test:run` + `pnpm lint` on every PR and push. Lint is `continue-on-error` pending next-lint → standalone ESLint migration. |
| `.github/workflows/codeql.yml` | GitHub SAST for JS/TS — weekly cron + push to main. Findings appear in the Security tab. No secrets required beyond auto-injected `GITHUB_TOKEN`. |
| `.github/dependabot.yml` | Weekly CVE scan of npm deps. Minor + patch updates grouped into one PR to reduce noise. Critical CVEs in direct deps block merge until patched. |
| `scripts/post-deploy-smoke.mjs` | Post-deploy health check. Curls `localhost:3000/api/health`, validates `status=ok` and `mcpMounted=true`. Run via `pnpm smoke`. |
| `scripts/git-hooks/pre-commit` | Gitleaks secrets scan on staged files (see below). Also enforces HANDOFF.md update + INDEX.yaml integrity. |

### Gitleaks setup (one-time, per machine)

```bash
brew install gitleaks
```

The pre-commit hook runs `gitleaks protect --staged --no-banner` automatically if gitleaks is installed. If it is NOT installed, the hook skips silently — install it to get the secret-leak protection guarantee. A commit containing a detected secret will be rejected.

### Post-deploy smoke test

After every merge + deploy, run:

```bash
pnpm smoke
```

Exits 0 if the server is healthy, 1 with a descriptive error message if not. If it fails: check `pnpm dev` terminal output; rollback with `git revert HEAD && git push origin main` if the deploy is the cause.

### CI secrets

The CI workflows use only `GITHUB_TOKEN` (auto-injected by GitHub Actions). No additional secrets are required.
