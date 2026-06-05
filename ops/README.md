# apex-team ops

## Reusable pipeline templates + CLI runners (Wave 124 — FEAT-0003)

Three environment pipeline templates live at `ops/pipelines/`:

| Template | Ticket | Purpose |
|---|---|---|
| `ops/pipelines/dev.sh` | OPS-0001 | Dev: lint + type-check + test |
| `ops/pipelines/staging.sh` | OPS-0002 | Staging: lint + type-check + test + build + deploy-preview |
| `ops/pipelines/prod.sh` | OPS-0003 | Prod: all stages + sign + deploy-dry-run + approval gate |
| `ops/pipelines/_template.sh` | — | Copy-paste skeleton for new environments (NOT executable) |

Each template is a POSIX shell script, executable by any POSIX-compatible shell.

### Direct invocation (no Claude Code required)

```sh
# Run the dev pipeline (base steps only — no feature overlay)
sh ops/pipelines/dev.sh

# Run the dev pipeline with a per-feature overlay
sh ops/pipelines/dev.sh FEAT-0001

# Run staging or prod
sh ops/pipelines/staging.sh FEAT-0003
sh ops/pipelines/prod.sh FEAT-0003
```

### pnpm runner invocation

```sh
# DevSecOps pipeline runner
pnpm run ops:run --env=dev --feat=FEAT-0001
pnpm run ops:run --env=staging --feat=FEAT-0003
pnpm run ops:run --env=prod --feat=FEAT-0003

# QA test runner for a specific feature
pnpm run qa:feat --feat=FEAT-0001
pnpm run qa:feat --feat=FEAT-0003
```

Both runners are implemented as Node.js scripts in `scripts/ops-run.mjs` and `scripts/qa-feat.mjs`.

### Per-feature overlay convention

Feature-scoped pipeline customisations live at:

```
ops/features/FEAT-XXXX-<slug>/OPS-NNNN-<slug>.sh
```

Mandatory frontmatter at the top of every overlay file (after the shebang):

```sh
# ticket: OPS-NNNN
# parent_feat: FEAT-XXXX
# parent_us: US-NNN
# role: devsecops
# status: proposed | accepted | in-flight | done
```

The pipeline template sources each `*.sh` file in the feature's overlay directory automatically. Overlays can extend base steps, set additional env vars, or skip steps via guard flags. If no overlay directory exists, the pipeline runs base steps only — no error.

To create a new overlay:

1. Allocate the next `OPS-NNNN` number from `ops/features/INDEX.md`.
2. Create `ops/features/FEAT-XXXX-<slug>/OPS-NNNN-<slug>.sh`.
3. Add the mandatory frontmatter.
4. Implement your feature-specific pipeline additions.
5. Add a row to `ops/features/INDEX.md`.

### Adding a new environment pipeline

1. Copy `ops/pipelines/_template.sh` to `ops/pipelines/<env>.sh`.
2. Fill in the `ticket:`, `parent_feat:`, `parent_us:` frontmatter.
3. Set `ENV_NAME="<env>"` and implement the base step functions.
4. Run `chmod +x ops/pipelines/<env>.sh`.
5. Document the new env in this README.

### Scaffolding vs live pipeline

Templates ship as **scaffolding**: placeholder step-function stubs with commented-out commands, not wired to a real CI vendor. Existing features (FEAT-0001 Grouping Convention, FEAT-0002 Viewer Rendering) do **not** get real pipeline overlays until there is something to deploy.

When a project needs real pipelines (cloud deploy, artifact publish, container push), DevSecOps authors feature overlays at that time. The templates provide the skeleton; the overlays provide the substance. Specific cloud or CI vendor wiring (GitHub Actions YAML, GitLab CI, AWS Pipelines) is a per-feature overlay concern — out of scope for the scaffolding itself.

---

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
| `.github/workflows/ci.yml` | Runs `pnpm lint`, `pnpm audit --audit-level moderate`, `pnpm type-check`, `pnpm test:run` on every push and PR. Audit is `continue-on-error` so transient registry failures don't block PRs. Also runs `merge-driver-test` (union-merge fitness) and `actionlint` (workflow lint / shell-injection gate). |
| `.github/workflows/codeql.yml` | CodeQL SAST for JS/TS. Runs on push to main + weekly Monday 05:30 UTC. Free because the repo is public. |
| `.github/workflows/pr-hygiene.yml` | Validates PR body close-keyword syntax — rejects comma-list refs like `closes #123, #456` (GitHub only auto-closes the first). Fires on `pull_request` opened/edited events. |
| `.github/workflows/ux-gate-check.yml` | Verifies ADR-018 UX PASS verdict in `coordination/handoffs/ux-designer.md` before merging UI-touching PRs. |
| `.github/workflows/pass-verdict-format-check.yml` | Verifies ADR-018 verdict heading format on `coordination/handoffs/*.md` changes. Soft-warns on overdue PR #0 backfills (via `scripts/check-placeholder-ttl.py`). |
| `.github/dependabot.yml` | Weekly CVE scan of npm deps. Minor + patch updates grouped into one PR to reduce noise. Critical CVEs in direct deps block merge until patched. |
| `.githooks/pre-commit` | Lint + type-check gates on staged files. Requires `coordination/handoffs/<role>.md` edit (or root `HANDOFF.md`) on commits touching source, scripts, tests, CI, or agent files. |
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

