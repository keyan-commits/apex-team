## Done
- Filed US-083 (`requirements/user-stories/US-083-runaway-restart-alert.md`) for issue #320 — runaway-restart osascript notification + dashboard banner + reset path; 7 ACs; depends on US-080
- Updated `requirements/INDEX.md` with US-083 row + updated header timestamp
- Opened OQ-320-001: agent_state `health.manual_mode` key schema must be confirmed by Architect before DevSecOps (writer) and UI Dev (reader) start implementation

## In flight
- PR for this doc branch: `docs/ba-us083-runaway-restart-alert` → open housekeeping PR (docs-only, no gate needed)

## Next
- OQ-320-001 resolution: HANDOFF to Architect requesting schema lock-down before US-083 impl starts
- Self-heal bundle implementation sequencing: US-080 (#317) must land before US-083 impl can start (dependency)
- US-079 (#339) is already merged (signal handlers); plist install scripts remaining — DevSecOps to complete
- US-081 (#318) 4 OQs resolved by Architect — DevSecOps can proceed

## Notes
- US-082 PR #343 still open (housekeeping doc); OQ-319-001 open (db.ts transaction API)
- Self-heal bundle: #316 ✓ merged → #317 (impl pending, conflicts with #339 resolved now) → #318 (impl ready, OQs resolved) → #320/#083 (impl after #080 lands)
- UX gate required for US-083 (dashboard banner with contrast/a11y requirements)
