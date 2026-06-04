# ui-developer — HANDOFF

## ⏭️ NOW — 2026-06-05 — Wave 131: viewer shell-injection fix (SHIPPED)

### Wave-131 PASS verdict — PR #420 — SHA f43eded0ccd3ab93723b63c661806d52c723b158

- **Gate role:** ui-developer (security fix — self-attested; Architect gate required before merge)
- **Timestamp:** 2026-06-05T00:00:00Z
- **Viewer PR:** `keyan-commits/apex-team-viewer#16` (branch `feature/wave-131-shell-injection-fix`, commit `847b7c4`)
- **apex-team HANDOFF refresh:** this branch `feature/wave-131-handoff-refresh` off `f43eded0ccd3ab93723b63c661806d52c723b158`

**Vulnerability fixed (closes apex-team-viewer#14):**

`spawn(command, args, { cwd, env, shell: command === './gradlew' })` in `server.mjs:886` was passing args through `/bin/sh -c` when the gradle wrapper was used. A Java test filename containing shell metacharacters (e.g. `Bad$(touch${IFS}tmp-pwned)Test.java`) would cause command execution when ▶ Run is clicked. Fixed by dropping the `shell:` option entirely — Node resolves `./gradlew` via `cwd` without a shell.

**Deliverables (all in `keyan-commits/apex-team-viewer` PR #16):**

1. `server.mjs` — dropped `shell: command === './gradlew'` (line 886). Added explanatory comment. Replaced with `// No shell:true — args are passed as argv elements`.

2. `__tests__/spawn-safety.test.ts` (new, 7 tests):
   - Class-name literal preservation for gradle + maven with `$(...)` and backtick filenames.
   - Spawn-shape contract: resolver return value has no `shell` property for gradle (wrapper + bare), maven, playwright runners.

**Test results:**
- `npm run test` in viewer repo → 28/28 PASS (21 Wave 130 + 7 new Wave 131)
- No `shell: true` or `shell:` option remaining in server.mjs (confirmed via `grep`)

**Audit of other spawn/exec sites in server.mjs:**
- Line 918: `spawn('gh', args, { cwd: root })` — no `shell` option. Safe.
- No other `spawn` or `exec` calls found.

## ⏭️ PREV — 2026-06-04 — Wave 130: viewer polyglot ▶ RUN (SHIPPED)

### Wave-130 PASS verdict — PR #13 — SHA 6d7f0fdb0c9af73a27303407175ec4a8b956a03b

- **Gate role:** ui-developer (implementation complete; all gates PASS — Architect PASS @ `dd70fff`, UX PASS @ `b205ec1`, merged 2026-06-04)
- **Timestamp:** 2026-06-04T00:00:00Z
- **Viewer PR:** `keyan-commits/apex-team-viewer#13` (merged, SHA `6d7f0fdb0c9af73a27303407175ec4a8b956a03b`)
- **apex-team HANDOFF refresh PR:** #416 merged, SHA `0fbbd620d3e018430942d5d558867e8d6e9d7616`
- **Merge SHA backfill (DevSecOps 2026-06-04):** viewer PR #13 → `6d7f0fdb0c9af73a27303407175ec4a8b956a03b`; apex-team PR #416 → `0fbbd620d3e018430942d5d558867e8d6e9d7616`.

**Deliverables (all in `keyan-commits/apex-team-viewer` PR #13):**

1. `lib/runner-resolver.mjs` — extracted runner resolver with injected I/O for testability. Exports `createResolver(io)` factory + `resolveRunner` default (uses real `node:fs`). Core functions: `findAncestorContaining`, `detectPackageManager`, `resolveJsRunner`, `resolvePlaywrightRunner`, `resolveJavaRunner`.

2. `server.mjs`:
   - Imports `resolveRunner` + `detectPackageManager` from `lib/runner-resolver.mjs`.
   - `VITEST_TIMEOUT_MS` (60s default, `APEX_VIEWER_VITEST_TIMEOUT_MS` env) + `MAVEN_TIMEOUT_MS` (300s default, `APEX_VIEWER_MAVEN_TIMEOUT_MS` env).
   - `walkQaPolyglot(root)` — walks full workspace (or `.apex-viewer.json`-scoped project roots), discovers `*.test.ts|tsx|js|jsx|mjs`, `*.spec.*`, `*Test.java`, `*Tests.java`. Skips `node_modules/.git/dist/build/target/.next/.gradle/_archive`. Pre-resolves `{ runner, cwd }` for each discovered file.
   - `loadProjectRoots(root)` + `autoDetectProjectRoots(root, depth=3)` — `.apex-viewer.json` optional config or auto-detect by scanning for build files.
   - `listRoleGrouped` — QA role now uses `walkQaPolyglot`; runner/cwd metadata propagated to ticket objects.
   - `runTest` — now async. Resolves runner before spawn. `start` SSE event emits JSON `{ command, cwd, runner }`. Timeout varies by runner.
   - `/api/run-test` route updated to `await runTest(...)`.

3. `public/app.js`:
   - `TEST_RE` broadened to include Java test files.
   - `renderTicketRow` — runner badge `[vitest]`/`[jest]`/etc. added before ▶ Run button (when `f.runner` present and not `'unknown'`).
   - Ungrouped rows in `renderOutput` — same runner badge logic.
   - `start` SSE listener — handles JSON format (shows resolved command + cwd) with fallback to legacy plain-text.

4. `public/style.css` — `.runner-badge` + `.runner-badge.runner-<name>` per-runner accent colors (vitest/jest/playwright/maven/gradle).

5. `__tests__/runner-resolver.test.ts` — 19 unit tests. All pass (`npm test` → 19/19).

6. `package.json` — added vitest devDependency + `test`/`test:watch` scripts.

**Verification:**
- `npm test` in viewer repo → 19/19 PASS
- apex-team `pnpm test:run` → 722/723 PASS (1 pre-existing skip — baseline unchanged)
- Server syntax check → module loads correctly (port-in-use expected on re-import)

**Gate routing:**
- Viewer PR #13 touches rendered UI (app.js, style.css) → UX Designer gates UI
- Server-side logic (server.mjs, lib/runner-resolver.mjs) → Architect gates
- QA can verify against viewer PR branch directly

**Project-agnostic notes:**
- Zero hardcoded paths. LFM `new/b2b-portal/` "just works" via auto-detect.
- `.apex-viewer.json` at workspace root optionally pins discovery to named sub-roots.
- `walkQaPolyglot` skip-list covers all common build output dirs.

## ⏭️ PREV — 2026-06-04 — Wave 127: viewer FE Dev → UI Dev rename

### Wave-127 PASS verdict — PR #412 — SHA 9c05edf7656a6fe8bfcd88d53d63e06fb42d48b1
- **Gate role:** ui-developer (self-attestation — viewer-only rename, no runtime logic change)
- **Timestamp:** 2026-06-04T00:00:00Z
- **Notes:** Renamed "FE Dev" tab to "UI Dev" in sibling viewer repo PR `keyan-commits/apex-team-viewer#12` (branch `feature/wave-127-ui-dev-rename`). Consistent with apex-team role id `ui-developer`. Also extended `ROLE_PATHS['ui-developer']` paths to include `frontend/features` + `frontend` dirs so Wave 126 FE artifacts surface in the tab. apex-team-side artifact = this HANDOFF refresh on PR #412.

**Deliverables (all in `keyan-commits/apex-team-viewer` PR #12):**
1. `public/index.html` — `data-role="fe-developer"` → `"ui-developer"`, button text `FE Dev` → `UI Dev`
2. `server.mjs` — `ROLE_PATHS` key `'fe-developer'` → `'ui-developer'`; paths extended to `['frontend/features', 'frontend', 'src/features', 'src']`

**Verification:**
- `curl 'http://localhost:3200/api/artifacts?role=ui-developer'` → `{ "role": "ui-developer", ... }` PASS
- No `fe-developer` key remaining in `ROLE_PATHS`

**Gate routing:**
- UI-touching change → UX Designer gates; server-side path extension → Architect may review
- No apex-team source code changed; this apex-team PR is doc-only HANDOFF refresh

## ⏭️ PREV — 2026-06-04 — Wave 126: US-102 AC16 — Plan C clause in Wave 122 standard (merged in PR #411)

### Wave-126 PASS verdict — PR #411 — SHA 60a2c750eeef9faa10a5c19ac07c060774efb6df
- **Gate role:** ui-developer (self-attestation — single-file body amendment, no runtime code)
- **Timestamp:** 2026-06-04T21:41:00Z
- **Notes:** AC16 of US-102 implemented. Inserted Plan C clause as a new paragraph within the existing `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` section of `.claude/agents/ui-developer.md`. Anchor heading unchanged (byte-identical). Verification: cleanliness 153/153, FEAT-0001 38/38.

## ⏭️ PREV — 2026-06-04 — Wave 125: viewer a11y polish (US-101 AC1-AC5)

### Wave-125 PASS verdict — PR #407 — SHA 16f3fa0067537aeed4c21622df03e2c7296fe93b
- **Gate role:** ui-developer
- **Timestamp:** 2026-06-04T00:00:00Z
- **Notes:** Wave 125 viewer a11y polish (US-101 AC1–AC4) implemented in sibling viewer PR #10 (`keyan-commits/apex-team-viewer#10`, commit `f677573`). apex-team-side artifacts on this PR #407 (branch `feature/125-viewer-a11y-polish`): updated `coordination/handoffs/ui-developer.md` Wave 125 NOW. No `architecture/` edits; no peer HANDOFF docs edited.

**Deliverables (all in `keyan-commits/apex-team-viewer` PR #10):**

1. `public/style.css`:
   - AC1: `.search:focus-visible { outline: 2px solid #6a8cd6; outline-offset: 1px; }` added after `.search:focus` (WCAG 2.4.11).
   - AC2: `.feat-card-header:focus-visible` — changed `outline: 2px solid #6a8cd640` (25% alpha, 1.43:1) → `outline: 2px solid #6a8cd6` (solid, 5.59:1). `outline-offset: -2px` → `outline-offset: 1px`. `.badge-btn:focus-visible` — same alpha→solid fix, offset `2px` → `1px` (WCAG 1.4.11).
   - AC3 support: `.file-open:focus-visible { outline: 2px solid #6a8cd6; outline-offset: 1px; border-radius: 2px; }` added.
   - AC5 sweep: `.select:focus-visible` also had `#6a8cd640` alpha defect — corrected to solid `#6a8cd6` (same sweep pass).

2. `public/app.js`:
   - AC3: All four `.file-open` render paths updated — `renderTickets` (tickets tab, line ~121), `renderTicketRow` (FEAT card rows, line ~176), pipelines section (line ~195), ungrouped flat rows (line ~266) — each span gets `tabindex="0" role="button"`.
   - AC3: Keydown handler wired at both `#output-list .file-open` and `#tickets-list .file-open` event sites. Enter/Space → `openFile(path)`; Space also `e.preventDefault()` to block page scroll.
   - AC4: `.feat-card-header` button gets `id="feat-header-${feat.feat}"`. `.feat-card-body` gets `role="region"` + `aria-labelledby="feat-header-${feat.feat}"` (WCAG 4.1.2).

**Gate routing:**
- Viewer PR #10 touches rendered UI → UX Designer gates
- No server-side changes — Architect gate not required for this PR
- QA authors `tests/qa/features/FEAT-0004-viewer-a11y-polish/TEST-0004-viewer-a11y-polish.test.ts` (AC6/US-101)

## In flight
- Viewer PR #10 open at `keyan-commits/apex-team-viewer` — awaiting UX Designer + QA gates.

## Next
- After QA PASS: HANDOFF to DevSecOps to merge viewer PR #10.

## Notes
- apex-team has no active rendered UI surface. All Wave 125 viewer code lives in `keyan-commits/apex-team-viewer`.
- AC5 sweep found `.select:focus-visible` also had the alpha defect (not in original 4 issues). Fixed in same pass — brings all focus rings to canonical `#6a8cd6` solid token.
- Keydown handler placement: in `renderOutput()` (output tab) the handler covers both `#output-list` and `#tickets-list` elements so a single wire-up site handles both tabs. In `renderTickets()` the tickets-list handler is co-located with the click handler for clarity.

## ⏭️ PREV — 2026-06-04 — Wave 123: viewer FEAT-grouped rendering (US-099 AC1-AC7 AC9)

### Wave-123 PASS verdict — PR #6 — SHA a4ce3c752aa3cd75d25030ca47ec964038aee8a3
- **Gate role:** ui-developer (self-attestation — implementation complete, awaiting Architect + UX + QA gate)
- **Timestamp:** 2026-06-04T20:16:00Z
- **Notes:** AC1-AC7 + AC9 implemented and manually verified (see round-trip verification below). apex-team `pnpm test:run` 603/605 PASS (6 pre-existing file-level failures, 1 pre-existing test failure — no new failures introduced). Viewer changes in **sibling-repo PR `keyan-commits/apex-team-viewer#6`** (branch `feature/wave-123-feat-grouped-rendering`, viewer commit `28b76aa226ae00bca3c16aac236ff7275ab50560`). No `architecture/` edits; no peer HANDOFF docs edited.

**Deliverables (all in `keyan-commits/apex-team-viewer` PR #6):**

1. `server.mjs`:
   - AC2: `parseFrontmatter(content)` — simple regex extractor for `---`…`---` blocks. Extracts `ticket`, `parent_feat`, `feat`, `parent_us`, `role`, `status`. Fail-soft: returns `null` on failure, file goes to `ungrouped`.
   - AC1+AC2: `listRoleGrouped(role)` replaces `listRole(role)` in the `/api/artifacts` route. Returns `{ role, features[], ungrouped[], pipelines? }`. Groups files by `parent_feat:` (all roles) or `feat:` (BA-owned FEAT files). FEAT title resolved from `requirements/features/FEAT-NNNN-*.md` (frontmatter `title:` or first H1).
   - AC5: `features[]` sorted FEAT ID descending; `tickets[]` sorted by numeric ticket ID descending (mtime fallback).
   - AC6: `ROLE_PATHS` extended with `fe-developer: ['src/features', 'src']` and `be-developer: ['src/features', 'src']`. Tolerant — returns empty arrays if dirs absent.
   - AC9: DevSecOps `listRoleGrouped` returns extra `pipelines: []` field from `ops/pipelines/`. Empty if dir absent.

2. `public/index.html`:
   - AC6: `<button data-role="fe-developer">FE Dev</button>` + `<button data-role="be-developer">BE Dev</button>` added to `#role-tabs` nav after DevSecOps.

3. `public/app.js`:
   - AC3: `renderOutput()` rewritten. Renders FEAT collapsible cards (collapsed default, chevron toggle, `aria-expanded`). Each card: FEAT ID + title + ticket count header; expandable body with ticket rows.
   - AC3: Legacy/Unsorted section below FEAT cards for `ungrouped` files.
   - AC9: Reusable Pipeline Templates section above FEAT cards for DevSecOps (hidden if `pipelines` is empty).
   - AC7: Search filters across FEAT title + slug + ticket ID + path. Cards with no matching tickets + no FEAT header match are hidden.
   - AC4: Ticket row clicks call existing `openFile(path)` — no new drawer logic.

4. `public/style.css`:
   - `.feat-card`, `.feat-card-header`, `.feat-card-body`, `.feat-ticket-row`, `.feat-cards`, `.feat-section`, `.feat-section-heading`, `.feat-empty`, `.pipelines-section` styles added.
   - AC5: Status pills in ticket rows reuse existing `.ticket-status` CSS classes — zero new color rules.
   - `prefers-reduced-motion: reduce` guard on `.feat-card-header { transition: none }`.
   - `:focus-visible` ring on `.feat-card-header` (Wave 112 a11y lesson applied).

**Round-trip verification:**
- `GET /api/artifacts?role=ba` → `{ features: [{feat: 'FEAT-0003', ...}, {feat: 'FEAT-0002', ...}, {feat: 'FEAT-0001', ...}], ungrouped: [...50 files...] }` (FEAT-0003 first, descending)
- `GET /api/artifacts?role=devsecops` → `{ features: [], ungrouped: [...], pipelines: [{path: 'ops/pipelines/dev.sh', ...}, ...4 files...] }`
- `GET /api/artifacts?role=fe-developer` → `{ features: [], ungrouped: [] }` (graceful empty)
- `GET /api/artifacts?role=unknown` → `{ role: 'unknown', features: [], ungrouped: [] }` (graceful)
- apex-team `pnpm test:run` → 603/605 PASS (6 pre-existing file failures + 1 pre-existing test failure — unchanged from main baseline)

**Peer-edit boundary:** only own HANDOFF doc + viewer repo files. No `architecture/` edits.

**Gate routing:**
- Viewer PR #6 touches rendered UI (index.html, app.js, style.css) → UX Designer gates UI
- Server-side logic (server.mjs) → Architect gates
- QA authors `tests/qa/features/FEAT-0002-viewer-feat-grouped-rendering/TEST-NNNN-*.test.ts` (AC8)

## In flight
- Viewer PR #6 open at `keyan-commits/apex-team-viewer` — awaiting Architect + UX Designer + QA gates.

## Next
- After QA PASS: HANDOFF to DevSecOps to merge viewer PR #6.

## Notes
- apex-team has no active rendered UI surface. All Wave 123 viewer code lives in `keyan-commits/apex-team-viewer`.
- AC8 (regression tests) is QA's deliverable — running in parallel.
- `featTitleCache` is invalidated on workspace switch (uses `featTitleRoot` guard).

## ⏭️ PREV — 2026-06-04 — Wave 121: viewer auto-follow Claude Code (US-097 AC1-AC6)

### Wave-121 PASS verdict — PR #0 — SHA 8e6fbc61393588bf420d6f9f9081951c4c14b4f4
- **Gate role:** ui-developer (self-attestation — implementation complete, awaiting Architect + UX + QA gate)
- **Timestamp:** 2026-06-04T18:32:00Z
- **Notes:** AC1-AC6 implemented and manually verified. apex-team `pnpm test:run` 533/534 PASS (1 skipped intentionally). Viewer changes in **sibling-repo PR `keyan-commits/apex-team-viewer#4`** (branch `feature/wave-121-auto-follow`, viewer commit `6d580c9`). No `architecture/` edits; no peer HANDOFF docs edited.

**Deliverables (all in `keyan-commits/apex-team-viewer` PR #4):**

1. `server.mjs`:
   - AC1: `isValidWorkspace(p)` — accepts any `requirements/*` subdir (strict superset of old filter)
   - AC2: `scanClaudeCodeProjects` logic inside `loadWorkspaceRegistry()` — enumerates `~/.claude/projects/`, decodes with naive `-`→`/`, existence-checks and skips on miss (e.g. `apex-team` → `apex/team` fails silently; discovered via `add(activeRoot)` step 1 instead)
   - AC3: `getWorkspaceJsonlMtime(p)` — encodes path with `/`→`-`, scans `~/.claude/projects/<encoded>/*.jsonl` for max mtime; `mostRecent: boolean` annotated on all entries
   - AC4: `initServer()` async init block — registry built first, then resolution: `env → mostRecent → cwd (broadened) → fallback`; logs resolution source
   - AC5: `APEX_TEAM_AUTO_FOLLOW=1` enables 30s `setInterval` poll; `autoFollowPaused` + `lastManualSwitchAt` tracking; `POST /api/auto-follow/toggle` endpoint; `/api/health` returns `{ autoFollow, autoFollowPaused }`; `loadWorkspaceRegistry({ fresh: true })` bypasses cache on each poll tick
   - `registryCache` now supports `{ fresh: true }` arg to force rebuild

2. `public/index.html`:
   - AC6: `<span id="auto-follow-badge">` + `<button id="auto-follow-toggle">` added after `<select id="workspace-select">`; both `hidden` by default; button has `aria-label` + `aria-pressed` for a11y

3. `public/app.js`:
   - AC6: `updateAutoFollowUI(health)` wires badge text + toggle state from `/api/health` response
   - `loadHealth()` calls `updateAutoFollowUI()` on each tick
   - Toggle click handler POSTs to `/api/auto-follow/toggle`, updates badge state optimistically

4. `public/style.css`:
   - `.badge` — subdued secondary style (color: #6a6e78, background: #131318, border: #2a2a32)
   - `.badge-btn` — icon-only button with `:focus-visible` ring and `aria-pressed` style
   - `:focus-visible` added to `.select` (Wave 112 a11y lesson applied)

**Round-trip verification:**
- `GET /api/workspaces` → `mostRecent: true` on apex-team entry
- `GET /api/health` → `{ autoFollow: true, autoFollowPaused: false }` with `APEX_TEAM_AUTO_FOLLOW=1`
- `POST /api/auto-follow/toggle` → toggles `autoFollowPaused` correctly
- `APEX_TEAM_ROOT=...` → `via env` logged, no auto-follow poll started
- Without `APEX_TEAM_AUTO_FOLLOW` → `via default`, health shows `autoFollow: false`, badge hidden
- `POST /api/auto-follow/toggle` without `APEX_TEAM_AUTO_FOLLOW` → 400 `auto-follow not enabled`
- apex-team `pnpm test:run` → 533/534 PASS

**Known limitation:** naive `-`→`/` decode in AC2 fails for project dirs with dashes in their name (e.g. `apex-team` → `apex/team`). `existsSync()` silently skips. Projects like `apex-team` still discovered via `add(activeRoot)` on startup. Documented in PR description.

**Peer-edit boundary:** only own HANDOFF doc + viewer repo files. No `architecture/` edits.

**Gate routing:**
- Viewer PR #4 touches rendered UI (index.html, app.js, style.css) → UX Designer gates UI
- Server-side logic (server.mjs) → Architect gates
- QA authors `tests/qa/wave-121/viewer-auto-follow.test.ts` (10 test cases per AC7)
- QA needs endpoint shapes: `GET /api/workspaces` → `{ok, current, workspaces: [{path, name, isCurrent, mostRecent}]}`, `GET /api/health` → `{ok, root, port, autoFollow, autoFollowPaused}`, `POST /api/auto-follow/toggle` → `{ok, autoFollow, autoFollowPaused}`

## In flight
- Viewer PR #4 open at `keyan-commits/apex-team-viewer` — awaiting Architect + UX Designer + QA gates.

## Next
- After QA PASS: HANDOFF to DevSecOps to merge viewer PR #4.

## Notes
- apex-team has no active rendered UI surface. All Wave 121 viewer code lives in `keyan-commits/apex-team-viewer`.
- QA is working in parallel. They should use mock-fs strategy per AC7; no real `~/.claude/projects/` reads in tests.

## ⏭️ PREV — 2026-06-04 — Wave 119: viewer workspace switcher (US-095 AC1-AC8)

### Wave-119 PASS verdict — PR #0 — SHA 467e9a7a889053f3571ad05e33b29f82ba0c1960
- **Gate role:** ui-developer
- **Timestamp:** 2026-06-04T18:00:00Z
- **Notes:** All AC1-AC8 implemented and manually verified. apex-team `pnpm test:run` 448/448 PASS (AC10). Viewer changes shipped in **sibling-repo PR `keyan-commits/apex-team-viewer#3`** (merged at `0bb1e2d`); apex-team-side PR #0 placeholder per ADR-018 Wave 111b amendment — DevSecOps backfills post-merge with the real apex-team PR # + merge SHA. No `architecture/` edits; no peer HANDOFF docs edited.

**Deliverables (all in `keyan-commits/apex-team-viewer` PR #3, SHA `467e9a7a889053f3571ad05e33b29f82ba0c1960`):**

1. `server.mjs`:
   - AC1: `activeRoot` let-bound mutable variable; IIFE resolves env > cwd > fallback; startup log includes source (`via env` / `via cwd` / `via default`)
   - AC2: `loadWorkspaceRegistry()` — deduplicated registry from current root + `APEX_TEAM_WORKSPACES` env (colon-separated, validated) + depth-1 auto-scan of `dirname(dirname(SELF))`; computed once, cached for process lifetime
   - AC3: `GET /api/workspaces` returns `{ ok, current, workspaces: [{path, name, isCurrent}] }`
   - AC4: `POST /api/workspace/switch` — validates path in registry + exists + is directory; mutates `activeRoot`; invalidates `labelCache`; returns `{ ok, current }`; 400 on unknown path
   - AC7: `/api/tickets` returns `{ ok: true, tickets: [], warning: "..." }` on missing `requirements/user-stories/`; `/api/now` returns `{ ok: true, handoff: "(No HANDOFF.md found in this workspace.)" }` on missing `HANDOFF.md`
   - AC8: all server functions (`safeJoin`, `getTickets`, `getNow`, `listRole`, `runGh`, `getCi`, `getPrs`) reference live `activeRoot`; `runGh` uses `activeRoot` as `cwd`; health endpoint reflects live root

2. `public/index.html`:
   - AC4: `<select id="workspace-select" class="select" aria-label="Switch workspace" hidden>` added between `<h1>` and `<nav id="tabs">`
   - AC5: `<h1>` given `id="workspace-heading"` for JS targeting

3. `public/app.js`:
   - AC4: `loadWorkspaces()` fetches `/api/workspaces`, populates select; hides if ≤1 workspace
   - AC5: `updateWorkspaceLabel(name)` updates `<h1>` innerHTML and `document.title`
   - AC6: localStorage persistence under `apex-team-viewer.workspace` key; silent pre-switch on page load if stored path differs from server current
   - AC4 error feedback: red border on `<select>` for 2s on switch failure

**Round-trip verification:**
- `GET /api/workspaces` → registry with isCurrent flags
- `POST /api/workspace/switch` (registered path) → 200 + `{ ok: true, current: {...} }` + health root updated
- `POST /api/workspace/switch` (unregistered path) → 400 `path not in workspace registry`
- Switch to no-requirements workspace → `/api/tickets` returns `warning`, not 500
- Switch to workspace without HANDOFF.md → `/api/now` returns fallback string, not error
- CWD resolution: start from apex-team directory → `(via cwd)` logged
- Default resolution: start from `/tmp` → `(via default)` logged
- apex-team `pnpm test:run` → 448/448 PASS

**Peer-edit boundary:** only own HANDOFF doc + viewer repo files. No `architecture/` edits.

**Gate routing:**
- Viewer PR #3 touches rendered UI (index.html, app.js) → UX Designer gates UI portion
- Server-side logic (server.mjs) → Architect gates
- QA authors `tests/qa/wave-119/viewer-workspace-switcher.test.ts` after this PR merges (or skips on runtime gate pattern per QA's fixture-first approach)

## In flight
- Viewer PR #3 open at `keyan-commits/apex-team-viewer` — awaiting Architect + UX Designer + QA gates.

## Next
- After QA PASS: HANDOFF to DevSecOps to merge viewer PR #3.

## Notes
- apex-team has no active rendered UI surface. All Wave 119 viewer code lives in `keyan-commits/apex-team-viewer`.
- QA is working in parallel (fixture scaffold + tests in apex-team). They can use the viewer PR branch's server.mjs directly, or the runtime-gate skip pattern if the PR hasn't merged yet.
- `registryCache` is process-lifetime — re-discovery on switch is out of scope per US-095 out-of-scope section.

## ⏭️ PREV — 2026-06-04 — Wave 112 Phase 2 (#196 partial — lessons-in-bodies)

### Wave-112 PASS verdict — PR #0 — SHA 4a455f0c07db6e571b2f64e7a4def898f22b0095
- **Gate role:** ui-developer
- **Timestamp:** 2026-06-04T12:43:33Z
- **Notes:** Self-attested. Single-file edit — `.claude/agents/ui-developer.md` lessons section replaced with 5 UI-Dev-specific incidents (Wave 55, Wave 110/PR #231 UX gate, Wave 109/PR #311 SHA sync, Wave 112/#325 focus-visible a11y, Wave 53 mocking anti-pattern). Token discipline verified: 153/153 cleanliness PASS. Full suite 249/249 PASS. Lint + type-check clean. No `architecture/` files touched; no peer HANDOFF docs edited. PR #0 placeholder — DevSecOps backfills with real PR# + merge SHA.

**Deliverables:**
1. `.claude/agents/ui-developer.md` — `## Lessons from prior incidents` section updated. 5 UI-Dev-targeted bullets replacing the 111b generic set:
   - Wave 55 — requirements triad bypass (retained; in LESSONS.md)
   - Wave 110 / PR #231 — UX gate must be recorded before merge (LESSONS.md line 12-15)
   - Wave 109 / PR #311 — pre-verdict SHA sync; false REVISE from stale checkout (LESSONS.md line 17-20)
   - Wave 112 / #325 — `outline: none` without `:focus-visible` is a WCAG regression (design/issue-325-focus-visible-a11y.md)
   - Wave 53 — mocking the component defeats visual test (LESSONS.md line 71-74)

**Issue disposition:** #196 partially satisfied — ui-developer.md lessons section now carries UI-Dev-specific incidents. Issue remains open (other roles' sections + AC2/3/4 still pending).

**Verification:**
- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS
- `pnpm test:run` → 249/249 PASS
- `pnpm lint` → clean
- `pnpm type-check` → clean

## ⏭️ PREV — 2026-06-04 — Wave 111b Phase 2 (Cluster 3 skills #361 + #362)

**Deliverables (1 file):**

1. `.claude/agents/ui-developer.md` — two new skill sections + lessons section:
   - `### Motion sensitivity — prefers-reduced-motion` (closes #361)
   - `### View Transitions API` (closes #362)
   - `## Lessons from prior incidents` (new section): 5 incidents sourced from real LESSONS.md entries

**Issue dispositions:**
- #361 — closed
- #362 — closed

**Verification:**
- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS
- `pnpm test:run` → 186/186 PASS
- `pnpm lint` → clean
- `pnpm type-check` → clean

## In flight (archive)
- Wave 111b: Architect PASS was received. Wave 119 is now the active lane.

## Next (archive)
- Wave 111c (CI canonical-format check) — DevSecOps lane, not UI Dev.

## Notes (archive)
- apex-team has no active rendered UI surface (monolith decommissioned Wave 106). Both skill sections are aspirational for when viewer-repo work resumes or any future UI project onboards these subagents.
