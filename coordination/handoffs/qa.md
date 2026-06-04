## Done
- Wave 108: wrote and ran `tests/qa/wave-108/subagent-body-cleanliness.test.ts`
  - 153 tests, all passed (Test Files 1 passed (1))
  - Verifies all 4 ADR-017 grep checks against all 8 .claude/agents/*.md files
  - Allowlist of exactly 8 `mcp__apex-team__` occurrences confirmed correct
  - First concrete US-085 AC5 smoke proof: test is a file on disk, runnable with one command

## In flight
- (nothing)

## Next
- Gate Wave 108 to DevSecOps with PASS verdict below
- Wave 109 candidate: add CI hook (DevSecOps lane) to run this test on every PR touching .claude/agents/*.md (ADR-017 §Follow-ups)

## Notes

### Wave 108 Gate Verdict: PASS

**Commit exercised:** HEAD of `feature/c1-plan-c-subagent-extraction` (3df219d as reported by PO, current branch)

**Test run output:**
```
Test Files  1 passed (1)
     Tests  153 passed (153)
  Start at  08:04:10
  Duration  125ms
```

**Test file:** `tests/qa/wave-108/subagent-body-cleanliness.test.ts`

**AC checklist (ADR-017 §Concrete grep test):**
- AC-1 (Pattern 1): `mcp__apex-team__` — 0 non-allowlisted matches across all 8 files. Allowlist total: exactly 8 (one per file). PASS
- AC-2 (Pattern 2): Broad legacy patterns (`pnpm dev:test`, `_handoff-pending`, `talk_to_product_owner`, `:3100`, etc.) — 0 matches. PASS
- AC-3 (Pattern 3): Dangling `src/lib/*.ts` pointers — 0 matches. PASS
- AC-4 (Pattern 4): `## Plan C runtime adapter` header — 0 matches in all 8 files. PASS
- AC-5 (Allowlist total): Exactly 8 `mcp__apex-team__` occurrences across 8 files. PASS

**S10:** Not triggered — wave touches no user-supplied collection logic (it's a grep-based regression test on static files).

**Leg A (pnpm build):** Not run — this wave is doc/test only (no src/ changes). Per gate rubric Legs A+B are required for runtime changes; this wave adds only a test file and a HANDOFF doc.

**Leg B:** N/A — no runtime changes.

**Leg C:** N/A — non-UI.

**US-085 note:** This is the first wave-scoped QA test delivered as a file on disk per the US-085 "tests are files not chat artifacts" discipline. `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` reproduces the full 153-test run without any copy-paste from chat.

**Verdict: PASS — Wave 108 is ready to merge.**

HANDOFF to DevSecOps: Wave 108 PASS. Test file: `tests/qa/wave-108/subagent-body-cleanliness.test.ts`. 153/153 green. ADR-017 body-cleanliness contract is now mechanically enforced.
