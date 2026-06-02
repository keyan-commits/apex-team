## Done
- Implemented `scripts/fold-handoff.ts` (~50 LOC): pure `foldFragments()` + `run()` with idempotent no-op on empty dir
- `.githooks/pre-commit` amended: dual-accept (HANDOFF.md direct edit OR `_handoff-pending/*.md` add)
- 7 skill files updated with fragment-pattern section (`src/lib/skills/*.ts`)
- `package.json`: added `fold-handoff` script (`tsx scripts/fold-handoff.ts`)
- Unit tests: `tests/be/fold-handoff.test.ts` covering F1, F2 (mock), F3
- `LESSONS.md` appended: Wave 93 entry
- `_handoff-pending/.gitkeep`: directory tracked in git

## In flight
- Awaiting Architect code review → QA smoke on :3100

## Next
- DevSecOps merges after QA PASS

## Notes
- First PR to dogfood the fragment pattern itself — hook dual-accept critical for smooth migration
- F2 (git rm side-effect) tested via vi.mock; pure fold function is the primary test surface
