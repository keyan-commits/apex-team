# US-084 — apex-team self-instability hardening

**Status:** accepted
**Owner role:** backend-developer (AC1), devsecops (AC2 AC3 AC4), qa (AC5)
**Created:** 2026-06-03
**Story ID:** US-084
**Closes:** #349

---

## Narrative

As an **external Claude Code user driving apex-team from another machine**, I want **apex-team's own self-dev work to not break apex-team's running dev server**, so that **I don't have to stop my own work to manually triage and recover apex-team's dueling supervisors and stale compile cache mid-session**.

---

## Acceptance Criteria

- **AC1 — Conflict-marker guard** _(owner: BE Dev)_
  Given a tracked source file contains a raw `<<<<<<<`, `=======`, or `>>>>>>>` git-conflict marker, when the dev server's file-watcher picks up the change or a route is hit, then the server (or its supervisor) must refuse to serve compiled output from that file — either by failing fast with a clear error message, by a precompile fence that rejects compilation, or by a file-watcher that pauses recompile and logs the offending file + line. A silent parse-error 500 cascade is not acceptable.

- **AC2 — Single-supervisor invariant** _(owner: DevSecOps)_
  Given `scripts/dev-supervisor.mjs` is already running for a given port, when `pnpm dev` is invoked a second time, then the new invocation must detect the running supervisor via pidfile + `kill -0` liveness check and exit without spawning a duplicate. Re-running `pnpm dev` while a supervisor is live must attach/no-op, not produce dueling supervisors that fight over the port.

- **AC3 — Discoverable kill pattern** _(owner: DevSecOps)_
  Given `scripts/dev-supervisor.mjs` is running, when a developer runs the documented kill pattern, then all supervisor processes are reliably killed in one command. Either: (a) the supervisor renames its `argv[1]` or sets `process.title` to a value that makes `pkill -f <pattern>` match without needing "apex-team" in the cmdline, OR (b) the pidfile path is documented and `kill $(cat <pidfile>)` is the canonical kill. Recovery instructions in `scripts/dev-supervisor.mjs` or `CLAUDE.md` must reflect whichever pattern is chosen.

- **AC4 — Stale-compile recovery** _(owner: DevSecOps)_
  Given a source file has been cleared of conflict markers but the running Next server cached the broken compile, when any route is hit, then the server must surface the staleness clearly rather than silently 500-ing with the original parse error. Acceptable signals: a logged warning with "compile is N seconds older than source" visible in server output; or `/api/health` returning a non-200 + `{"stale_compile": true}` field; or an automatic recompile trigger on source-newer-than-cache detection. _(OQ-349-001: whether this also requires a dashboard UI surface — see below.)_

- **AC5 — Smoke tests** _(owner: QA)_
  Two QA smokes must pass:
  1. **Conflict-marker smoke:** inject a `<<<<<<<` conflict marker into a tracked source file, hit a route, assert the server fails fast with a recognizable error (not a parse-error 500 cascade), then restore the file and assert recovery.
  2. **Duplicate-supervisor smoke:** spawn a second `pnpm dev` while the first supervisor is running, assert no second supervisor process appears in `pgrep -f dev-supervisor` output, and assert the port is not stolen.

---

## Out of Scope

- Automatically resolving git conflict markers (the guard rejects compilation; resolution is a developer responsibility).
- Cross-machine supervisor detection (AC2 is single-machine only — one supervisor per port per host).
- Alerting external Claude Code sessions on other machines when the server goes down (that is handled by the self-heal L1/L2 layer, US-079/080 — AC4 here covers stale-compile only, not full-server-down recovery).
- Any change to apex-engine's supervisor (this story is scoped to `scripts/dev-supervisor.mjs` in apex-team only).

---

## Open Questions

### OQ-349-001 — AC4 dashboard UI surface

**Status:** Open
**Owner:** UX Designer (routing pending — see UX Designer dispatch in Wave 121+ Lane A)
**Raised by:** BA (Wave 121+, US-084 pre-stage)
**Affects:** AC4 implementation approach + UX gate applicability

**Question:** Does AC4's stale-compile signal require a rendered surface in the dashboard (e.g., a banner, health indicator widget, or warning chip in the sidebar), or is a server-log warning + `/api/health` field sufficient?

**What we know:** The issue body specifies `"compile is N seconds older than source"` as one acceptable signal form, but doesn't mandate a UI surface. The existing self-heal L2 (US-080) already writes a dashboard banner for cascade/manual-mode state.

**What we don't know:** Whether users expect stale-compile state to be surfaced in the same dashboard-banner channel as US-080/083, or whether server-log + health API coverage satisfies the recovery story.

**Working assumption:** AC4 is purely server-side (log + `/api/health` field) unless UX Designer returns a "has UI surface" verdict. If UI surface is confirmed, AC4 spawns a sub-story under US-084 scoped to the banner design + a11y, and the UX gate applies.

**Block:** No — DevSecOps can start AC2/AC3/AC4 (server-side path) without waiting for this answer. Only the UI sub-story blocks on UX verdict.

---

## Links

_(Filled in during and after implementation)_

- impl: (SHA-pending)
- test: (path-pending)
- design-pass-by: (pending OQ-349-001 resolution)
- qa-pass-by: (pending)
- deployed-by: (pending)
