# HANDOFF — apex-team

## ⏭️ NOW — 2026-05-31

**Wave 9c DevSecOps — worktree-based per-role isolation. Commit `3d2a933`.**

- `scripts/branch-start.mjs` — rewritten: now takes `<role> <wave>-<short>`; uses `git worktree add` → creates `../apex-team-<role>-<short>/` on `feature/<slug>` from `origin/main`; role validated against `VALID_ROLES`; worktree path collision check; branch duplicate check; per-role next-steps in output.
- `scripts/branch-cleanup.mjs` (NEW) — removes worktree + deletes merged feature branch; refuses if uncommitted changes in worktree.
- `package.json` — added `branch:cleanup` script.
- `README.md` — "Worktree workflow" subsection added under "Per-role isolated work".
- `ops/README.md` — branch creation + per-role workflow sections updated to reflect worktrees.
- `pnpm type-check` clean.

**Skills audit:** no new skills needed — `git worktree` is standard CLI.

**Previous: Wave 9b DevSecOps — per-role isolated dev instances + branch-start helper. Commit `5802292`.**

---

**Wave 9b BA — requirements/ scaffold complete. Commit `c693fc0`.**

- `requirements/scope.md` — full 8-role, MCP, ADR-002 phased workflow, constraints table
- `requirements/glossary.md` — 20 canonical terms (AC, gate, instance, PASS/REVISE/FAIL, feature branch, spec, story, protocol, skill, and existing terms)
- `requirements/open-questions.md` — OQ-001: feature-branch vs worktree vs clone isolation (awaiting user decision)
- `requirements/user-stories/_TEMPLATE.md` — story template per ADR-002 format
- `requirements/user-stories/US-001-multi-phase-workflow-foundation.md` — inaugural story; status in-dev; 6 ACs; impl links to `2a81587` + `a8fab5d`
- `requirements/INDEX.md` — updated to list all 5 docs

**Skill self-audit:** filed skill-proposal #36 — BA consultation-hub guidance (responding to peer HANDOFF requirements queries). No other gaps identified.

**HANDOFF to PO + Architect:** scaffold is live; implementation waves can now gate on story docs.

**Open question for user (OQ-001):** Feature branches vs git worktrees vs separate clones for implementer isolation — see `requirements/open-questions.md`. Awaiting user decision before DevSecOps finalizes provisioning scripts.

---

**Wave 9b — Mandatory phased workflow encoded. Commit `2a81587` on main.**

`src/lib/protocols.ts` (NEW):
- `REQUIREMENTS_PHASE_PROTOCOL` — PO convenes Arch + UX + BA before any implementer
- `IMPLEMENTATION_PHASE_PROTOCOL` — feature branches, isolated dev instances, local unit tests before HANDOFF
- `VERIFICATION_PHASE_PROTOCOL` — UX PASS before QA; QA on `:3100` against BA ACs
- `DEPLOYMENT_PHASE_PROTOCOL` — DevSecOps sole merge/push authority; never push from implementer
- `CONSULTATION_PROTOCOL` — any role HANDOFF BA for requirements clarification
- `SKILLS_SELF_ENRICHMENT_PROTOCOL` — skill-proposal / mcp-proposal issue flow + mcpmarket.com search

`architecture/decisions/ADR-002-multi-phase-workflow.md` (NEW): documents phased model, per-role gate ownership, isolation rationale, skills self-enrichment, ADR-001 compatibility.

`architecture/INDEX.md` (NEW): doc index for architecture/.

`src/lib/roles.ts` (MODIFIED):
- Imports all 6 protocol constants from `./protocols`
- `PHASED_WORKFLOW_DISCIPLINE` constant appended to `PEER_PROTOCOL` → flows into all 7 peer system prompts
- `ORCHESTRATOR_PROTOCOL` updated: Requirements phase mandatory (Arch+UX+BA first), Implementation wave (BA story required), Verification wave (UX before QA), Deployment wave (DevSecOps only)
- QA: "Deployment-gate verification" section — must use `:3100`, never PASS on code inspection alone
- UX Designer: is the design gate for all UI changes before QA proceeds
- DevSecOps: sole merge-to-main + push authority called out explicitly via `PHASED_WORKFLOW_DISCIPLINE`

**Downstream HANDOFFs sent:** BA, DevSecOps, all 6 peers (skill assessment ask).

