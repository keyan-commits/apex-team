# HANDOFF — apex-team

## ⏭️ NOW — 2026-05-31

**State.** Wave 8a UI Dev complete — ux-designer role rendered in both pages. Commit `15e57b1`.

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
