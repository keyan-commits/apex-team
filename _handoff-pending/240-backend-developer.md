## Done
- Fix #240: `providers.ts:147` `let inboxItems` → `const inboxItems` — prefer-const lint error eliminated; `pnpm lint` now 0 errors (was blocking CI green on main).
- Verified: `inboxItems` is never reassigned (only mutated via `.shift()`/`.unshift()`), so `const` is correct.
- type-check 0 errors, lint 0 errors, 369/369 tests pass.
## In flight
- Branch `feature/240-providers-prefer-const` open; PR pending Architect gate.
## Next
- Await Architect PASS → HANDOFF DevSecOps for merge.
## Notes
- 1-line change, TINY-tier, no test additions needed (no logic change).
- PR tail car behind #238→#239 drain.
