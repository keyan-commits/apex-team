## Done
- `scripts/dev-supervisor.mjs` rewritten: export `Supervisor` class (testable), GRACE_MS 5s→15s (AC4), SIGHUP handler (AC4), double-signal escalation state machine (AC5), stale-child `process.kill(pid,0)` guard in `killChild()` (AC6), user-off sentinel at `data/.user-off`, PID file at `data/.supervisor.pid` for startup orphan detection
- `scripts/dev-supervisor.d.mts` — TypeScript declaration for the exported class
- `server.ts`: added `process.once("SIGHUP", shutdown)` alongside existing SIGINT/SIGTERM
- `tests/be/dev-supervisor.test.ts`: 10 new tests covering AC7a (double-SIGINT SIGKILL + user-off), AC7b (stale-child fast-resolve < 100ms), AC5 edge cases (outside-window, third-signal, SIGTERM/SIGHUP escalation), and AC6 startup orphan detection
- Gate: type-check 0, 533/533 tests pass (60 files), 1 skipped

## In flight
- Awaiting Architect code review on `feature/316-us079-server-signal-handlers`
- QA smoke queued behind Architect PASS

## Next
- DevSecOps aligns on the BE↔ops seam (see Notes below) to avoid merge conflict

## Notes
- **DevSecOps seam** — two sentinel files BE writes; DevSecOps `pnpm dev:off/on` scripts must NOT reset these without reading them:
  - `data/.user-off` — JSON `{reason:"double-signal", signal, at}` — written on double-signal escalation; `pnpm dev:on` should delete this before re-bootstrapping
  - `data/.supervisor.pid` — child process PID; cleared by supervisor on clean exit, used only for orphan detection on startup
- `pnpm dev:supervised` already wired in package.json → no package.json changes from BE side
- AC7c (plist XML validation) is DevSecOps scope — not included here
- AC8 (smoke tests) is QA scope
- AC9 (docs/operations/self-heal.md) is DevSecOps/BA scope