## FEAT Backfill Command (FEAT-0005 — Wave 126)

`scripts/feat-backfill.mjs` retroactively groups existing workspace artifacts under FEAT-XXXX
identifiers by injecting YAML frontmatter. It follows a two-phase flow so the user reviews
proposed changes before any workspace files are mutated.

### Command surface

```bash
pnpm run feat:backfill [--all | --feat=FEAT-XXXX] [--role=<r>...] [--apply] [--out=<path>] [--workspace=<path>]
```

| Flag | Description |
|---|---|
| `--all` | Scan all roles for all known FEATs + ungrouped assets |
| `--feat=FEAT-XXXX` | Scope to one feature only (FEAT file must pre-exist) |
| `--role=<r>` | Restrict to listed roles (repeatable); valid: `business-analyst`, `architect`, `ux-designer`, `qa`, `devsecops`, `ui-developer`, `backend-developer` |
| `--apply` | Write frontmatter mutations; omit = dry-run (default) |
| `--out=<path>` | Override output directory (default: `<workspace>/coordination/feat-backfill/`) |
| `--workspace=<path>` | Operate on a different workspace root (default: `git rev-parse --show-toplevel`) |
| `--proposal=<path>` | Bind `--apply` to a specific proposal JSON file |

Calling with neither `--all` nor `--feat=FEAT-XXXX` prints usage and exits non-zero.

### Two-phase flow

**Phase 1 (dry-run, default):**

1. Resolves workspace root from `--workspace` or git toplevel.
2. Detects Plan C shape: no `src/`, has `.claude/agents/` → uses `frontend/` + `backend/` for FE/BE Dev.
3. Walks each role's owned directory; reads file frontmatter via regex (fail-soft on malformed YAML).
4. Groups files into already-grouped (has `parent_feat:` / `feat:`) vs ungrouped.
5. Applies heuristic FEAT assignment to ungrouped files; ungroupable files go to the `## Ungrouped` bucket.
6. Runs reconciliation: lower FEAT number wins on conflicts (NFR-007).
7. Emits:
   - `coordination/feat-backfill/proposal-<ISO>.md` — human-readable proposal report
   - `coordination/feat-backfill/proposal-<ISO>.json` — machine-readable manifest (`--apply` reads this)
   - `coordination/feat-backfill/dispatch-plan-<ISO>.md` — per-role subagent briefs for outer Claude Code session
   - `coordination/feat-backfill/dispatch/<role>-<ISO>.md` — individual role briefs
   - Appends to `coordination/feat-backfill/audit.log`
8. Prints counts + file paths + next steps to stdout.

**Phase 2 (`--apply`):**

1. Phase 1 runs first (always emits fresh proposal for audit context).
2. Reads most recent `proposal-*.json` (or `--proposal=<path>`).
3. Merges any subagent response files from `coordination/feat-backfill/responses/`.
4. Injects `feat:` + `parent_feat:` into each matched file (idempotent: skip if already set).
5. On Plan C workspaces: seeds retroactive FE summary docs at `frontend/features/FEAT-NNNN-<slug>/FE-NNNN-<slug>.md` for Waves 119, 121, 123, 125.
6. Updates each role's INDEX (de-dup by ticket id).
7. Appends all actions to `coordination/feat-backfill/audit.log`.

### Plan C clause

When the workspace has no `src/` directory but has `.claude/agents/` (Plan C shape — e.g. apex-team itself):

- `ui-developer` owned directory is `frontend/` (not `src/`)
- `backend-developer` owned directory is `backend/` (not `src/`)
- FE retro summary docs are seeded at `frontend/features/FEAT-NNNN-<slug>/FE-NNNN-<slug>.md`
- BE retro summary docs would be seeded at `backend/features/FEAT-NNNN-<slug>/BE-NNNN-<slug>.md`

