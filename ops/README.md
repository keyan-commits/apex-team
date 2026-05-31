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

### Branch creation

Implementers start every wave with:

```bash
pnpm branch:start <wave>-<short>
# e.g. pnpm branch:start 10a-workflow-ui
# Creates feature/10a-workflow-ui from latest main
```

Requires: clean working tree, current branch is `main`.

Branch naming convention: `feature/<wave>-<short>` (lowercase, hyphens only).

### UI Developer workflow

1. `pnpm branch:start <wave>-<short>` — create branch
2. `pnpm dev:test:ui` — spin up on port 3110 with isolated DB
3. Implement + write unit tests in `tests/ui/`
4. `pnpm test:run` must pass locally
5. HANDOFF to QA + UX Designer (if UI changes)
6. Do NOT push — HANDOFF to DevSecOps with PASS evidence

### BE Developer workflow

1. `pnpm branch:start <wave>-<short>` — create branch
2. `pnpm dev:test:be` — spin up on port 3120 with isolated DB
3. Implement + write unit tests in `tests/be/`
4. `pnpm test:run` must pass locally
5. HANDOFF to QA
6. Do NOT push — HANDOFF to DevSecOps with PASS evidence

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

## CI/CD status

No GH Actions workflow is active. `ANTHROPIC_API_KEY` is unavailable for CI (Claude agents use local OAuth only). Manual wave cadence is the current deploy pattern.

## Security scan config

See `ops/security/scan-config.md` (not yet created — pending Dependabot/Renovate setup).
