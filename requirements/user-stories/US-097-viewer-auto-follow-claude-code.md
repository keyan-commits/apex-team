# US-097: Viewer auto-follow Claude Code's active project

**Status:** accepted
**Wave:** 121
**Owner:** Backend Developer (server.mjs discovery + registry + auto-follow poll) + UI Developer (badge + toggle UI)
**Authored by:** Business Analyst
**Date:** 2026-06-04

---

## Story

As a user running Claude Code in any project, I want the apex-team viewer at `:3200` to auto-display that project's tickets and info without manual configuration, so that switching projects in Claude Code reflects in the viewer without restarting the server or picking workspaces.

---

## Acceptance criteria

### AC1: Workspace auto-discovery broadened — any `requirements/*` subdir accepted

`loadWorkspaceRegistry()` in `server.mjs` changes its acceptance filter: a candidate directory is included if it contains **any** subdirectory under `requirements/` (not only `requirements/user-stories/`). This includes but is not limited to: `requirements/user-stories/`, `requirements/samples/`, `requirements/domains/`, etc.

Concrete rule: a path `P` is a valid workspace candidate if `existsSync(join(P, 'requirements'))` AND `readdir(join(P, 'requirements'))` returns at least one entry that `isDirectory()`.

All existing callers of the auto-scan filter (depth-1 scan of `dirname(dirname(SELF))`, env-var list, CWD check at startup) apply this broader filter.

**Regression guard:** the existing AC2 auto-scan in US-095 must continue to discover `apex-team` (which has `requirements/user-stories/`). The new broader filter is a strict superset — it adds candidates; it does not remove any previously discovered candidate.

### AC2: Workspace auto-discovery via `~/.claude/projects/` directory scan

`loadWorkspaceRegistry()` gains a fourth discovery source (runs after the depth-1 scan):

