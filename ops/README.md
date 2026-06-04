# apex-team ops

DevSecOps lane: CI config, secrets documentation, and runtime security.

**Architecture references:**
- Directory ownership contract: [`architecture/workspace-conventions.md`](../architecture/workspace-conventions.md)
- Subagent body rewrite rules: [`architecture/decisions/ADR-017-subagent-body-rewrite-rules.md`](../architecture/decisions/ADR-017-subagent-body-rewrite-rules.md)

## Runtime (Plan C — Wave 106+)

apex-team runs as **8 Claude Code subagents**. There is no dev server, no MCP server, no health endpoint, and no database. The subagents are files under `.claude/agents/<role-id>.md`.

| Concept | Under Plan C |
|---|---|
| Per-role working state | `coordination/handoffs/<role-id>.md` — direct file edits, no fragment fold step |
| Subagent invocation | Outer Claude Code session uses the `Agent` tool with `subagent_type: <role-id>` |
| Tests | `pnpm vitest run tests/qa/wave-NNN/<test>.test.ts` (or `pnpm test:run` for all) |
| User-scope install | `bash scripts/install-agents-user-scope.sh` — symlinks `.claude/agents/` into `~/.claude/agents/` |

**Retired (removed Wave 106):** ports `:3100/:3110/:3120/:3130`, `pnpm dev:test:qa|ui|be|ux`, `pnpm dev:supervised`, `.restart-trigger`, `pnpm branch:start`, `pnpm branch:cleanup`, `pnpm fold-handoff`, `_handoff-pending/`. These commands and files do not exist; do not reference them.

## DevSecOps merge + deploy flow

DevSecOps is the **sole agent authorized** to merge feature branches to main and push to `origin/main`.

**Trigger:** HANDOFF from QA with PASS evidence (+ gate-role PASS as specified in `.claude/agents/devsecops.md` §"Deployment workflow"). See that file for the canonical step sequence — `ops/README.md` is the human-doc view; the agent file is the authoritative runtime contract.

**Steps:**

```bash
# 1. Fetch + verify main is up to date
git fetch origin
git checkout main && git pull origin main

# 2. Merge the feature branch (no-fast-forward to preserve history)
git merge --no-ff feature/<wave>-<short>

# 3. Run type-check + tests
pnpm type-check
pnpm test:run

# 4. Push to origin/main
git push origin main
```

**Rollback:** `git revert HEAD && git push origin main`. No force-push. The revert commit is the rollback record.

**HANDOFF-in-PR invariant:** the wave's HANDOFF doc refresh ships inside the code PR. Never a separate doc-only PR after merge.

## Secrets

No secrets are committed to source. The only non-default env vars are:

| Var | Where it lives | Purpose |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | `.env.local` (gitignored) | Gemini agents (legacy; no active usage under Plan C) |
| `GROQ_API_KEY` | `.env.local` (gitignored) | Groq agents (legacy; no active usage under Plan C) |

All `.env*.local` files are gitignored. Never commit them. `GITHUB_TOKEN` is the only secret used in CI workflows (auto-injected by GitHub Actions; no additional secrets required).

## Pipeline & security tooling

DevSecOps owns all artifacts below. The only path to change pipeline behavior is a PR touching `ops/` or `.github/`.

| Artifact | Purpose |
|---|---|
| `.github/workflows/ci.yml` | Runs `pnpm lint`, `pnpm audit --audit-level moderate`, `pnpm type-check`, `pnpm test:run` on every push and PR. Audit is `continue-on-error` so transient registry failures don't block PRs. Also runs a dedicated `merge-driver-test` job verifying `merge=union` on `HANDOFF.md`. |
| `.github/workflows/codeql.yml` | CodeQL SAST for JS/TS. Runs on push to main + weekly Monday 05:30 UTC. Free because the repo is public. |
| `.github/workflows/pr-hygiene.yml` | Validates PR body close-keyword syntax — rejects comma-list refs like `closes #123, #456` (GitHub only auto-closes the first). Fires on `pull_request` opened/edited events. |
| `.github/dependabot.yml` | Weekly CVE scan of npm deps. Minor + patch updates grouped into one PR to reduce noise. Critical CVEs in direct deps block merge until patched. |
| `scripts/git-hooks/pre-commit` | Type-check + gitleaks secrets scan on staged files (see below). Also enforces HANDOFF.md update + INDEX.yaml integrity. |
| `scripts/git-hooks/pre-push` | Blocks direct pushes to `origin/main` from non-DevSecOps contexts — first line of defense before GitHub branch protection. |

### CodeQL note

Originally shipped in `88fd8d1`, briefly removed in `983e817` (the repo was private and lacked GHAS), restored after the user made the repo public. Free for public repos; if the repo ever goes private again, this workflow will fail until GHAS is enabled or the workflow is removed again.

