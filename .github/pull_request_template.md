## Summary
<!-- Describe what this PR does in 1-2 sentences. Example: "Fix login button unresponsive on mobile devices." -->


## Test plan
<!-- Checklist of manual testing steps, if any. Example:
- [ ] Tested on desktop at 1920×1080
- [ ] Tested on mobile at 390×844
- [ ] Verified dark mode rendering
-->


## Visual evidence checklist (required for any UI changes)

- [ ] Ran `pnpm dev` and viewed change in browser at ≥1280px viewport
- [ ] Console clean (no React warnings, no errors)
- [ ] Screenshot attached for UI changes
- [ ] Lint clean: `pnpm lint --max-warnings 0`
- [ ] Type-check clean: `pnpm type-check`

**Why this matters:** This checklist catches the regression classes we kept shipping (layout regressions, console errors, missing evidence, lint failures, stale type contracts). All items must be checked before merge.

## Closes
<!-- Example: closes #123, closes #456 -->
<!-- Note: use one "closes" keyword per issue, not comma lists. -->
<!-- Incorrect: closes #123, #456, #789 -->
<!-- Correct: closes #123, closes #456, closes #789 -->
