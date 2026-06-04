# US-095: Viewer workspace switcher

**Status:** accepted
**Wave:** 119
**Owner:** UI Developer (viewer implementation) + Backend Developer (server.mjs `/api/workspaces` endpoint + discovery logic)
**Authored by:** Business Analyst
**Date:** 2026-06-04

---

## Story

As a user running the apex-team viewer on multiple machines (each working on a different project), I want the viewer to automatically display the current project's tickets and info without restarting the server, so that I can see apex-team info on my apex-team Mac and LFM info on my LFM Mac — with the ability to manually switch projects within the UI if I choose.

---

## Acceptance criteria

### AC1: Default workspace resolution — env var > CWD > hardcoded fallback

When `server.mjs` starts:

1. If the `APEX_TEAM_ROOT` environment variable is set to a non-empty string, use it as the workspace root. (Existing behavior — preserved.)
2. Else if the server is launched from a directory that contains a `requirements/user-stories/` subdirectory, use that directory as the workspace root (i.e., `process.cwd()` at server startup).
3. Else fall back to the hardcoded default (`/Users/nikoe/Development/Study/apex-team`). This preserves backward-compatibility for users who launch the server from a neutral directory.

The active root at startup is logged to stdout: `[apex-team-viewer] resolved root: <path> (via env|cwd|default)`.

### AC2: Workspace auto-discovery at startup

On server startup, the server scans for candidate workspace roots:

1. **Environment list** — if the env var `APEX_TEAM_WORKSPACES` is set, parse it as a colon-separated list of absolute paths (`/path/a:/path/b`). Each path is validated (must be an absolute path that exists on disk). Invalid entries are silently skipped with a startup warning.
2. **Auto-scan** — scan `~/Development/Study/*` (i.e., the parent directory two levels above the server file itself, `dirname(dirname(SELF))`). Any direct child directory that contains a `requirements/user-stories/` subdirectory is included as a candidate. Scan depth is exactly 1 (no recursion beyond the immediate children of the parent dir). If the parent dir doesn't exist, skip silently.
3. **Current root** — the resolved workspace root from AC1 is always included, even if it does not appear in the scan.

The de-duplicated candidate list is the workspace registry. It is computed once at startup (not re-scanned on each request). Ordering: current root first, then `APEX_TEAM_WORKSPACES` entries (in order), then auto-scan results (alphabetical).

### AC3: `/api/workspaces` endpoint

`GET /api/workspaces` returns JSON:

```json
{
  "ok": true,
  "current": "/abs/path/to/active/workspace",
  "workspaces": [
    { "path": "/abs/path/to/active/workspace", "name": "apex-team", "isCurrent": true },
    { "path": "/abs/path/to/other/workspace",  "name": "lfm",        "isCurrent": false }
  ]
}
```

Field definitions:
- `path`: absolute path on the server's filesystem.
- `name`: the directory basename (`path.basename(path)`).
- `isCurrent`: true for the active workspace only.

The endpoint is read-only (GET). No write/switch endpoint — workspace switching is server-side state mutation handled by AC4.

### AC4: In-header workspace selector (dropdown)

In `index.html`, between the `<h1>` and the `<nav id="tabs">` (or immediately to the right of the `<h1>`):

- A `<select id="workspace-select">` element listing all workspace names from `/api/workspaces`.
- The option matching `isCurrent: true` is pre-selected.
- Selecting a different option sends `POST /api/workspace/switch` with body `{ "path": "<abs-path>" }`.
- The server validates the path is in the workspace registry (returns 400 if not); on success, it updates the server's active root in memory (`ROOT` variable) and returns `{ "ok": true }`.
- The client reloads all data panels (tickets, now, artifacts) after a successful switch without a full page reload.
- The selector is hidden if only one workspace is discovered (no point showing a single-item dropdown).
- The selector has `aria-label="Switch workspace"`.

### AC5: Active workspace label in header

The `<h1>` text changes to reflect the active workspace:

- Format: `<workspace-name> <span class="dim">viewer</span>` — e.g., `apex-team viewer` or `lfm viewer`.
- On workspace switch (AC4), the `<h1>` updates without page reload.
- The page `<title>` also updates to `<workspace-name> — apex-team viewer`.

### AC6: localStorage persistence of last selection

- On workspace switch (AC4 success), the client stores `{ "workspacePath": "<abs-path>" }` in `localStorage` under the key `apex-team-viewer.workspace`.
- On page load, if the stored path matches a workspace in `/api/workspaces`, the client pre-selects it and sends the switch request silently (no flash of old content — show a loading state until the switch resolves).
- If the stored path is no longer in the workspace list (e.g., project deleted), the stored preference is cleared and the server's current root is used.

### AC7: Graceful fallback for workspaces without `requirements/user-stories/`

- If the active workspace has no `requirements/user-stories/` directory, `/api/tickets` returns `{ "ok": true, "tickets": [], "warning": "no requirements/user-stories/ directory found in workspace" }` rather than an error.
- The tickets panel displays: "No tickets found. This workspace has no `requirements/user-stories/` directory." with a subdued style (not an error state).
- `/api/now` similarly falls back gracefully: if `HANDOFF.md` does not exist in the root, return `{ "ok": true, "handoff": "(No HANDOFF.md found in this workspace.)" }`.
- These fallbacks apply to all API endpoints that read from the workspace root — none of them should return a 500 on a missing directory.

