## Done
- US-079 filed: self-heal L1 launchd LaunchAgents (closes #316) — accepted, owner DevSecOps
- US-080 filed: self-heal L2 multi-signal stall detector (closes #317) — accepted, owner BE Dev
- US-081 filed: self-heal L3 DevSecOps auto-merge hardened gate (closes #318) — accepted, owner DevSecOps; Architect NFR brief (ADR-017) encoded into ACs + 4 OQs
- INDEX.md updated: 3 new story rows + timestamp updated

## In flight
- US-071 (QA Tests section) — PR #341 open, gates in flight (Architect + UX + QA)
- US-072 (scout error copy) — PR #338, Architect PASS, QA + UX AC3 pending
- US-079 launchd plist install scripts — PR #339 covers signal-handler half only; plist scripts remain

## Next
- Await QA/UX verdicts on PRs #337, #338, #341
- When triad returns on #316/#317: US-079/US-080 move to in-dev
- OQ-318-001 through OQ-318-004 need Architect + DevSecOps resolution before US-081 moves to in-dev

## Notes
- Rescue sweep triggered at inbox-age 1358s; processed 3 inbox items (2× PO zero-idle + 1× Architect NFR brief for #318)
- US-081 OQs reflect Architect's ADR-017 open questions verbatim — Architect must resolve before DevSecOps implements
