## Done
- **PR #378 (pending)** — `fix(ci): use GITHUB_EVENT_PATH to avoid pull_request context in env:`
  - Branch: `feature/pr-hygiene-registration-fix`
  - Root cause: `env: PR_BODY: ${{ github.event.pull_request.body }}` at step level
    caused GitHub's static context-availability validator to reject the workflow on push
    events. Validator checks env: expressions at parse time; job-level if: and || ''
    fallbacks do NOT help because they only affect runtime evaluation.
    Symptom: run name fell back to file path `.github/workflows/pr-hygiene.yml`
    with 0 jobs; workflow deregistered from PR check lists.
  - Fix: removed ALL `${{ github.event.pull_request.* }}` expressions from the workflow.
    PR body is now read from `$GITHUB_EVENT_PATH` (runner env var, always set) via
    `node` in the run: script. This bypasses static validation entirely.
  - AC4 (shell injection fix from #375) preserved — body never passes through bash eval.
  - AC3 (comma-list check) logic unchanged.
  - Attempted intermediate fixes that did NOT work (for future reference):
    - `|| ''` defensive default on env: value — still fails static validation
    - `if: github.event_name == 'pull_request'` at job level — validator still parses env: exprs
    - `if: github.event_name == 'pull_request'` at step level — same issue

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