### AC8: Workspace switch updates all server-side reads

After a successful workspace switch (AC4):
- All subsequent API calls (`/api/now`, `/api/tickets`, `/api/artifacts`, `/api/file`, `/api/ci`, `/api/prs`) read from the new workspace root.
- `/api/ci` and `/api/prs` run `gh` with `cwd` set to the new workspace root (so `gh` picks up the correct git remote).
- The `/api/health` response includes the currently active root: `{ "ok": true, "root": "<active-root>", "port": <N> }`.

### AC9: Test fixtures scaffold (QA prerequisite)

QA must scaffold the following sample workspaces under `requirements/samples/wave-119-viewer-workspaces/` in the apex-team repo. The US specifies the three required fixture cases; QA owns creation of the actual files:

1. **`workspace-happy/`** — a directory containing `requirements/user-stories/` with at least one valid `US-NNN-*.md` file (happy path: tickets panel shows tickets).
2. **`workspace-no-requirements/`** — a directory with no `requirements/` subdirectory at all (graceful fallback: tickets panel shows "no tickets" warning, no 500).
3. **`workspace-malformed-us/`** — a directory containing `requirements/user-stories/` with at least one `.md` file that is missing the `**Status:**` line and has no H1 heading (negative test: the ticket appears with `status: unknown` and a fallback title, not a crash).

QA's positive, negative, and edge-case tests for this story must iterate over all three fixture workspaces. See `requirements/samples/wave-119-viewer-workspaces/README.md` (QA authors this) for fixture layout.

### AC10: Regression — existing behavior preserved

All prior test suites (`pnpm test:run`) pass green after this wave ships. The switcher is additive; no existing API contract is broken:
- `/api/tickets`, `/api/now`, `/api/artifacts`, `/api/file`, `/api/ci`, `/api/prs`, `/api/health` remain available at the same paths.
- If `APEX_TEAM_ROOT` is set, it continues to take precedence over CWD (AC1 — no regression).
- The viewer serves on port `:3200` by default (unchanged).

---

## Out of scope

- **Manual config file** (`~/.claude/apex-team-viewer-workspaces.json`): deferred. The `APEX_TEAM_WORKSPACES` env var (AC2) covers the explicit-list case without requiring a separate config-file parser. Re-file as a follow-up if users need a persistent non-env registry.
- **Runtime re-scan**: workspaces are discovered once at startup (AC2). A "refresh workspace list" button or inotify/FSEvents-based watcher is deferred.
- **Multi-user / auth**: viewer is a single-user local tool. No auth layer on the switch endpoint.
- **Remote workspaces**: only paths reachable on the server's local filesystem are supported. SSH/rsync workspace remotes are out of scope.
- **apex-team-viewer repo itself as a workspace**: the viewer repo does not have a `requirements/user-stories/` directory and will not appear in auto-scan unless one is added.
- **Viewer CI/CD**: the viewer is a standalone Node.js process; no containerization or deployment target changes in this wave.
- **Persisting switch across server restarts**: the server always starts with the root resolved by AC1. The localStorage-based persistence (AC6) applies only to in-session client-side preferences between page loads, not server-side state across restarts.

---

## Technical notes (non-normative — advisory for UI Dev + BE Dev)

- `safeJoin` in `server.mjs` is currently scoped to the startup `ROOT`. After a workspace switch, it must be updated to reflect the new root, or the helper must be refactored to accept the active root as a parameter rather than closing over the module-level constant.
- The `ROLE_PATHS` map in `server.mjs` is workspace-relative (e.g., `requirements`, `architecture`). These paths are intentionally relative and apply to any workspace — no change needed there.
- `/api/workspace/switch` mutates server-side in-memory state. Concurrent requests during a switch should be handled gracefully (the server is single-threaded Node.js, so the risk is low, but note it explicitly).
- `gh run list` and `gh pr list` commands in `getCi()` / `getPrs()` must use the new root as `cwd` after a switch. Currently `cwd: ROOT` — this must become a reference to the live active-root variable, not the startup constant.
- The label cache (`labelCache`) in `getTickets()` is keyed per-run, not per-workspace. After a workspace switch, the cache should be invalidated (reset `labelCache = { map: null, fetchedAt: 0 }`) so the new workspace's GH issues are fetched fresh.

---

## Linked business rules

- BR-019 (implied): viewer always reflects the workspace the server is currently pointed at; it never serves data from a workspace other than the active root.
- BR-020 (new): auto-discovery scans only the immediate children of the parent-of-parent directory of the viewer's own location (depth-1 scan). Deeper nesting is out of scope.

---

## Definition of done

- [ ] `requirements/samples/wave-119-viewer-workspaces/` contains all three fixture workspaces (QA).
- [ ] `tests/qa/wave-119/viewer-workspace-switcher.test.ts` exists on disk and passes (QA).
- [ ] `server.mjs` in `apex-team-viewer` repo implements AC1–AC8 (UI Dev + BE Dev).
- [ ] `public/index.html` and `public/app.js` in `apex-team-viewer` repo implement AC4–AC6 (UI Dev).
- [ ] `pnpm test:run` green (apex-team repo — AC10).
- [ ] US-095 status updated to `done` with impl commit SHA + test file reference.
