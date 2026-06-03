# US-079 — Self-heal L1: launchd LaunchAgents for apex-team + apex-engine

**Status:** accepted
**Owner role:** devsecops
**Created:** 2026-06-03
**Story ID:** US-079
**GitHub issue:** #316

---

## Narrative

As an apex-team operator on a single-user single-mac local dev setup, I want the dev-supervisor or next-server process to come back automatically without any human intervention or outer-polling loop when it dies for any reason (OOM/jetsam, lockfile, port stolen, terminal closed, mac slept/rebooted), so that the team keeps making forward progress and the JSONL-bloat OOM incident (2026-06-03) cannot recur.

## Acceptance Criteria

- **AC1 — LaunchAgent for apex-team:** `~/Library/LaunchAgents/com.keyan.apex-team.plist` is installed with:
  - `KeepAlive` as a **dictionary**: `{Crashed: true, SuccessfulExit: false}` — respawn only on abnormal exit (signal kill, OOM, exit-nonzero). A clean `process.exit(0)` does NOT trigger respawn.
  - `RunAtLoad=true`
  - `ThrottleInterval=10` (seconds, explicit — not the launchd default)
  - `ExitTimeOut=20` (give graceful shutdown 20s on SIGTERM before SIGKILL)
  - `ProgramArguments` runs `pnpm dev:supervised` from the apex-team repo root using an absolute `pnpm` path discovered at install time (no `$PATH` reliance — launchd's PATH is minimal).

- **AC2 — LaunchAgent for apex-engine:** Mirror plist `com.keyan.apex-engine.plist`, same flag set (`Crashed=true`, `SuccessfulExit=false`, `ThrottleInterval=10`, `ExitTimeOut=20`), running apex-engine's startup command.

- **AC3 — Install + control scripts:**
  - `apex-team/scripts/install-launchd.sh` writes both plists from templates (substituting `$HOME` / repo paths / absolute `pnpm`), runs `launchctl bootstrap gui/$(id -u)` on each. Idempotent.
  - `uninstall-launchd.sh` — `launchctl bootout` + remove plists.
  - `pnpm dev:off` (added to `package.json`) — `launchctl bootout gui/$(id -u) com.keyan.apex-team` (fully stops; launchd will not respawn until re-enabled). Mirror `pnpm dev:on` to re-bootstrap. Mirror in apex-engine.

- **AC4 — Signal handler in `dev-supervisor.mjs`:** Covers SIGTERM AND SIGINT (Ctrl-C) AND SIGHUP — all three treated identically: propagate to the Next.js child, wait up to 15s for graceful exit, then `process.exit(0)`. The clean exit + `SuccessfulExit=false` config means manual `kill -TERM`, `kill -INT`, terminal Ctrl-C, and `kill -HUP` are all fully honoured (no respawn).

- **AC5 — Double-Ctrl-C escalation:** A second SIGINT (or SIGTERM/SIGHUP) within 8s of the first skips the grace period, sends SIGKILL to the child immediately, then `process.exit(0)`. Third signal: bare `process.exit(1)` — no further cleanup. Prevents user-double-tap from leaving the child orphaned.

- **AC6 — Stale-child short-circuit in `killChild()`:** Before registering `child.once('exit')` and sending SIGTERM, check whether the cached `child.pid` is alive via `try { process.kill(child.pid, 0); } catch { return resolve(); }`. If ESRCH, null the reference and resolve immediately. Fixes the "shutdown hangs forever" bug observed 2026-06-03.

- **AC7 — Test coverage:** Tests exist for: (a) double-SIGINT within 8s → supervisor exits within 1s of the second SIGINT + child is SIGKILL'd; (b) stale-child scenario → supervisor receives SIGTERM with `child` pointing to a dead PID → shutdown resolves within 100ms (not after `GRACE_MS`); (c) plist XML validation asserting required keys (`KeepAlive`, `ThrottleInterval`, `RunAtLoad`, `Label`, `ProgramArguments`).

- **AC8 — Smoke tests (no human curl, no outer ScheduleWakeup, no recovery script):**
  - Crash → respawn: `kill -KILL` both supervisor + next-server, wait, assert `/api/health` returns 200 within 30s.
  - User-off intent honoured (SIGTERM): `kill -TERM` the supervisor, wait, assert `/api/health` does NOT come back; assert no respawn loop in launchd logs.
  - User-off intent honoured (SIGINT/Ctrl-C): simulate Ctrl-C (SIGINT), assert graceful exit, assert no respawn loop.
  - User-off intent honoured (SIGHUP): `kill -HUP`, assert graceful exit, no respawn.
  - `pnpm dev:off` honoured: invoke `pnpm dev:off`, kill the process, wait, assert no respawn until `pnpm dev:on` is called.

- **AC9 — Docs + logs:** `docs/operations/self-heal.md` describes install, uninstall, log paths (`StandardOutPath`/`StandardErrorPath`), and how to verify (`launchctl list | grep keyan`). Logs go to `~/Library/Logs/apex-team/{out,err}.log`; rotation via macOS or a `newsyslog` snippet.

## Out of Scope

- UI surface / dashboard banner for "user-off" state — tracked in #320 (related to US-082 if filed).
- L2 multi-signal stall detector — tracked in #317 / US-080.
- L3 DevSecOps auto-merge — separate ticket.
- SQLite migration crash-safety — sibling ticket.
- PM2 / Docker / systemd-equivalent approaches — explicitly rejected per apex_synthesize 2026-06-03; launchd is the right primitive for this scope.

## Notes

- Replaces the implicit "outer claude-code polls + runs `scripts/recover-dev-server.sh`" workflow that caused the 2026-06-03 OOM incident.
- `KeepAlive={Crashed: true, SuccessfulExit: false}` is the key invariant: user-off intent (clean `process.exit(0)`) must NOT trigger respawn.
- `ThrottleInterval=10` explicit (cascade-protection) — not left to launchd default.
- L1 of a 3-layer self-heal architecture. L2 = US-080 (#317). L3 = future story.

## Links

_(Filled in during and after implementation)_

- impl: `(pending)`
- test: `(pending)`
- qa-pass-by: `(pending)`
- deployed-by: `(pending)`
