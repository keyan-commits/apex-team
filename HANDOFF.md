# HANDOFF — apex-team

## ⏭️ NOW — 2026-05-31

**State.** Wave 3 Architect track complete (`cea839c`). Code review done — PASS with WARNs. Remaining 5 skills files written and wired. requirements/ snapshot included. `pnpm type-check` clean. Awaiting QA Wave 3 smoke tests; then Wave 4 (HANDOFF refresh + push).

**Wave 3 Architect shipped:**
- `src/lib/skills/business-analyst.ts` — 5-skill BA domain expertise.
- `src/lib/skills/architect.ts` — 5-skill architecture domain expertise.
- `src/lib/skills/backend-developer.ts` — 5-skill backend domain expertise.
- `src/lib/skills/qa.ts` — 5-skill QA domain expertise.
- `src/lib/skills/devsecops.ts` — 5-skill DevSecOps domain expertise.
- `src/lib/roles.ts` — all 5 remaining roles wired to their skills constants.
- `requirements/` — BA's apex-team requirements snapshot included in commit.

**Wave 2 shipped (prior):**
- UI Dev: model dropdown (`2fd294f`) — AgentPane.tsx.
- Backend Dev: active-thread + handoff-utils (`a3dd9cb`) — 6 files.
- DevSecOps: dev:test isolated instance (`f754ade`) — db.ts + package.json.

**Wave 1 shipped (prior):**
- Event-bus SSE refactor (`2f037dc`). Skills injection mechanism + ui-developer PoC (`263ab77`).

**Open next-steps:**
- **QA:** smoke tests on `:3100` instance — new thread creation, talk_to_product_owner round-trip, active-thread auto-switch, model dropdown persistence, event-bus SSE delivery.
- **Wave 4:** HANDOFF refresh + push to `main` after QA returns.

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