### Post-public-switch gitleaks history audit

Full git history scan run **2026-05-31** after the repo was made public.

- Tool: `gitleaks detect --source . --redact` (v8.x)
- Scope: 140 commits, ~865 KB
- Result: **CLEAN — no leaks found** (`[]` JSON report, exit 0)

No secrets, API keys, tokens, or credentials detected anywhere in commit history. Safe to remain public.

### Gitleaks setup (one-time, per machine)

```bash
brew install gitleaks
```

The pre-commit hook runs `gitleaks protect --staged --no-banner` automatically if gitleaks is installed. If it is NOT installed, the hook skips silently — install it to get the secret-leak protection guarantee. A commit containing a detected secret will be rejected.

### CI secrets

The CI workflows use only `GITHUB_TOKEN` (auto-injected by GitHub Actions). No additional secrets are required.

## Infrastructure as Code (IaC)

**Not applicable for apex-team.** This project runs as Claude Code subagents on a single Mac with no cloud infrastructure, no remote servers, no VPCs, and no managed databases. There is nothing to provision with Terraform, Pulumi, CDK, or equivalent tooling. The "infrastructure" is: one Mac, one repo, subagent files on disk.

If apex-team ever acquires remote infra (a staging server, a hosted deployment, a managed database), DevSecOps will open an ADR to select an IaC tool and provision it under `ops/infra/`. Until that happens, this section serves as the explicit record that IaC was considered and deliberately deferred.

*Decision recorded per US-002 AC5 and ADR-002.*

## Branch protection (US-006)

Branch protection for `origin/main` is documented in `ops/branch-protection-payload.json`. The payload enforces:

- `enforce_admins: true` — no direct push, even for the repo owner
- `required_status_checks.contexts: ["build"]` — CI must pass before merge
- `strict: true` — feature branch must be up-to-date with main before merging
- `allow_force_pushes: false` — history is immutable
- `allow_deletions: false` — main cannot be deleted

**To apply (user must run manually — requires explicit consent per OQ-007):**

```bash
gh api -X PUT /repos/keyan-commits/apex-team/branches/main/protection \
  --input ops/branch-protection-payload.json
```

Requires `gh` CLI authenticated with a token that has `repo` scope. If `gh` is not available or lacks the scope, run the equivalent `curl` command:

```bash
curl -X PUT \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/keyan-commits/apex-team/branches/main/protection \
  --data-binary @ops/branch-protection-payload.json
```

The local pre-push hook (`scripts/git-hooks/pre-push`) blocks direct pushes to `origin/main` regardless of whether GitHub-side protection is active — it is the first line of defense. GitHub branch protection is the second line (catches `--no-verify` bypasses and pushes from non-hook environments).

## Portable workspace bootstrap (US-007)

`scripts/devsecops/bootstrap-workspace.mjs` packages the apex-team enforcement recipe so any git workspace inherits it with one command.

```bash
pnpm devsecops:bootstrap-workspace [workspace-path]
# defaults to cwd if workspace-path is omitted
```

### What it does (in order)

1. **Validates** the workspace is a clean git repo (refuses dirty trees).
2. **Installs hooks** — copies `scripts/git-hooks/pre-commit` and `pre-push` into `<workspace>/scripts/git-hooks/`, then sets `git config core.hooksPath scripts/git-hooks`. If a hook already exists and differs from the source, it shows a diff and prompts before overwriting.
3. **Installs a CI workflow stub** (Node workspaces only) — writes `.github/workflows/ci.yml` if absent. Uses the workspace's `scripts.test` and `scripts.lint` if defined; otherwise stubs with echo commands. Non-Node workspaces (no `package.json`) are skipped with a note.
4. **Applies branch protection** (interactive) — prints the full JSON payload, then prompts `[y/N]` before running `gh api -X PUT /repos/<owner>/<repo>/branches/main/protection`. If `gh` fails (e.g. missing scope), falls back to printing the `gh` command and a `curl` equivalent for manual application.
5. **Creates `ops/README.md`** — writes a minimal stub noting "bootstrapped from apex-team on `<date>`" if the file is absent.

### Idempotency

Every step checks its own precondition before applying. Re-running on the same workspace produces only "skip" log lines and exits 0.

### Non-Node workspaces

Steps 1–2 and 4–5 work on any git repo. Step 3 (CI workflow) is skipped with a log message if there is no `package.json`.

### Branch protection requires `gh` scope

`gh api -X PUT /repos/…/branches/…/protection` needs a `gh` token with `repo` scope. If missing:

```bash
gh auth refresh -h github.com -s repo
```

The script never auto-applies branch protection — explicit `y` at the prompt is always required.
