---
name: US-079-self-heal-l1-launchd-agents
description: Self-heal L1 — launchd LaunchAgents for apex-team + apex-engine (user-off-respecting KeepAlive); closes #316
metadata:
  type: user-story
  status: accepted
  owner: DevSecOps
  issue: "#316"
  wave: pending-triad
  last-modified: 2026-06-03
---

## Story

As an apex-team operator on a single-user single-mac local dev setup, when the dev-supervisor or next-server process dies for any reason (OOM/jetsam, lockfile, port stolen, terminal closed, mac slept/rebooted), I want the service to come back automatically without any human intervention or outer-polling loop, so that the team keeps making forward progress and the JSONL-bloat OOM incident (2026-06-03) cannot recur.

## Acceptance criteria

1. **LaunchAgent for apex-team** — `~/Library/LaunchAgents/com.keyan.apex-team.plist` is installed, with:
   - `KeepAlive` as a **dictionary**: `{Crashed: true, SuccessfulExit: false}` — respawn **only on abnormal exit** (signal kill, OOM, exit-nonzero). A clean `process.exit(0)` does NOT trigger respawn.
   - `RunAtLoad=true`
   - `ThrottleInterval=10` (seconds, explicit — not the launchd default)
   - `ExitTimeOut=20` (give graceful shutdown 20s on SIGTERM before SIGKILL)
   - `ProgramArguments` runs `pnpm dev:supervised` from the apex-team repo root using absolute `pnpm` path discovered at install time (no `$PATH` reliance — launchd's PATH is minimal).

2. **LaunchAgent for apex-engine** — Mirror plist `com.keyan.apex-engine.plist`, same flag set (`Crashed=true`, `SuccessfulExit=false`, `ThrottleInterval=10`, `ExitTimeOut=20`), running apex-engine's startup command.

3. **Install + control scripts** — `apex-team/scripts/install-launchd.sh` writes both plists from templates (substituting `$HOME` / repo paths / absolute `pnpm`), runs `launchctl bootstrap gui/$(id -u)` on each. Idempotent. Companion scripts:
   - `uninstall-launchd.sh` — `launchctl bootout` + remove plists.
   - `pnpm dev:off` (added to `package.json`) — `launchctl bootout gui/$(id -u) com.keyan.apex-team` (fully stops; launchd will not respawn until re-enabled). Mirror `pnpm dev:on` to re-bootstrap. Mirror in apex-engine.
   - **Signal handler in `dev-supervisor.mjs` covers SIGTERM AND SIGINT (Ctrl-C) AND SIGHUP** — all three treated identically: propagate to the Next.js child, wait up to 15s for graceful exit, then `process.exit(0)`. The clean exit + `SuccessfulExit=false` config means manual `kill -TERM`, `kill -INT`, terminal Ctrl-C, and `kill -HUP` are all honoured (no respawn).
   - **Double-signal escalation** — a second SIGINT (or SIGTERM/SIGHUP) within 8s of the first is treated as "user is impatient": skip the grace period, send SIGKILL to the child immediately, then `process.exit(0)`. Third signal: bare `process.exit(1)` — no further cleanup. Prevents user double-tap from leaving the child orphaned.
   - **Stale-child short-circuit in `killChild()`** — before registering `child.once('exit')` and sending SIGTERM, check whether the cached `child.pid` is alive via `try { process.kill(child.pid, 0); } catch { return resolve(); }`. If PID is gone (ESRCH), resolve immediately — fixes the "shutdown hangs forever on an exit event that already fired" bug from 2026-06-03.

4. **Unit/integration test coverage** — test loads the plist XML and asserts required keys (`KeepAlive`, `ThrottleInterval`, `RunAtLoad`, `Label`, `ProgramArguments`). Tests for: (a) double-SIGINT within 8s → exits within 1s of second SIGINT + child SIGKILL'd; (b) stale-child scenario → SIGTERM with dead PID → resolves within 100ms.

5. **Documented in `docs/operations/`** — `docs/operations/self-heal.md` describes install, uninstall, log paths (`StandardOutPath`/`StandardErrorPath`), and how to verify (`launchctl list | grep keyan`).

6. **No reliance on outer Claude Code session** — verified by smoke tests:
   - **Crash → respawn:** `kill -KILL` both supervisor + next-server, wait, assert `/api/health` returns 200 within 30s.
   - **User-off (SIGTERM):** `kill -TERM` supervisor, assert `/api/health` does NOT come back; no respawn loop in launchd logs.
   - **User-off (SIGINT):** simulate Ctrl-C (SIGINT), assert graceful exit, no respawn loop.
   - **User-off (SIGHUP):** `kill -HUP`, assert graceful exit, no respawn.
   - **`pnpm dev:off`:** invoke, kill process, assert no respawn until `pnpm dev:on`.
   - No human curl, no outer ScheduleWakeup, no recovery-script trigger in any flow.

7. **Logs and rotation** — `StandardOutPath` and `StandardErrorPath` set to `~/Library/Logs/apex-team/{out,err}.log`; rotation handled by macOS or a `newsyslog` snippet.

## Out of scope

- L2 stall detector exit policy (US-080).
- L3 DevSecOps auto-merge (US-081).
- SQLite migration crash-safety.
- UI surface / UX gate (ops-only — no dashboard changes).

## Notes

- Replaces the implicit "outer claude-code polls + runs `scripts/recover-dev-server.sh`" workflow that caused the 2026-06-03 OOM incident.
- `launchd KeepAlive` is the correct primitive over PM2/Docker/systemd-equivalents at this scope. `ThrottleInterval=10` explicit for cascade-protection.
- L1 of a 3-layer self-heal architecture. Depends on: none. Depended on by: US-080 (L2 calls `process.exit(1)` which L1 respawns).
- **PR #339 (signal handlers only) is already merged** — AC3's signal-handler + stale-child sub-items are done. Remaining: launchd plist install scripts (AC1/AC2/AC3 install scripts), AC4 plist XML test, AC5 docs, AC6 smoke.
- Discovered during: 2026-06-03 root-cause review of JSONL-OOM incident.