**Ambiguity flagged to user:** "their own source code" interpreted as **feature branches** (not git worktrees / separate clones). ADR-002 §Consequences calls this out explicitly. Awaiting user confirmation if stronger isolation is desired.

---

**Wave 9a — Deployment-gate policy encoded. Commit `a8fab5d` on main.**

`src/lib/roles.ts` changes:
- `DEPLOYMENT_GATES_PROTOCOL` constant (exported) — canonical policy spec
- `GATE_DISCIPLINE` paragraph appended to `PEER_PROTOCOL` → flows into all 7 peer system prompts
- `ORCHESTRATOR_PROTOCOL` — "At the END of any wave" rule: QA at wave close, UX Designer before QA if UI touched; never declare wave done without QA PASS
- QA system prompt — new "Deployment-gate verification" section: must run `pnpm dev:test` on `:3100`, never PASS on code inspection alone
- UX Designer step 6 — explicit design gate: PASS/REVISE with severity list, HANDOFF to both implementer and QA
- Architect code review step 6 — PASS explicitly named as design gate for non-UI changes

Policy sharpening notes filed in reply.

---

**Hotfix on top of QA 8f.** `/api/agent-state` + `/api/chat` route-level Zod `RoleEnum` did NOT include `ux-designer`, so adding the 8th role broke `/`'s `refreshStates` — Zod rejected the role param → response shape lacked `pendingInbox` → `Cannot read properties of undefined (reading 'length')` runtime crash on page.tsx:172. Also added defensive `?.pendingInbox?.length ?? 0` for resilience. Triple-checked all hardcoded RoleEnums (3 copies — agent-state, chat, mcp/tools.ts) and the `agents` object schema in `/api/chat` BodySchema; all now include `ux-designer`. The 3-copy duplication is a code-smell carried over from before — flagged as a refactor candidate but not done now. Closes the dashboard 500 + the `/` crash.

**Hygiene:** Added `.playwright-mcp/` to `.gitignore` and removed the 2 console/snapshot artifacts that QA accidentally committed. These are per-turn dump files, not source of truth.

**QA — Wave 8f complete.** Code + live browser verification of Wave 8e fixes + po-dispatch hotfix. New smoke test file `tests/smoke/po-dispatch.test.ts` (2 tests). `pnpm test:run` 8/8. Commit `6c804ab`.

**Wave 8f QA findings — all PASS:**
- #21 QUEUED keyboard reorder: boundary guards, localStorage persist, flash, aria-live, focus-follows — all confirmed in code + browser snapshot shows `aria-label` with position hint ✓
- #24 Expandable error pill: both views have `title={pillLabel}`; error-only click handler + `aria-expanded`; detail block renders `{status}` verbatim; Escape + outside-click dismiss ✓
- `8fecea0` po-dispatch fire-and-forget: no `await`, `.catch(console.error)`, immediate 202 with `{ok,accepted,issueNumbers}` ✓

