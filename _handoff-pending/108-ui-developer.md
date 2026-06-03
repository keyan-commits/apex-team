## Done
- Per-state focus ring implemented: `--focus-ring: #1a1a1a` token added to `globals.css`; unselected `.aw-poll-btn:focus-visible` retains `var(--text)` (no offset); selected override `.aw-poll-selected.aw-poll-btn:focus-visible` uses `outline-color: var(--focus-ring)` — Architect-ratified shape, resolves UX's AC3 gate-block
- type-check: 0 · tests: 464/464 pass

## In flight
- PR #302 awaiting UX re-gate on AC3 + AC4, then QA, then DevSecOps merge

## Next
- After UX PASS: HANDOFF QA on :3100
- After QA PASS: HANDOFF DevSecOps squash-merge

## Notes
- Commit on `feature/108-us065-us066-rm-a11y-focusring`
- Do NOT push to main — gate sequence: UX → QA → DevSecOps
