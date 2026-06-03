## Done
- Fixed shell injection in `.github/workflows/pr-hygiene.yml` (#375): moved `${{ github.event.pull_request.body }}` to an `env:` block; replaced `echo` with `printf '%s'` so PR bodies with backticks, `$`, and code fences no longer cause bash to evaluate shell metacharacters.

## In flight
- PR open for #375 fix, awaiting Architect code-review gate.

## Next
- Merge to main once Architect PASS received.

## Notes
- Other workflows (ci.yml, codeql.yml) do not use `github.event.*` in bash blocks — no follow-up issues needed.
- PR body for this PR intentionally contains backticks and `$` to smoke-proof the fix.
