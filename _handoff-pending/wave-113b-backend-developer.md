## Done
- Fixed allowlist glob `.spec.ts` → `.test.ts` in `src/app/api/qa/run-test/route.ts` (PO decision, QA REVISE on PR #308)
- Updated `tests/be/qa-run-test.test.ts` mock filenames to match; 10/10 tests green, 461/461 total green

## In flight
- PR #308 awaiting QA re-smoke (glob fix just pushed to `feature/113-us071-qa-run-endpoint`)

## Next
- On QA PASS: HANDOFF DevSecOps to merge #308

## Notes
- Pre-existing Playwright missing-package failure (#309) unchanged — not this wave
- Type-check 0 non-Playwright errors (same baseline as Architect PASS)
