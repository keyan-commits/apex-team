# US-007 — Portable workflow bootstrap for external workspaces

**Status:** done
**Owner role:** devsecops
**Created:** 2026-05-31
**Story ID:** US-007

---

## Narrative

As a DevSecOps engineer, I want a single command (`pnpm devsecops:bootstrap-workspace <path>`) that installs the same branch-protection posture apex-team uses onto any external workspace (e.g. `/Users/nikoe/Development/Study/my-finances`), so that ADR-002 enforcement travels with the team wherever they work — without requiring manual setup per project.

## Background

Apex-team operates on multiple projects (apex-team itself, b2b-* on the user's other Mac, future workspace targets). US-006 establishes the enforcement recipe for apex-team. US-007 packages that recipe as a portable, idempotent bootstrap script so it can be applied to any git repo the team is directed at. Depends on US-006 (recipe must exist before it can be packaged).

References: US-006, ADR-002, `src/lib/protocols.ts`, Wave 13 BA dispatch. OQ-006 + OQ-007 are open non-blocking.

## Acceptance Criteria

- **AC1 — Install hooks in external workspace:** Given a workspace path pointing to any git repo (e.g. `/Users/nikoe/Development/Study/my-finances`), when `pnpm devsecops:bootstrap-workspace <path>` is run, then the same `pre-commit` and `pre-push` hook files from apex-team's `scripts/git-hooks/` are copied into `<workspace>/scripts/git-hooks/` AND `git -C <path> config core.hooksPath scripts/git-hooks/` is set. If the scripts directory already contains custom hooks, the command merges rather than overwrites (or exits with a clear conflict message if it cannot safely merge).

- **AC2 — Generate CI workflow stub (non-destructive):** Given the target workspace's GitHub repo, when the bootstrap runs, then a `.github/workflows/ci.yml` is written with stubs for type-check, tests, and lint steps (placeholders clearly marked for the workspace to fill in). If a `.github/workflows/ci.yml` already exists, the command skips writing it and prints a notice — it does NOT overwrite without an explicit `--force` flag.

- **AC3 — Apply GitHub branch protection via `gh` CLI (with fallback):** Given the user has `gh auth status` valid for the target workspace's GitHub repo and `gh` has `repo` scope, when the bootstrap runs, then `gh api -X PUT /repos/<owner>/<repo>/branches/main/protection ...` applies the same branch-protection ruleset apex-team uses (require PRs, require status checks, no bypass including admin). If `gh` lacks the required scope or the protection call fails, the command prints a numbered checklist of the GitHub UI steps to apply manually — it does not fail silently.

- **AC4 — Non-Node workspace graceful degradation:** Given a workspace with no `package.json` (e.g. a Swift or Python project), when the bootstrap runs, then the git hooks are installed as shell scripts that run the workspace's own test/lint commands (or no-op stubs if none are found), and the CI workflow stub is skipped with a note: "No package.json found — CI workflow not generated. Add your own `.github/workflows/ci.yml` to wire test/lint commands." The pre-push direct-to-main guard installs regardless of language.

- **AC5 — Bootstrap leaves a record in `<workspace>/ops/README.md`:** Given the bootstrap has been run on a workspace, when DevSecOps next operates on that workspace, then `<workspace>/ops/README.md` exists and includes a section documenting: bootstrap was applied on `<date>`, by `devsecops:bootstrap-workspace`, with the apex-team SHA at time of application. If `ops/README.md` already exists, the section is appended (not overwritten).

## Out of Scope

- Installing gitleaks in the external workspace — tracked as OQ-006; default intent is yes, but gitleaks availability is env-dependent.
- Bootstrapping repos that are not on GitHub (GitLab, Bitbucket, self-hosted) — `gh`-based branch protection applies to GitHub only; hooks still install (AC1 has no GitHub dependency).
- Migrating existing commit history or rewriting history in the target workspace.
- Uninstall / rollback command — not in scope for v1.

## Open Questions

- **OQ-006** (open, non-blocking): Should the bootstrap also install `gitleaks protect --staged` as part of the pre-commit hook in the external workspace? See `requirements/open-questions.md`.
- **OQ-007** (open, non-blocking): Should the bootstrap require explicit user authorization per workspace (interactive prompt), or run autonomously when DevSecOps decides? See `requirements/open-questions.md`.

## Links

- impl: feature/15-portable-bootstrap (SHA SHA-pending — backfill after merge)
- test: `tests/ops/bootstrap-workspace.test.ts` — 7 new cases, 34/34 green
- qa-pass-by: CI gate (no separate QA wave — ops-only, CI itself is the gate)
- deployed-by: Wave 15 merge (SHA-pending)
