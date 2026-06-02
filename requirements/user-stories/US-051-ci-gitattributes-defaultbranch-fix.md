---
id: US-051
title: Restore HANDOFF.md union-merge entry + ci.yml defaultBranch fix (Wave 96)
status: done
wave: 96
closes: "#214"
owner: DevSecOps
created: 2026-06-02
accepted: 2026-06-02
impl: "7863a1b"
---

## Story

As the team, I want the `.gitattributes` `**/HANDOFF.md merge=union` entry restored after it was dropped by S10 post-fix work, and CI's throwaway test repo initialized with `main` as the default branch, so that the F1 fitness test (ADR-013) passes reliably and the `master 2>/dev/null` workaround is removed.

## Acceptance criteria

1. `.gitattributes`: `**/HANDOFF.md merge=union` entry restored (was dropped when the S10 post-fix was originally applied).

2. `.github/workflows/ci.yml`: throwaway test repo initialized with `git -c init.defaultBranch=main init -q` so it always starts on `main`.

3. `master 2>/dev/null` workaround removed from CI workflow (was masking the defaultBranch issue).

4. All 357 tests pass with the fix in place.

## Out of scope

- Changing other `.gitattributes` entries.
- Modifying the S10 gate content (that is US-050).

## Implementation

- impl: `7863a1b` (PR #214, merged as part of Wave 96 — `d4e514e`)
- S10 pre-fix FAIL: `36a40d3` · S10 post-fix PASS: `7863a1b`

## Notes

- This fix ships alongside US-050 in PR #229 (same merge commit `d4e514e`).
- AC3 is the direct cause: `git init` without `--initial-branch=main` defaults to `master` on some Git versions, causing the F1 test to fail against the wrong branch name.