1. Resolve the `~/.claude/projects/` directory via `homedir()`.
2. Enumerate all direct children matching the pattern `-*` (directories whose name starts with a dash — these are Claude Code's project-dir encoding).
3. For each such entry, decode its name to an absolute path: replace every `-` with `/`. The raw directory name is the encoded path; decoding is simply replacing all `-` characters with `/`.
   - Example: `-Users-nikoe-Development-Study-apex-team` → `/Users/nikoe/Development/Study/apex-team`
4. Check that the decoded path exists on disk (`existsSync`). If it does not exist, skip it silently (path was valid at some prior session but the directory may have been moved or deleted).
5. Apply the AC1 filter: the decoded path must have a `requirements/` directory with at least one subdirectory. If it fails the filter, skip it silently.
6. Add passing candidates to the registry (de-duplicated by `seen` Set — same as current logic).

If `~/.claude/projects/` does not exist (e.g., Claude Code has never been run on this machine, or it is installed elsewhere), skip the entire step silently — no error or warning.

### AC3: Registry entries include `mostRecent: boolean` from JSONL mtime scan

Each workspace registry entry gains a `mostRecent: boolean` field. The field is computed as follows at registry build time:

1. For each discovered workspace `P`, compute the Claude Code project-dir name by encoding `P`'s absolute path: replace every `/` with `-`.
   - Example: `/Users/nikoe/Development/Study/apex-team` → `-Users-nikoe-Development-Study-apex-team`
2. Resolve the corresponding directory under `~/.claude/projects/<encoded>`.
3. If that directory exists, enumerate all `*.jsonl` files within it (non-recursive) and find the maximum `mtime` across all of them. If no `.jsonl` files exist, the workspace has no recorded mtime (treat as mtime = 0).
4. If the `~/.claude/projects/` directory does not exist, all `mostRecent` fields are `false` (no information available).
5. The workspace with the single highest mtime across all registry entries has `mostRecent: true`. All others have `mostRecent: false`.
6. In case of a tie (same mtime millisecond), the workspace appearing first in registry ordering wins `mostRecent: true`.

The `mostRecent` field is included in the `/api/workspaces` response (see AC3 shape below) and is used by AC4 default resolution.

Updated `/api/workspaces` response shape:

```json
{
  "ok": true,
  "current": "/abs/path/to/active/workspace",
  "workspaces": [
    {
      "path": "/abs/path/to/active/workspace",
      "name": "apex-team",
      "isCurrent": true,
      "mostRecent": true
    },
    {
      "path": "/abs/path/to/other/workspace",
      "name": "lfm",
      "isCurrent": false,
      "mostRecent": false
    }
  ]
}
```

### AC4: Default workspace resolution — "most recent Claude Code project" prepended before env/cwd/fallback

The startup resolution order is extended. Before the current chain (env > cwd > hardcoded fallback), a new first step is inserted:

**New resolution order at startup:**

1. If `APEX_TEAM_ROOT` is set — use it (highest precedence, unchanged from US-095 AC1).
2. Else if the registry contains a workspace with `mostRecent: true` — use that path as the initial active root.
   - This means: if Claude Code has a discoverable project dir whose JSONL is most recently mtime'd, auto-select that workspace.
3. Else if `process.cwd()` contains `requirements/` with at least one subdir — use `process.cwd()` (broadened CWD check matching AC1 filter).
4. Else fall back to the hardcoded default (`/Users/nikoe/Development/Study/apex-team`).

The active root at startup is logged with the resolution source: `[apex-team-viewer] resolved root: <path> (via env|most-recent|cwd|default)`.

**Important:** the registry build (AC2+AC3) runs before resolution step 2. This means `loadWorkspaceRegistry()` is called early in server startup (before the active-root iife) and its `mostRecent` result feeds the resolution.

**Caveat (spec vs. implementation note):** the registry is needed before `activeRoot` is set. The implementation must restructure startup so registry build precedes active-root resolution. This is an architecture concern; the spec mandates the behavior; the implementation approach is at Backend Developer's discretion.

### AC5: `APEX_TEAM_AUTO_FOLLOW=1` — 30s poll that auto-switches root when a more-recent project appears

When the server starts with `APEX_TEAM_AUTO_FOLLOW=1` (or `APEX_TEAM_AUTO_FOLLOW=true`) in the environment:

1. A poll timer runs every 30 seconds (not shorter — filesystem + battery constraint).
2. On each tick, `loadWorkspaceRegistry()` is called **fresh** (bypassing `registryCache` — the registry is rebuilt on each auto-follow poll). The `mostRecent` computation is re-run.
3. If the workspace with `mostRecent: true` differs from the current `activeRoot`, the server auto-switches: `activeRoot` is updated to the most-recent workspace path. The label cache is invalidated (same as a manual switch per US-095 AC8). A log line is emitted: `[apex-team-viewer] auto-follow: switched root to <path> (most-recent mtime)`.
4. The poll does NOT auto-switch if `APEX_TEAM_ROOT` is set — that env var pins the root absolutely.
5. The poll does NOT auto-switch if the user has manually selected a workspace via `POST /api/workspace/switch` within the last 30s (i.e., a manual switch suppresses auto-follow for one poll cycle, preventing a fight between user intent and the auto-follow timer). Manual selections older than 30s are no longer protected.

The server exposes the auto-follow state in `/api/health`: `{ "ok": true, "root": "<active-root>", "port": <N>, "autoFollow": true|false }`.

### AC6: UI "following Claude Code" indicator + toggle

When `APEX_TEAM_AUTO_FOLLOW=1` is active:

- The viewer header shows a badge: `<span id="auto-follow-badge" class="badge">following Claude Code</span>` displayed to the right of the workspace selector (or `<h1>` if no selector is visible).
- The badge is visually distinct from the workspace name — subdued color (e.g., `color: var(--dim)` or equivalent).
- The badge has `title="Viewer auto-follows the most recently active Claude Code project (polls every 30s)"`.
- A toggle button or checkbox `<button id="auto-follow-toggle">` or `<input type="checkbox" id="auto-follow-toggle">` adjacent to the badge allows the user to pause/resume auto-follow for the current session (in-memory only — does not modify the env var or persist across page reloads).
- When paused, the badge text changes to `auto-follow paused` and the toggle reflects the paused state.
- The title and `<h1>` update per AC6 of US-095 (already specified there — this AC only adds the badge and toggle).

When `APEX_TEAM_AUTO_FOLLOW` is not set (default): neither badge nor toggle is rendered.

### AC6 (title/h1 verification — US-095 regression)

The `<title>` and `<h1>` behavior from US-095 AC5 must continue to work correctly under the new default resolution (AC4). Specifically:

- When the viewer starts and auto-selects the most-recently-active Claude Code project (AC4 step 2), the title and `<h1>` must reflect that project's workspace name on first page load — not the hardcoded fallback.
- This is a regression check, not new behavior.

### AC7: Test coverage — `tests/qa/wave-121/viewer-auto-follow.test.ts`

QA authors `tests/qa/wave-121/viewer-auto-follow.test.ts`. The file must cover ALL of the following cases using mock filesystem state (no real `~/.claude/projects/` reads in tests):

**Positive cases:**
1. Registry with two workspaces where apex-team's JSONL has mtime 1780568484 and LFM's JSONL has mtime 1780400000 → `mostRecent` is `apex-team`. Active root resolves to apex-team path (AC4 step 2).
2. Registry with two workspaces where LFM's JSONL has mtime 1780600000 and apex-team's JSONL has mtime 1780568484 → `mostRecent` is `lfm`. Active root resolves to LFM path.
3. Auto-follow poll detects LFM becomes most-recent mid-session → `activeRoot` switches to LFM path; log line emitted.

**Negative cases:**
4. `~/.claude/projects/` directory does not exist → registry falls back to Wave 119 (US-095) behavior gracefully; all `mostRecent` fields are `false`; no error thrown.
5. `APEX_TEAM_ROOT` set → auto-follow poll does NOT switch away from the pinned root even if a different workspace becomes most-recent.
6. Manual switch within the last 30s → auto-follow poll does NOT switch on the next tick.

**Edge cases:**
7. Decoded path from `~/.claude/projects/` entry does not exist on disk → entry is silently skipped; no crash; registry proceeds with remaining entries.
8. Workspace has `requirements/` directory but it has no subdirectories (empty `requirements/`) → fails AC1 filter; silently skipped; no crash.
9. Two workspaces with identical JSONL mtime → first in registry ordering wins `mostRecent: true`.
10. Multiple mock `.claude/projects/` states (iterate: 0 projects, 1 project, 3 projects with varying mtimes) — all states handled without crash. Per Wave 118 comprehensive-coverage discipline, all mocked states must be enumerated in the test.

The test file must be on disk (not chat-bubble code). Per US-085/QA discipline: tests are files, not conversation artifacts.

---

## Out of scope

- **Modifying Claude Code's JSONL writing.** The viewer uses JSONL mtime as a read-only signal. Claude Code's internal session-file format is not changed.
- **Polling intervals shorter than 30s.** Battery and filesystem load concerns. If a faster response is desired, restart the server with `APEX_TEAM_ROOT` pinned.
- **Mac-2 deployment instructions.** The other Mac needs to `git pull` the apex-team-viewer repo and restart the server. A doc-update to the viewer's `README.md` is sufficient — no new deployment automation in this wave.
- **Cross-machine sync.** Each viewer instance reads only its own machine's `~/.claude/projects/`. Remote project detection is out of scope.
- **Windows path encoding.** Claude Code's project-dir encoding on Windows may differ (backslash vs. slash). Out of scope — viewer targets macOS/Linux.
- **Auto-follow persisting across server restarts.** `APEX_TEAM_AUTO_FOLLOW` controls the feature. Server restart re-evaluates `mostRecent` at startup (AC4 step 2) — that is the persistence mechanism.

---

## Technical notes (non-normative — advisory for Backend Developer + UI Developer)

- Claude Code project-dir encoding: `~/.claude/projects/` contains directories whose names are the project's absolute path with every `/` replaced by `-`. There is no escaping beyond this substitution. Decoding is the inverse: replace every `-` with `/`. Leading dash gives the leading `/` of the absolute path.
  - Example: `-Users-nikoe-Development-Study-lfm` decodes to `/Users/nikoe/Development/Study/lfm`.
- JSONL files within a project dir are named `<uuid>.jsonl` and are written by Claude Code during sessions. The file mtime is the signal; the content is not read by the viewer.
- `registryCache` is currently set once and never cleared. Auto-follow (AC5) must bypass the cache on each poll tick. The simplest implementation: pass a `{ fresh: boolean }` option to `loadWorkspaceRegistry()`, clearing `registryCache = null` before the call when `fresh: true`.
- The AC4 startup restructuring (registry build before active-root resolution) requires moving `loadWorkspaceRegistry()` out of the request handler and into an async server-init block. Server listen should be deferred until init completes.
- The "manual switch suppresses one auto-follow tick" rule (AC5 step 5) can be implemented with a module-level `lastManualSwitchAt` timestamp, checked in the poll callback.

---

## Linked business rules

- BR-019 (from US-095): viewer always reflects the workspace the server is currently pointed at.
- BR-020 (from US-095): depth-1 auto-scan of parent-of-parent directory.
- BR-021 (new, this story): viewer reads `~/.claude/projects/` JSONL mtime as a read-only signal to determine the most recently active Claude Code project; it never writes to or modifies Claude Code's session files.
- BR-022 (new, this story): `APEX_TEAM_ROOT` env var is an absolute pin — auto-follow never overrides it.

---

## Definition of done

- [ ] `server.mjs` in `apex-team-viewer` repo implements AC1–AC5 (Backend Developer).
- [ ] `public/index.html` + `public/app.js` in `apex-team-viewer` repo implement AC6 badge + toggle (UI Developer).
- [ ] `tests/qa/wave-121/viewer-auto-follow.test.ts` exists on disk and passes (QA — 10 test cases minimum per AC7).
- [ ] `/api/workspaces` response includes `mostRecent` field (Backend Developer).
- [ ] `/api/health` includes `autoFollow` field (Backend Developer).
- [ ] `pnpm test:run` green in apex-team repo (AC7 regression).
- [ ] US-097 status updated to `done` with impl commit SHA + test file reference.
