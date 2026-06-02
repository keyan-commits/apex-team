## Done
- Wave 102 / #261: `src/lib/skills/product-owner.ts` — exports `skills` (auto-start mandate, 5-step precedence, fallback catalog) + `rankIssues` (pure sort by priorityRank → typeRank → ageMs → issueNumber). Wired into `roles.ts` (PO role gains `skills` field; `rankIssues` re-exported). Smoke test updated; `tests/unit/rankIssues.test.ts` (6 fixtures). 412/412 tests pass, 0 type errors.

## In flight
- HANDOFF sent to Architect for code review gate.

## Next
- On Architect PASS: HANDOFF QA with test evidence.

## Notes
- `rankIssues` is a pure function — no side effects, no `Date.now()` calls inside (caller supplies `createdAt` strings; function calls `new Date(a.createdAt).getTime()` for age calc — deterministic from input).
- Smoke test `tests/smoke/skills.test.ts` updated: PO-has-no-skills assertion replaced with PO-has-auto-start-skills assertion per US-059 AC1.
