---
id: US-050
title: S10 mandatory unit-test gate + Pattern A regression (Wave 96)
status: done
wave: 96
closes: "#221"
owner: QA
created: 2026-06-02
accepted: 2026-06-02
impl: "832b16f"
---

## Story

As the QA role, I want a mandatory S10 gate (unit-test coverage for user-supplied collections) encoded in my skill, so that Pattern A bugs (where `.find()` silently discards items) are caught before they reach a QA PASS and can never recur.

## Background

A Pattern A bug (using `.find()` instead of `.filter()` on user-supplied collections) was discovered in `AddCustomerWizard.tsx`. The QA skill lacked a gate for this class of bug, allowing it to reach production undetected. Wave 96 adds the gate and a regression test that would have caught it.

## Acceptance criteria

1. `src/lib/skills/qa.ts` adds `### Mandatory unit-test gate (S10 — Wave 96)` immediately after the Gate verification workflow section. Gate is HARD classification (required, not advisory).

2. S10 gate scope trigger: user-supplied collections (arrays, sets, maps that flow from user input or external data into the component/service logic).

3. S10 gate documents the reproduces-then-prevents invariant table: the pre-fix FAIL SHA and post-fix PASS SHA must appear in PASS evidence OR an explicit "not triggered" declaration must appear.

4. S10 gate includes 3 Vitest exemplars: Pattern A (cardinality), Pattern B (discard-guard), Pattern C (order-preserving).

5. QA PASS evidence updated to 7 numbered gates; Gate 7 = S10 pre-fix FAIL SHA (`6dbdfc3`) + post-fix PASS SHA (this commit), or "not triggered" declaration.

6. `tests/regression/add-customer-wizard-files.test.ts`: Pattern A regression test — pre-fix FAIL + post-fix PASS verified against `AddCustomerWizard.tsx` `.find()` → `.filter()` fix.

## Out of scope

- Fixing the `AddCustomerWizard.tsx` bug itself (that is a workspace-project fix, not apex-team).
- Encoding S11+ gates in this wave.

## Implementation

- impl: `832b16f` (PR #227/#229, merged Wave 96 — `d4e514e`)
- Test: `tests/regression/add-customer-wizard-files.test.ts`
- pre-fix FAIL SHA: `6dbdfc3` · post-fix PASS SHA: `832b16f` · 346/346 pass

## Notes

- PR #229 also contains the `.gitattributes` `**/HANDOFF.md merge=union` restoration (US-051 AC). Both fixes ship together in the same merge commit (`d4e514e`).
