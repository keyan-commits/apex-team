# US-080 — Self-heal L2: multi-signal stall detector + bounded cascade-protection

**Status:** draft
**Owner role:** backend-developer
**Created:** 2026-06-03
**Story ID:** US-080
**GitHub issue:** #317
**Blocked by:** US-079 (#316) must land first; Architect NFR in flight (dispatched 2026-06-03)

---

## Narrative

As the apex-team server, when the tick scheduler is technically alive but no real work is happening (peer inboxes starving, MCP backend unreachable, async loop wedged), I want to detect "stuck-but-alive" via two independent progress signals and self-exit with bounded backoff so the L1 launchd respawn restores forward progress, without entering a restart-cascade.

## Acceptance Criteria

_(Status: draft — Architect NFR in flight; ACs below are from issue body and subject to revision once NFR lands)_

- **AC1 — Multi-signal probe:** Two orthogonal signals must BOTH indicate progress for "alive-and-making-progress": (a) tick count increment, AND (b) at least one of {persisted PR row updated, peer HANDOFF doc updated, GitHub issue activity recorded}. Either signal alone is insufficient (gameable by a wedged-but-counting loop).

- **AC2 — Stall thresholds:** When both-signals "no progress" persists for `STALL_WARN_MIN` minutes (default 10, env-overridable), emit an escalated warn log. When persists for `STALL_EXIT_MIN` minutes (default 15), call `process.exit(1)`. Skip entirely if L1 plist's "user-off" state is active (file probe: `data/.user-off`); manual-off means user explicitly wants idle, not stalled.

- **AC3 — Bounded restart-cascade protection:** Track consecutive `process.exit(1)` events via `data/.exit-history.json` (last 5 timestamps). If 3+ exits within 5 minutes, stop exiting: switch to "manual-intervention mode" — log a prominent error, write a sticky banner state to `agent_state` for the dashboard, fire a macOS notification, and continue running degraded rather than restart-loop. Cascade threshold MUST be larger than L1's `ThrottleInterval` (10s) — accounted for by counting per-minute, not per-second.

- **AC4 — Test coverage:** Unit tests for: (a) multi-signal probe (mock both signals, assert detector reads both); (b) stall threshold timing (fake-clock test); (c) cascade-protection (5 fast exits → switches to manual-mode + doesn't exit a 6th time).

- **AC5 — Logs:** Every state transition (warn → exit → manual-mode) writes a single line with the deciding signals' last-update timestamps for post-mortem analysis.

- **AC6 — Tunable via env:** `STALL_WARN_MIN`, `STALL_EXIT_MIN`, `STALL_CASCADE_LIMIT`, `STALL_CASCADE_WINDOW_MIN`. All documented in `docs/operations/self-heal.md` (extended from US-079 AC9).

## Out of Scope

- L1 launchd plists — US-079 (#316).
- L3 DevSecOps auto-merge — separate ticket.
- Dashboard UI for manual-intervention banner — depends on UX Designer review; may be split to its own story.
- osascript notification implementation detail — may be a sub-task or separate story.

## Open Questions

- **OQ-S317-001** (open): Does "cascade-protection" manual-mode banner belong in this story or should it split to a UI story after Architect NFR review? Blocker for AC3 scope boundary. _Working assumption: keep in this story until Architect says otherwise._
- **OQ-S317-002** (open): What constitutes "GitHub issue activity recorded" as a progress signal — writing a new issue, or any GH API call? _Working assumption: new issue filed or issue comment added._

## Links

_(Filled in during and after implementation)_

- impl: `(pending)`
- test: `(pending)`
- qa-pass-by: `(pending)`
- deployed-by: `(pending)`
