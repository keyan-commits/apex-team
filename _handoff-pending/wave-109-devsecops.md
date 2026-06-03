## Done
- #270 (US-067) authored + gates green (type-check 0, tests 451×pass)
  - `cleanDevLock()` removes `.next/dev` at both respawn sites (crash + `.restart-trigger`)
  - idempotent via `rmSync(...,{recursive:true,force:true})`

## In flight
- Ready to push on green

## Next
- HANDOFF QA + push after this commit

## Notes
- Pre-commit hook requires HANDOFF fragment per Wave 93+ pattern
- Spec: US-067 / #270 (`requirements/user-stories/US-067-dev-supervisor-stale-lockfile-cleanup.md`)
