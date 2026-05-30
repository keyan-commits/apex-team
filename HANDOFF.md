# HANDOFF — apex-team

## ⏭️ NOW — 2026-05-31

**State:** Team-of-7 architecture is live and pushed. The embedded `claude` CLI in the top pane is **gone**; apex-team now **exposes its own MCP server** at `/mcp` on the same Next.js custom server. External Claude Code sessions register with `claude mcp add apex-team --transport http http://localhost:3000/mcp` and drive the team via tools (`talk_to_product_owner`, `talk_to_role`, etc.). Type-check + production build pass clean.

**Repo:** https://github.com/keyan-commits/apex-team

**The 7 roles:**

| Role | Owns |
|---|---|
| Product Owner | In-app orchestrator — uses `[[DISPATCH: role]]` to auto-trigger peers |
| Business Analyst | Functional requirements; manages `<workspace>/requirements/` |
| Architect | Non-functional requirements, system design, **all code reviews**, coding standards |
| UI Developer | Frontend |
| Backend Developer | Backend / APIs |
| QA | All testing (unit / smoke / regression / UI / backend / security); test-tech choices |
| DevSecOps | CI/CD, secrets, deployments, supply chain |

**Just done (this 2026-05-31 session):**
- Replaced 2-role MVP (BA + Dev) with the 7-role architecture above. Each role has its own pane, HANDOFF doc, system prompt, provider/model config.
- Removed the embedded `claude` CLI (TerminalPane + xterm.js + node-pty + ws + the WebSocket PTY handler in `server.ts`).
- Built apex-team's own MCP server at `/mcp`: `src/mcp/handler.ts` (Streamable HTTP, stateless per-request, DNS-rebinding protection) + `src/mcp/tools.ts` (8 tools). Mounted in `server.ts` before the Next.js handler.
- MCP tools: `talk_to_role`, `talk_to_product_owner` (runs PO + all peers PO dispatches), `get_team_status`, `read_handoff_doc`, `list_requirements`, `read_requirement`, `new_thread`, `get_workspace`, `list_team_roles`, `record_user_message`.
- Extracted `src/lib/run-turn.ts` so both `/api/chat` (streaming) and MCP tools (non-streaming) share the same turn-persistence logic.
- PO uses `[[DISPATCH: role]]` (auto-trigger); peers use `[[HANDOFF: role]]` (async inbox, no auto-trigger). Both protocols active.
- Layout: PO pane on top full-width, six peer panes in a responsive 3-col / 2-col / 1-col grid. New accent colors per role (PO orange, BA blue, Arch purple, UI green, BE cyan, QA pink, DevSecOps amber).
- Removed deps: `node-pty`, `@xterm/xterm`, `@xterm/addon-fit`, `ws`, `@types/ws`. Removed `postinstall` script + `scripts/fix-node-pty-perms.mjs`. Added `@modelcontextprotocol/sdk`.
- Deleted dead code: `TerminalPane.tsx`, `OrchestratorPane.tsx`, `slash-commands.ts`, `routing.ts`, `/api/route-task/`, `scripts/pty-probe.mjs`.

**Open next-steps (in priority order):**
1. End-to-end smoke test:
   - Start apex-engine MCP (`cd ../apex-engine && pnpm setup`).
   - Start apex-team (`pnpm dev`).
   - Register: `claude mcp add apex-team --transport http http://localhost:3000/mcp`.
   - In a fresh `claude` session: `Use apex-team. Mint a new thread, then talk_to_product_owner about building a markdown todo list app. Workspace: /Users/nikoe/Development/Study/my-finances`.
   - Watch the web dashboard — PO should dispatch, peers should stream replies, BA should create `<workspace>/requirements/`.
2. **The PO's dispatched peers fire sequentially inside `talk_to_product_owner`, but in the web UI they fire in parallel.** Reconcile: probably keep MCP sequential (Claude Code expects to see all replies in one tool result), but verify no race conditions when the same thread has parallel turns running.
3. Verify Claude Agent SDK's `mcp__apex-engine__<tool>` allowlist naming works when an agent actually invokes an apex-engine tool. Adjust `apexAllowedTools()` if needed.
4. BA's `requirements/` directory has no pre-existing template — BA creates it on first turn. Watch the first run; may need to tighten the BA prompt if it gets the structure wrong.
5. Add an `/api/health` field reporting whether the MCP transport is mounted (cheap sanity).
6. Migrate `next lint` → ESLint CLI (Next 15.5 deprecation warning).
7. Client-side abort button per pane (server already honours `req.signal`).
8. Persist per-agent provider/model choice (currently resets to Sonnet on reload).

**Parked:**
- Streaming-input mode for Claude Agent SDK (each turn re-serializes transcript into a fresh `query()`).
- Thread list / resume sidebar (DB supports it).
- LLM-driven inbox watcher (PO actively notices peer HANDOFFs and decides whether to re-dispatch).

**Resume commands:**

```bash
cd /Users/nikoe/Development/Study/apex-team
pnpm dev                                  # http://localhost:3000  + MCP at /mcp

# in another shell:
cd /Users/nikoe/Development/Study/apex-engine && pnpm setup

# register apex-team's MCP with your Claude Code (once):
claude mcp add apex-team --transport http http://localhost:3000/mcp
```

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
