# US-006 — Main-branch enforcement for apex-team

**Status:** proposed
**Owner role:** devsecops
**Created:** 2026-05-31
**Story ID:** US-006

---

## Narrative

As a DevSecOps engineer, I want apex-team's `main` branch to be protected by both GitHub server-side rules and local commit-time hooks, so that the ADR-002 phased workflow cannot be bypassed by direct pushes or unreviewed commits — including by the repo admin and by autonomous agents acting as "bootstrap exceptions."

## Background

Despite ADR-002 mandating a 4-phase model (Requirements → Implementation → Verification → Deployment), the workflow was bypassed multiple times this session via self-declared "direct-to-main bootstrap exceptions." The protocol currently relies on agent prompts alone; no system-level enforcement exists. This story closes that gap for apex-team itself. US-007 extends the pattern to external workspaces.

References: ADR-002, `src/lib/protocols.ts` (`PHASED_WORKFLOW_PROTOCOL`), Wave 13 BA dispatch.

## Acceptance Criteria

- **AC1 — No direct push to `main`, including admin:** Given any attempt to push directly to `main` (via `git push origin main` OR GitHub UI), when the push is attempted, then GitHub's branch protection rejects it with a clear error — **including for the repository admin**. `Allow force pushes` and `Allow bypasses` must be unchecked.

- **AC2 — CI gate blocks PR merge on failure:** Given a pull request opened against `main`, when any CI check (`pnpm type-check`, `pnpm test:run`, `pnpm lint`) fails, then GitHub blocks the PR merge until the failing check passes. The CI workflow runs on every PR push (not just the first commit).

- **AC3 — Local pre-push hook refuses direct-to-main pushes:** Given a local `git push origin main` from any clone of the apex-team repo, when `scripts/git-hooks/pre-push` is installed (via `git config core.hooksPath scripts/git-hooks/`), then the hook exits non-zero with a message instructing the pusher to use a feature branch and PR workflow. The hook must be committed to the repo so clones can install it.

- **AC4 — Pre-commit hook enforces type-check:** Given a `git commit` from any clone, when `scripts/git-hooks/pre-commit` runs, then `pnpm type-check` executes; if it fails the commit is refused with the type-check output shown. (Tests run in CI; pre-commit type-check is fast enough to be synchronous.)

- **AC5 — CODEOWNERS advisory review for sensitive paths:** Given `.github/CODEOWNERS` is committed to `main`, when a PR touches `.github/` or `ops/`, then GitHub assigns DevSecOps as an advisory reviewer. (Enforcement is advisory only — single-identity repo cannot mandate cross-agent review; this is a signal, not a hard block.)

- **AC6 — `--no-verify` bypass caught by CI:** Given `--no-verify` was used to skip the pre-commit hook, when the resulting commit is pushed to a PR branch, then CI still executes type-check and tests server-side and blocks the merge if they fail. The server-side gate is the authoritative final check.

## Out of Scope

- Requiring multi-approver PR reviews — single-identity repo; not applicable.
- Branch protection for any branch other than `main`.
- Enforcement on the b2b-* project or other external workspaces — that is US-007's scope.
- Signed commits (`git commit -S`) — out of scope for this story; defer as OQ.

## Open Questions

None blocking this story.

## Links

_(Filled in during and after implementation)_

- impl: _(pending)_
- test: _(pending)_
- qa-pass-by: _(pending)_
- deployed-by: _(pending)_