**Browser snapshot (http://localhost:3000/dashboard):**
- All 8 roles in CONTEXT panel ✓
- QUEUED item aria-label includes "Use arrow keys to reorder" ✓
- Console error: harmless 404 favicon.ico (nit — not filed)
- No WORKFLOW panel (removed `fb7e0f4`) ✓

---

**UI Dev — Wave 8e complete.** QUEUED keyboard reorder (#21) + expandable error pill (#24). Commit `a41ef22`.

**Wave 8e UI Dev changes:**
- `src/app/dashboard/page.tsx` — `useRef` added to imports; `flashedRowId`, `liveMsg`, `queuedRowRefs` added; `moveQueued(fromIdx, dir)` + `queuedRowKd(idx, itemId)` helpers; QUEUED rows now respond to ArrowUp/Down for reorder (same localStorage persistence as DnD); `aria-live` region announces "Moved to position N of M"; `.row-flash` CSS (200ms background flash); `.sr-only` CSS.
- `src/components/AgentPane.tsx` — `errorExpanded` state + `errorDetailRef`; Escape + outside-mousedown close handlers; pill in both folded + expanded view gets `title={pillLabel}` (Tier 1 hover tooltip); in error state pill gets `cursor:pointer` + `onClick` toggle + `aria-expanded`; inline error detail block renders below header when expanded (left border in role accent, monospace body, full error text); CSS for `.pill-error-btn`, `.pill-open`, `.error-detail*`.
- `pnpm type-check` clean.

**Awaiting:** Architect PASS for Wave 8e.

**Hotfix on top of Wave 8e:** `/api/po-dispatch` made fire-and-forget. Endpoint was awaiting `runTurnWithDispatches`, which for a 10-issue batch is 5+ minutes — the browser saw "Sending…" indefinitely and the HTTP transport timeout aborted the in-flight PO turn via `req.signal`. Now returns 202 immediately after kicking off the turn detached; bus events drive the UI. Closes user-reported "selections keep getting ignored."

**Removed: Workflow panel.** User feedback: not useful — comparison against a hardcoded "canonical chain" (PO→BA→UX→UI Dev→UX→QA→DevSecOps) is misleading because (a) the chain was something I made up from a passing user comment, not enforced by the system; (b) the only auto-trigger source is PO, peer-to-peer HANDOFFs don't trigger turns; (c) the visualization sprawled across an entire long-lived thread, washing out signal. Deleted: WORKFLOW section in `dashboard/page.tsx`, `wfStatus`/`expandedWfStep`, all `.wf-*` CSS, `/api/workflow/route.ts`, `WorkflowEdge` + `WorkflowResponse` types. Parked for future: per-instruction segmented view if/when a meaningful comparison spec is defined.

---

**UI Dev — Wave 8d complete.** WORKFLOW panel on dashboard. Commit `04a5f7c`.

**Wave 8d UI Dev changes:**
- `src/app/dashboard/page.tsx` — added `WorkflowResponse` import; `workflow` + `expandedWfStep` state; 10s visibility-aware poll for `/api/workflow`; `wfStatus()` helper for loose match/out-of-order/extra classification; WORKFLOW panel at top of grid (span-2) with Expected row, Actual row (per-step ✓/! marks + ×N badge), mismatch sentence, click-to-expand edge sub-list; CSS for `.wf-*` classes; `workflow` added to `PANEL_INFO`.
- `pnpm type-check` clean.

**Awaiting:** Architect PASS for Wave 8d.

---

**UI Dev — Wave 8c complete.** Poll error banner for issue #22. Commit `2f49c14`.

**Wave 8c UI Dev changes:**
- `src/app/dashboard/page.tsx` — added `fetchError` state; `.catch(() => {})` → `.catch(() => setFetchError(true))`; `.then(d => ...)` chains `setFetchError(false)` on success; `{fetchError && <div className="poll-error">…</div>}` banner below OrchestratorBar; `.poll-error` CSS rule added. Closes #22.
- `pnpm type-check` clean.

**Awaiting:** Architect PASS for Wave 8c.

---

**BE Dev — Wave 8b complete.** `src/app/api/workflow/route.ts` + types shipped. Commit `36bb6ec`.

**Wave 8b shipped:**
- `src/types.ts` — added `WorkflowEdge` + `WorkflowResponse` interfaces
- `src/app/api/workflow/route.ts` — NEW: `GET /api/workflow?threadId=<id>`. Iterates `listMessages`, maps `user`/`dispatch`/`handoff` author kinds to edges, collapses consecutive same-destination edges into `steps`, returns `expected` canonical chain. Capped at last 200 messages. Empty thread returns `{ edges: [], steps: [], expected: [...] }` — no 500.
- `pnpm type-check` clean.

**Next:** UI Dev consumes `/api/workflow` for the Workflow panel.

---

**State (prior). Wave 8a complete.**

**UX Designer — What I own:** Design specs (`<workspace>/design/`), UI/UX critique after each UI Dev wave, design-system token decisions. I do NOT write code — I write specs that UI Dev implements against.

**State.** Wave 8a complete. UX Designer introductory turn done — `design/INDEX.md` created with design notes for top-3 open UX issues (#22, #24, #21). Two skill-proposal issues filed (#34, #35).

**UX Designer Wave 8a intro — commit `fe29cf1`.**
- `design/INDEX.md` — created; design spec notes for issues #22 (poll error feedback), #24 (error pill expand), #21 (QUEUED keyboard reorder)
- `#34` filed: `[skill:ux-designer] Add responsive/breakpoint design section`
- `#35` filed: `[skill:ux-designer] Add motion/animation guidance to interaction-states section`

---

**State (prior).** Wave 8a UI Dev complete — ux-designer role rendered in both pages. Commit `15e57b1`.

**Wave 8a UI Dev changes:**
- `globals.css` — `--accent-uxd: #bf6dff` (violet)
- `src/app/page.tsx` — `ux-designer` added to `ALL_ROLES`, `TEAM_ROLES`, `ROLE_META` (accent: uxd, title: "UX Designer"); 7-peer team grid now 7 cards (3+3+1 at 3-col)
- `src/app/dashboard/page.tsx` — `ux-designer` added to `ROLE_ACCENT` + `ROLES`
- `AgentPane.tsx` / `AgentStatePanel.tsx` — no changes needed (role-agnostic)
- `pnpm type-check` clean

**Awaiting:** Architect PASS for Wave 7e + Wave 8a.

---

**State (prior).** Wave 7d retry QA complete. Wave 7e UI Dev awaiting Architect PASS.

**Wave 7d retry QA — code-analysis + curl. Playwright MCP still not available in direct Claude Code session.**

Confirmed FIXED (by code inspection):
| Fix | Issue | Evidence |
|---|---|---|
| `--accent-orch: #e0af68` defined | #19 | `globals.css:20` ✓ |
| MessageBubble `max-width: 820px` | #28 | `MessageBubble.tsx:151` ✓ |
| OrchestratorBar on dashboard | #23 | `dashboard/page.tsx:251` ✓ |
| OrchestratorBar tabs: border+padding+hover+active+focus ring | — | `OrchestratorBar.tsx:129-146` ✓ |

Wave 7e collapsible MessageBubble (`49cd73f`) — code review passed:
- `getPreview()` min(6 lines, 400 chars) logic correct
- `useState(!isLong)` correctly starts long messages collapsed
- Streaming/pending messages stay expanded (mount when short → stays expanded) ✓
- Click-expand with link guard, double-toggle prevention (stopPropagation on CTA) ✓
- `aria-expanded` on outer div, `:focus-visible` on CTA ✓
- Nit: `bubble-fade` gradient uses `var(--surface)` but peer/handoff bubbles use `var(--surface-2)` — noted in code comment, acceptable

`pnpm test:run`: 6/6 ✓  `pnpm type-check`: clean ✓

No new issues filed — all known defects already tracked (#20, #21, #22, #24, #25, #26).

**Wave 7e UI Dev changes:**
- `MessageBubble.tsx` — per-bubble collapse state; default collapsed when >400 chars; `getPreview()` takes min(6 lines, 400 chars); gradient fade overlay; "Show more / Collapse ▴" CTA; outer div `role="button"` + `aria-expanded` + Enter/Space toggle when collapsed; `bubble-fade` for gradient; `:focus-visible` ring on CTA.

**Awaiting:** Architect PASS for Wave 7e.

---

**Wave 7d UI Dev complete — commit `2d56050`. `pnpm type-check` clean.**

**Wave 7d UI Dev changes:**
- `globals.css` — defined `--accent-orch: #e0af68` (closes #19; logo and AgentStatePanel styling now visible)
- `MessageBubble.tsx` — `max-width: 820px` on `.bubble` (closes #28; PO pane text no longer spans full viewport)
- `OrchestratorBar.tsx` — sep divider between brand and nav-tabs; tabs restyled: `6px 16px` padding, `13px`, `font-weight: 700` active, tinted background on active, `:focus-visible` ring

**Wave 7d QA — code-based UI/UX audit + smoke test regression fix.** `pnpm test:run` 6/6. Pushed to origin/main.

**Important limitation:** `mcp__playwright__browser_*` tools are only mounted when running as an apex-team agent turn (via the turn runner), NOT in a direct Claude Code session. This turn used code analysis + live API calls instead of browser snapshots.

**New issues filed:**
| # | Severity | Summary |
|---|---|---|
| #28 | warn | `[ux:agent-pane]` PO pane no max-width → full-viewport line length on wide monitors |
| #29 | **block** | `[qa]` Smoke test Test 1 always fails — `"ok":true` check vs `"status":"ok"` response (FIXED in this commit) |
| #30 | — | `[skill:qa]` skill-proposal: Add visual verification via Playwright MCP section |

**User-reported issues validated by code analysis:**
| Claim | Verdict | Evidence |
|---|---|---|
| PO pane full-viewport width | ✓ CONFIRMED | `MessageBubble:84` `max-w-none`, `page.tsx:500-502` no max-width on `.po-area` |
| Team/Dashboard tabs invisible | ✗ NOT confirmed | `OrchestratorBar` tabs have border + active state (`--accent-po` background). BUT logo `⌬` is invisible because `--accent-orch` undefined (#19) |
| AgentPane auto-fold not working | ✗ NOT confirmed | Lines 117–125 implement 60s idle fold + busy auto-expand. Working in code. |
| Logo styling broken (#19) | ✓ CONFIRMED | `globals.css` has no `--accent-orch`; used in OrchestratorBar:119 and 5× in AgentStatePanel |
| Click-once on Issues panel | ✗ FIXED | `e561885` switched to `sendingRows: Set<number>` per-row; per-row buttons independent |
| Dashboard loads at all | ✓ CONFIRMED | `/api/team-status` and `/api/active-thread` both return correct data |

**Smoke test regression fixed (commit `744ef9e`):**
- `tests/smoke/http.sh:67` — changed `'"ok":true'` → `'"status":"ok"'`; also added `mcpMounted:true` check
- `tests/smoke/api.test.ts` — NEW: 2 Vitest unit tests for `/api/health` response shape (regression guard for issue #29)
- `pnpm test:run`: 6/6 passing (was 4/4; +2 new API shape tests)

**Carry-forward coverage gaps (unblocked, not yet written):**
- Health degraded path with wrong `APEX_MCP_URL` — now covered in `api.test.ts` ✓
- `agentModels` unknown-key filter in run-turn.ts — deferred
- AgentPane: Other… model selection regression — deferred
- EventSource single-connection on fresh load — deferred
- #22: dashboard poll error feedback — open issue, no test written (would require component test)

**Wave 7c UX audit — full findings (9 issues across all files):**

**Wave 7c UI Dev `e561885` — PASS.**
Delivered: OrchestratorBar on dashboard (workspace input), inline model select in Context, per-row `sendingRows` dispatch (concurrent). `pnpm type-check` clean.

**Wave 7c UX audit — full findings (9 issues across all files):**

| Issue | Severity | File:line | Status |
|---|---|---|---|
| #19 | warn | `OrchestratorBar.tsx:119`, `AgentStatePanel.tsx:119` | **open** — `--accent-orch` undefined, logo/panel styling broken |
| #20 | warn | `AgentStatePanel.tsx:122` | **open** — `all:unset` on toggle removes focus ring |
| #21 | warn | `dashboard/page.tsx` QUEUED panel | **open** — DnD no keyboard alternative |
| #22 | warn | `dashboard/page.tsx:132` | **open** — poll errors silently swallowed |
| #23 | warn | `dashboard/page.tsx` | **CLOSED** — fixed in `e561885` (OrchestratorBar added) |
| #24 | warn | `AgentPane.tsx:432-439` | **open** — error pill truncated 120px, no expand path |
| #25 | warn | `dashboard/page.tsx:230` | **open** — `"Endpoint building… (Wave 6b BE Dev)"` dev note in notReady |
| #26 | warn | `dashboard/page.tsx:83-88` | **open** — active-thread only fetched on mount, no 4s re-poll |
| #27 | — | `dashboard/page.tsx` | **CLOSED** — fixed in `e561885` (per-row sendingRows) |

**UX process change:** Starting this wave, every code review includes an explicit UI/UX rubric pass as a distinct step. For any wave touching UI files, I will apply the 5-point rubric (density, feedback latency, error visibility, keyboard a11y, zero-states) and file `[ux:*]` issues for every finding — not bundled as informal notes. Gate verdicts will cite UX issues explicitly.

**All wave gate verdicts:**
- Wave 6e UI Dev `4c0b1d9` — **PASS**
- Wave 7a UI Dev `9ca54dc` — **PASS**
- Wave 7b BE Dev `4ca6b43` — **PASS**
- Wave 7b UI Dev `23c089a` — **PASS** (expandable rows + tooltips + model badge)
- Wave 7c UI Dev `e561885` — **PASS** (nav + model select + per-row dispatch)

**Wave 7a shipped:**
- `src/app/api/po-dispatch/route.ts` — `POST /api/po-dispatch` (BE Dev, `d598c3e`)
- `src/app/dashboard/page.tsx` — Issues panel dispatch affordances (UI Dev, `9ca54dc`)

**Wave 7a shipped:**
- `src/app/api/po-dispatch/route.ts` — NEW: `POST /api/po-dispatch`. Body: `{ threadId, issueNumbers: number[], workspace? }`. Fetches each issue via `gh issue view --json`, constructs a PO message, calls `runTurnWithDispatches` targeting `product-owner`, returns `{ ok, dispatched, issueCount }`. Long-running (30–60s); no timeout. Bus events stream live. (BE Dev, `d598c3e`)
- `src/app/dashboard/page.tsx` — Issues panel enhanced: per-row checkbox multi-select, per-row "→ PO" instant-dispatch button, multi-select sticky footer with send/cancel, in-flight spinner, success toast with Team link, error banner with retry. All states account for `dispatchState: idle|sending|success|error`. (UI Dev, `9ca54dc`)

**Wave 6 complete (all on origin/main):**

**Wave 6 shipped (all on origin/main):**

| Commit | Stream | What |
|---|---|---|
| `4c0b1d9` | UI Dev | fix(dashboard): align panel shape with `/api/team-status` — closes #17 |
| `7291391` | UI Dev | `/dashboard` 9 panels + QUEUED HTML5 drag-drop prioritization + AgentPane auto-fold (60s idle) + OrchestratorBar Team/Dashboard tabs + UI/UX self-review skill in `ui-developer.ts` |
| `2e55fa2` | Architect | `/api/team-status?threadId=<id>` — 9-panel JSON, safe defaults |
| `70fff8e` | BE Dev | Token-usage capture in `providers.ts` + `turn_usage` table + `src/lib/pricing.ts` (per-model $/MTok incl. cache) |
| `e29755f` | BE Dev | Scout DB helpers + PO prompt Parts C/E/F + `skill-scout.mjs` (opt-in; needs API key not currently set) |
| `4f39199` | DevSecOps | Scout pivot — drop GH-Actions cron (no `ANTHROPIC_API_KEY`); PO has weekly scout-cadence prompt; `.env.local.example` + README updated |

Wave 6a fired 6 parallel role scouts + Architect MCP scan; produced 12 `skill-proposal` / `mcp-proposal` issues.

**Wave 6d review verdict:** PASS overall. Block (#17, fixed). Two carry-forward warns:
- `.env.local.example` comment "ANTHROPIC_API_KEY not used" is incorrect — `skill-scout.mjs` does use it.
- `skill-scout.mjs:58-89` empty `tool_result` error path unvalidated.

**Open issue backlog (PO triages on session start per `roles.ts` opener):**
- `self-improvement` open: #4 (page.tsx mount race warn).
- `skill-proposal` open from wave 6a: #5–#7, #9–#16.
- `mcp-proposal` open: #8 (microsoft/playwright-mcp).

**Open next-steps (priority order):**
1. PO surfaces the skill-proposal backlog at next session start and proposes 2–3 to schedule.
2. Verify BA-capture loop end-to-end: send a feature-ask via `talk_to_product_owner`; inspect `<workspace>/requirements/` for the new capture.
3. Verify token-spend panel populates after first new agent turn (capture in `providers.ts` is wired but unverified live).
4. Fix the two carry-forward warns from Wave 6d.
5. Eventually: graceful-restart enhancement so `.restart-trigger` doesn't kill mid-turn agents (currently acceptable trade since the team owns when to touch it).

**Parked (carry forward):**
- SDK-native `skills: ['code-review']` for Architect / `['verify']` for QA (Wave 3 of original plan).
- LLM-driven inbox watcher; thread list / resume sidebar; client-side abort button.
- Streaming-input mode for Claude Agent SDK.
- CI pipeline, Dependabot/Renovate — future wave.

**User context:** session focus is **apex-team self-improvement only**. User will run apex-team on a second Mac (20x Claude subscription there; 5x here). No `ANTHROPIC_API_KEY` — cron features deliberately not built; team agents use Claude Code OAuth.

**Repo:** https://github.com/keyan-commits/apex-team

**Resume commands:**

```bash
cd /Users/nikoe/Development/Study/apex-team
pnpm dev:supervised                       # http://localhost:3000  + MCP at /mcp  (supervisor watches .restart-trigger)

# in another shell, if not already running:
cd /Users/nikoe/Development/Study/apex-engine && pnpm setup

# register apex-team's MCP with your Claude Code (once per machine):
claude mcp add apex-team --transport http http://localhost:3000/mcp
```

---

## 2026-05-31 — afternoon: event-bus refactor + skills wave-1 start

Option-(b) refactor that gives every thread a single SSE delivery channel. MCP-driven and UI-driven turns now publish identical events through `event-bus.ts`; the browser opens one long-lived `EventSource` per thread via `/api/thread-events`. `/api/chat` lost its SSE response — it just kicks off `runTurnWithDispatches` and returns. PO dispatches now fan out **in parallel** (matches user's preference; was sequential under MCP path). Bus keyed on `globalThis` to bridge tsx-loaded MCP modules and Next-bundled routes. `mcp-config.ts` extended with built-in tool allowlist so headless team agents can do real work. Tried `tsx watch` for autonomous restarts — reverted; agents editing source kill themselves. Wave 1 (skills) started: Architect committed the bus refactor as `9a6f6a4`, then half-finished the skills feature before tsx watch interrupted.

## 2026-05-30 → 2026-05-31 — initial build + parallel rework + Claude CLI embed (now superseded)

---

## Session — 2026-05-30 → 2026-05-31 — initial build + parallel rework + Claude CLI embed (now superseded)

**One long session that produced the v1 MVP**, then a structural redesign to the v2 team-of-7 + MCP-driven model. v1 arcs preserved here for context:

### v1 — initial build (now superseded)
1. Scaffold (Next.js 15, Claude Agent SDK, apex-engine MCP wired) — 2 roles (BA + Dev), serial handoff relay.
2. Parallel-agent rework: per-agent `agent_state` table; `[[NOTES]]` + `[[HANDOFF: role]]` blocks; async inbox; per-pane busy + composer.
3. Role-ownership tightening: BA owns functional reqs, Dev escalates business-logic questions.
4. Auto routing classifier (`/api/route-task` via Claude Haiku 4.5) for the OrchestratorBar dropdown.
5. SDK-orchestrator agent: third role with `[[DISPATCH: role]]` auto-trigger. **Wrong abstraction** — user wanted real Claude Code, not a simulation. Pivoted away.
6. Embedded real `claude` CLI in top pane via node-pty + xterm.js + WebSocket PTY. Worked, but then…
7. node-pty gotcha: pnpm strips +x from `spawn-helper`; opaque `posix_spawnp failed.`. Fixed via postinstall chmod script.
8. Shared workspace field — top bar input flowing to PTY spawn cwd + agents' `query() cwd`. Persisted in localStorage.
9. `git init` + `/handoff-init` + initial commit (`1167b3a`) + push to private `keyan-commits/apex-team`.
10. Dependabot patch — postcss `>=8.5.10` via pnpm override (CVE-2026-41305).

### v2 — team-of-7 + MCP-driven (THIS session's structural redesign)
- Embedded `claude` CLI removed entirely (with all its xterm/node-pty/ws machinery).
- apex-team becomes its own MCP server (`src/mcp/` + `/mcp` endpoint).
- Roles expand from 2 → 7: PO replaces the SDK-orchestrator concept; Developer splits into UI Dev + Backend Dev; Architect picks up code reviews (was QA's lane in BMAD v1, now Architect's); QA narrows to testing; DevSecOps added.
- BA's spec persistence becomes a file-based `<workspace>/requirements/` directory (BA creates + maintains).
- Architect owns `<workspace>/architecture/`; DevSecOps owns `<workspace>/ops/`.

### Caveats carried forward
- Claude Agent SDK's `mcp__apex-engine__<tool>` allowlist naming still unverified in practice — open next-step #3.
- Non-Claude providers (Gemini/Groq) don't accept a `cwd`. They see workspace in their system prompt but can't read files there.
- `messages.author.kind` includes `dispatch` (PO → peer) AND `orchestrator` (system note). Both render but `orchestrator` notes are rare in v2.
- Block parsing is regex-based; malformed blocks render as visible text.
- Inbox is implicit (last-agent-turn cursor); processing the inbox without a reply still marks items "seen".
