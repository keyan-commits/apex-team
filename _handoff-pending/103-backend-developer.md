## Done
- Removed dead `lastAlertedHeadSha` field from `PersistedState` interface + loadState default + GET handler (let binding + reset block + saveState arg). Behavior-neutral: field was never set to non-null and never read for any decision. Branch `feature/103-remove-dead-alerted-sha`.

## In flight
- Awaiting Architect gate on this PR.

## Next
- On Architect PASS → HANDOFF DevSecOps to merge.

## Notes
- No test changes needed: `detectCiHealth.test.ts` had zero references to the field.
- 422/422 tests, 0 type errors.
