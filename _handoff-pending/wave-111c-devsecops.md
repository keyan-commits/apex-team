## Done
- AC1 (#240): `gh pr checks` step added to devsecops.md merge protocol (step 2a)
- AC2 (#246): ux-gate-check.yml workflow — fires on UI-touching PRs, verifies ADR-018 UX PASS verdict
- AC3 (#301): anomalous-closure playbook in devsecops.md + LESSONS.md entry
- AC4 (#324): pnpm outdated clean; #324 closed with comment
- AC5: pass-verdict-format-check.yml — format check + placeholder TTL soft-warn
- AC5 backfill: Wave 111a PR #386 SHA a16c924...; Wave 111b PR #387 SHA ba0905f...

## In flight
- PR open for Wave 111c — awaiting QA + Architect gates

## Next
- Architect ratification of alpha-suffix decision (Wave-111b normalized to Wave-111)
- Post-merge: backfill this PR's own PR #0 verdict placeholder in devsecops.md

## Notes
- Alpha suffix spec gap: Wave 111b heading was non-canonical ("Wave 111b" not "Wave-111b")
  Normalized to "Wave-111" + distinguished by PR# (PR #386 = 111a, PR #387 = 111b)
  Architect HANDOFF filed requesting ratification or ADR-018 amendment for alpha suffix support
