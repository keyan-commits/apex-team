## Done
- `vitest.config.ts`: added `.claude/**` and `**/.git/**` to exclude array (AC1) — vitest no longer discovers stale smoke worktrees under `.claude/worktrees/`
- `tsconfig.json`: added `.claude` to exclude array (AC2) — type-check no longer walks into worktrees
- Pre-existing failure in `tests/lib/be84-us038.test.ts` confirmed on main prior to this change (AC4 state machine issue, unrelated)
- PR #340 open, type-check 0, 522/524 tests pass (1 pre-existing fail on main, 1 skip)

## In flight
- Awaiting Architect code review on PR #340
- PR #339 (US-079 signal handlers) still awaiting Architect review

## Next
- Once #340 merges: QA re-run `pnpm test:run` from a tree that has a leftover `.claude/worktrees/` dir to confirm no contamination
- #317 N+1 stall detector — queued behind #339 merge

## Notes
- AC3 (worktree hygiene in smoke scripts) is DevSecOps / QA lane — out of scope for this config-only PR
- The `**/.git/**` guard is belt-and-suspenders; `.claude/worktrees/*/` dirs each contain a `.git` dir, and vitest could otherwise re-enter them via a symlink
