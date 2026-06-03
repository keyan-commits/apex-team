---
name: US-080-self-heal-l2-stall-detector
description: Self-heal L2 — multi-signal stall detector + process.exit(1) with bounded cascade-protection; closes #317
metadata:
  type: user-story
  status: accepted
  owner: BackendDeveloper
  issue: "#317"
  wave: pending-triad
  last-modified: 2026-06-03
---

## Story

As the apex-team server, when the tick scheduler is technically alive but no real work is happening (peer inboxes starving, MCP backend unreachable, async loop wedged), I want to detect "stuck-but-alive" via two independent progress signals and self-exit with bounded backoff so the L1 launchd respawn restores forward progress, without entering a restart-cascade.

## Acceptance criteria

1. **Multi-signal probe** — the stall detector requires **two orthogonal signals** before declaring "alive-and-making-progress": (a) tick count increment, AND (b) at least one of {persisted PR row updated, peer HANDOFF doc updated, GitHub issue activity recorded}. Either signal alone is insufficient (gameable by a wedged-but-counting loop).

2. **Stall threshold** — when both-signals "no progress" persists for `STALL_WARN_MIN` minutes (default 10, env-overridable), emit an escalated warn log. When persists for `STALL_EXIT_MIN` minutes (default 15), call `process.exit(1)`. **Skip entirely if the L1 plist's "user-off" state is active** (file probe: `data/.user-off`); manual-off mode means user explicitly wants idle, not stalled.

3. **Bounded restart-cascade protection** — track consecutive `process.exit(1)` events via a state file `data/.exit-history.json` (last 5 timestamps). If 3+ exits within 5 minutes, **stop exiting**: switch to "manual-intervention mode" — log a prominent error, write a sticky banner state to `agent_state` for the dashboard, fire the macOS notification (osascript), and continue running degraded rather than restart-loop.

4. **Test coverage** — unit tests for: (a) multi-signal probe (mock both signals, assert detector reads both); (b) stall threshold timing (fake-clock test); (c) cascade-protection (5 fast exits → switches to manual-mode + doesn't exit a 6th time).

5. **Logs** — every state transition (warn → exit → manual-mode) writes a single line with the deciding signals' last-update timestamps so a human can post-mortem.

6. **Tunable via env** — `STALL_WARN_MIN`, `STALL_EXIT_MIN`, `STALL_CASCADE_LIMIT`, `STALL_CASCADE_WINDOW_MIN`. Documented in `docs/operations/self-heal.md` (alongside US-079 docs).

## Out of scope

- L1 launchd plist install (US-079).
- L3 DevSecOps auto-merge (US-081).
- Dashboard stall UI beyond the sticky banner state written to `agent_state`.

## Notes

- L2 of a 3-layer self-heal architecture. Depends on: US-079 (L1 launchd KeepAlive responds to `process.exit(1)` from L2). Depended on by: none.
- The cascade-protection threshold MUST be larger than L1's `ThrottleInterval` (10s) — accounted for by counting per-minute, not per-second.
- DeepSeek's apex_synthesize critique (2026-06-03) flagged the "silent partition between probe and lived state" failure mode that the multi-signal probe defends against.
- Discovered during: 2026-06-03 apex-engine apex_synthesize consultation on self-heal architecture.
