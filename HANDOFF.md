# HANDOFF — apex-team

## ⏭️ NOW — 2026-05-31

**State.** Wave 4b QA complete (SHA-pending). Self-improvement issue-filing loop wired. `pnpm type-check` clean.

**Wave 4b shipped (this commit):**
- `src/lib/skills/qa.ts` — 6th skill section: Defect filing (gh issue create pattern, workspace fallback, body format, severity guide).
- `src/lib/roles.ts` — PO system prompt: Self-improvement backlog section (gh issue list command, scheduling heuristic).
- GitHub issues filed: #1 AgentPane empty model string race (warn), #2 Spurious EventSource on mount (nit). Label: `self-improvement`.

**Wave 4a complete (`97216d5`):** PO-initialized model defaults per thread fully wired. `pnpm type-check` clean.

**Wave 4a shipped (this commit):**
- `src/types.ts` — `agent-models` added to `SseEventType`; `agentModels` field on `SseEvent`.
- `src/lib/orchestrator.ts` — `AGENT_MODELS_RE` + `agentModels` parsing in `parseAgentReply()`.
- `src/lib/run-turn.ts` — PO-only: persist + publish `agent-models` SSE event when block present.
- `src/lib/db.ts` — `thread_config` table; `getThreadAgentModels` / `setThreadAgentModels`.
- `src/app/api/thread-config/route.ts` — GET returns stored agent-model map for a thread.
- `src/lib/roles.ts` — PO system prompt: Model initialization section (emit `[[AGENT-MODELS]]` on first turn).
- `src/app/page.tsx` — `agent-models` SSE handler + `/api/thread-config` fetch on thread switch (committed in `e6c93d1`).

**Wave 4a prior (`e6c93d1`):** live activity indicators + active-thread polling.

**Wave 3 QA shipped (`3df1112`):** 4/4 unit tests + 6/6 HTTP smoke tests PASS.

**Wave 3 Architect (`cea839c`):** code review PASS; 5 remaining skills files.

**Wave 2 shipped:**
- UI Dev: model dropdown (`2fd294f`). Backend Dev: active-thread + handoff-utils (`a3dd9cb`). DevSecOps: dev:test isolated instance (`f754ade`).

**Wave 1 shipped:**
- Event-bus SSE refactor (`2f037dc`). Skills injection mechanism + ui-developer PoC (`263ab77`).

**Open next-steps:**
- Push to `main` (16+ commits ahead of origin).
- Wave 4b candidates: `/api/health` MCP-transport field; `next lint` → ESLint CLI migration; client-side abort button.

**Known gaps / deliberate omissions:**
- MCP new_thread → active-thread auto-switch: skipped (requires full MCP session handshake in test; wiring verified by code review).
- Model dropdown localStorage persistence: requires browser (Playwright candidate, Wave 4+).
- End-to-end LLM turn: requires live Claude Code OAuth session.

**Parked (deliberate deferrals):**
- Graceful-restart supervisor (pm2 / sentinel-file watcher / detached spawn).
- Role-boundary discipline (Architect doing implementation work — tolerable for tiny PoC).
- SDK-native `skills: ['code-review']` for Architect / `skills: ['verify']` for QA (Wave 3 of original plan).
- Pre-existing backlog: end-to-end smoke test against external workspace; `/api/health` MCP-transport field; `next lint` → ESLint CLI migration; client-side abort button per pane.

**Active thread:** `mcp_mpsoeous_bih2`.

**Repo:** https://github.com/keyan-commits/apex-team

**Resume commands:**

```bash
cd /Users/nikoe/Development/Study/apex-team
pnpm dev                                  # http://localhost:3000  + MCP at /mcp  (plain tsx, no watch)

# in another shell, if not already running:
cd /Users/nikoe/Development/Study/apex-engine && pnpm setup

# register apex-team's MCP with your Claude Code (once):
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
