## Done
- **PR #378 (pending)** — `fix(ci): fix pr-hygiene.yml registration failure on push events`
  - Branch: `feature/pr-hygiene-registration-fix`
  - Root cause: `env: PR_BODY: ${{ github.event.pull_request.body }}` at step level
    caused GitHub's workflow registration validator to fail when evaluating the
    expression in push context (pull_request context is null on push).
    Symptom: run name fell back to file path `.github/workflows/pr-hygiene.yml`
    with 0 jobs; workflow deregistered from PR check lists.
  - Fix: added `if: github.event_name == 'pull_request'` step guard AND
    `|| ''` defensive default on the env-var expression (option 3 per spec).
  - AC4 (shell injection fix from #375) preserved — `env:` passthrough + `printf '%s'` intact.
  - AC3 (comma-list check) logic unchanged.

## In flight
- Waiting for merge of feature/pr-hygiene-registration-fix → main (PR #378)
- Smoke proof: next push to main post-merge should show `PR Hygiene` name (not file path) on push run

## Next
- Confirm PR #378 merge push shows workflow name `PR Hygiene` in run list (AC1)
- Confirm next opened PR shows `Validate PR body close-keyword syntax` check (AC2)
- Clean up worktrees: `/tmp/ds-375-pr-hygiene` (stale from #376), `/tmp/ds-pr-hygiene-reg-fix` (this wave)

## Notes
- Stale worktrees from prior waves detected: `/tmp/ds-375-pr-hygiene` — remove after this PR merges
- `git worktree prune` recommended post-merge to clear all detached-HEAD orphans