If `frontend/` or `backend/` is absent in dry-run mode, the proposal reports:
`"Plan C workspace detected; frontend/ or backend/ does not yet exist — retro FE/BE summary docs cannot be scanned but can be seeded by AC15."`

### Cross-workspace invocation

The script works on any workspace that follows the standard directory layout:

```bash
node /path/to/apex-team/scripts/feat-backfill.mjs \
  --workspace=/path/to/other/repo \
  --all \
  --apply
```

No apex-team-specific path assumptions are hardcoded in workspace resolution.

### NFR adherence

| NFR | Enforcement |
|---|---|
| NFR-001 idempotence | Second `--apply` on same proposal = same on-disk state; audit log appends no-op rows |
| NFR-002 dry-run safety | Without `--apply`, zero writes outside `coordination/feat-backfill/` |
| NFR-003 orchestration boundary | Script does all FS IO; subagents return proposals to `responses/`; script parses and applies |
| NFR-004 cross-workspace portability | `--workspace` flag; tolerates any subset of canonical dirs |
| NFR-005 audit log | Append-only TSV at `coordination/feat-backfill/audit.log` |
| NFR-006 forbidden surfaces | No file moves, renames, FEAT renumbering, `.claude/agents/` edits, HANDOFF edits, git ops, network |
| NFR-007 conflict resolution | Lower FEAT number wins; voided FEAT logged as `propose-conflict` |
| NFR-008 fail-soft | Malformed frontmatter → `error` audit row + file skipped; run continues |

### OPS ticket

OPS-0004 — `ops/features/FEAT-0005-feat-backfill-command/OPS-0004-feat-backfill-script.md`

---

## Status reconciliation

### Problem

When a wave ships, QA test files and requirement files carry `status: in-flight` in their
frontmatter. The merge itself does not update this field — it requires a separate edit in
the same PR. When that edit is missed, viewer badges stay `IN-FLIGHT` for merged waves, giving
the false impression that work is still pending.

This is a **process gap**, not a viewer bug. The reconcile script closes the gap on demand and
can be wired into CI as a periodic drift check.

### Command

```bash
pnpm run status:reconcile [--dry-run] [--workspace=<path>] [--apply] [--bump-accepted]
```

| Flag | Description |
|---|---|
| _(none)_ / `--dry-run` | Scan + report. Writes only to `coordination/status-reconcile/`. No role-owned files written. |
| `--apply` | Rewrite `status: in-flight` → `status: done` for every file whose parent PR is merged. Idempotent. |
| `--bump-accepted` | Also bump `status: accepted` → `done` when parent PR merged. Default off. |
| `--workspace=<path>` | Operate on a different workspace root. Default: `git rev-parse --show-toplevel`. |

### Algorithm

For every `.md` / `.test.ts` / `.test.tsx` / `.spec.ts` / `.spec.tsx` / `Test.java` / `Tests.java`
file in `tests/qa/features/**/`, `requirements/features/**/`, `requirements/user-stories/`,
`architecture/features/**/`, `design/features/**/`, `frontend/features/**/`, `backend/features/**/`,
`ops/features/**/`:

1. Parse frontmatter (YAML `---` block or `// key: value` line-comment header).
2. If `status: in-flight` (or `accepted` with `--bump-accepted`):
3. Find the parent PR via `git log --follow <file>` → oldest commit → `git log --merges
   --ancestry-path <sha>..HEAD` → extract `Merge pull request #NNN`.
4. Query `gh pr view <N> --json state,mergedAt` to confirm merged.
5. If merged: rewrite `status:` to `done`. All other frontmatter preserved.
6. Append audit row to `coordination/status-reconcile/audit.log`
   (TSV: `ts | file | old_status | new_status | pr_number | merge_sha`).

### Skip rules (never touched)

- `requirements/samples/**` — fixture files carry intentional `status: in-flight`.
- `_archive/**` — archived artifacts.
- `coordination/feat-backfill/**` — feat-backfill runtime artifacts.
- `coordination/status-reconcile/**` — own output directory.

### Idempotence

Re-running `--apply` on an already-reconciled workspace is a no-op. Each file is only written if
its current status differs from the target (`done`).

### Drift rule

> A `status: in-flight` badge visible in the viewer for a wave whose PR merged more than 24 h ago
> is process drift. Run `pnpm run status:reconcile --apply` to close it.

### Cross-workspace

The script works on any workspace with the standard directory layout:

```bash
pnpm run status:reconcile --apply --workspace=/path/to/other-repo
# or directly:
node /path/to/apex-team/scripts/status-reconcile.mjs --apply --workspace=/path/to/other-repo
```
