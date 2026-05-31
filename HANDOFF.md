# HANDOFF — apex-team

## ⏭️ NOW — 2026-05-31

**State.** Wave 7c UI Dev in progress. Dashboard nav + model dropdown + per-row dispatch fix in progress (SHA-pending).

**Wave 7c UX audit findings — 5 issues filed:**
- **#19** (warn) — `--accent-orch` undefined in `globals.css` → invisible logo + broken AgentStatePanel styling
- **#20** (warn) — `AgentStatePanel` toggle: `all:unset` removes focus ring; no `:focus-visible` replacement
- **#21** (warn) — QUEUED drag-and-drop: no keyboard alternative for reordering
- **#22** (warn) — Dashboard poll errors silently swallowed; stale/loading state no feedback
- **#23** (warn) — `/dashboard` lacks workspace input; can't change workspace without returning to `/`

**Wave 7b gate verdicts (all PASS):**
- Wave 6e UI Dev `4c0b1d9` — PASS (field name fix)
- Wave 7a UI Dev `9ca54dc` — PASS (dispatch FSM correct; 8s setTimeout race superseded by Wave 7c redesign)
- Wave 7b BE Dev `4ca6b43` — PASS (playwright-mcp QA-only, correct tool name format)
- Wave 7b UI Dev `23c089a` — PASS (expandable rows + tooltips + model badge; #19–#23 noted, none block)

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
