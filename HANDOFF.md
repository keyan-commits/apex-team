# HANDOFF — apex-team

## ⏭️ NOW — 2026-05-30

**State:** MVP rewired for parallel agents. Each agent now owns a persistent HANDOFF doc (`agent_state` table) and has its own pane busy state + composer. Cross-agent `[[HANDOFF: role]]` messages are async inbox drops, NOT auto-triggered relays. Type-check + production build pass clean.

### Top pane now embeds real `claude` CLI (subprocess via PTY)

- Driven by user feedback: the orchestrator-as-SDK-agent could never match Claude Code's actual feature set (real `/status`, `/memory`, `/skills`, etc. are CLI-only). Pivoted to embedding the real CLI.
- New `server.ts` — custom Next.js server with a WebSocket upgrade handler at `/api/pty`. Spawns `claude` via `node-pty`, bridges to xterm.js in the browser.
- `pnpm dev` script changed: `next dev` → `NODE_ENV=development tsx server.ts`. HMR still works because Next handles the request handler; the custom server is just a thin wrapper.
- New deps: `node-pty`, `@xterm/xterm`, `@xterm/addon-fit`, `ws`, `tsx`, `@types/ws`. All built clean.
- New component `src/components/TerminalPane.tsx` — dynamically imports xterm (it touches `window` at module top), connects to `/api/pty` via WebSocket, handles resize via FitAddon, themed to match apex-team's palette.
- `src/components/OrchestratorPane.tsx` and the orchestrator-as-SDK-agent code in `lib/` (orchestrator system prompt, DISPATCH parsing) are kept but **unused**. Cleanup deferred — leaving them in case we want a fallback or hybrid mode later.
- `MessageAuthor.kind === "dispatch"` and the DISPATCH SSE event are also kept but unreachable from the UI (no caller emits them now).
- BA and Dev panes unchanged — still SDK agents with per-pane HANDOFF docs, async-inbox HANDOFFs, MCP wiring.

**Caveat:** spawning `claude` requires the binary to be resolvable via `PATH` from the Node process that runs `pnpm dev`. If your shell finds it (you can run `claude` in a fresh terminal), the subprocess will too. Errors during spawn are surfaced in the TerminalPane (red `[server error: …]` line).

**Gotcha fixed in this session — pnpm drops +x on node-pty's spawn-helper.** Symptom: `posix_spawnp failed.` for every spawn, even against `/bin/zsh`. node-pty's binding loads fine; the issue is the `prebuilds/<platform>/spawn-helper` binary loses its execute bit during pnpm extraction. Fix is in `scripts/fix-node-pty-perms.mjs` (re-applies +x), wired to `package.json` `postinstall` so it runs on every install. Memory note: [reference-node-pty-pnpm].

**Resume:** stop `pnpm dev` and re-run it — the new script uses `tsx server.ts` and won't pick up automatically from a previous `next dev` process.

### Routing modes added (post-rework)

- The orchestrator bar dropdown now has **four targets**: `→ Auto`, `→ BA`, `→ Dev`, `→ Both`.
- `→ Auto` calls a new `POST /api/route-task` endpoint (`src/lib/routing.ts` → `classifyTask`) that uses **Claude Haiku 4.5** as a fast classifier to pick BA or Dev. The classifier's REASON is surfaced in the orchestrator status bar.
- `→ Both` fires two `runTurn` promises in parallel; both panes stream concurrently.
- Hard ownership boundaries added to `roles.ts` system prompts (driven by user feedback in this same session): **BA owns requirements end-to-end**, their HANDOFF doc IS the canonical spec; **Dev never picks a default for a business decision** — must escalate via `[[HANDOFF: business-analyst]]`.

### What changed in this session

**Architecture pivot** (driven by user feedback: "respective agents/LLMs have their own HANDOFF so they can work in parallel as well, not only one at a time"):

- ❌ Removed: serial handoff relay loop in `/api/chat` (up to 6 hops).
- ✅ Added: per-agent `agent_state` table — `(thread_id, role, handoff_doc, updated_at)`. Each agent maintains its own working-state doc.
- ✅ Added: agent reply protocol — `[[NOTES]] … [[/NOTES]]` updates own HANDOFF doc; `[[HANDOFF: role]] … [[/HANDOFF]]` drops a message in teammate's inbox (does NOT auto-trigger).
- ✅ Added: `pendingInbox` derived on the fly = handoff messages to this role with id > role's last agent turn.
- ✅ Added: providers.ts now augments system prompt with `## Your current HANDOFF doc` + `## Pending inbox` sections per turn.
- ✅ Added: `GET/PUT /api/agent-state` endpoint for the UI to fetch + edit HANDOFF docs.
- ✅ Added: UI per-pane busy state (`busy[role]`), per-pane status, per-pane streaming buffer. Both panes can run concurrent fetch streams.
- ✅ Added: `AgentStatePanel` component — collapsible HANDOFF doc viewer / editor inside each pane; inbox-count badge in the header; "Process inbox" button in the composer.
- ✅ Added: `MessageAuthor.user` now optionally carries a `to: RoleId` — user messages target a specific role so the other agent's pane filters them out.

### Verified this session

- `pnpm install` ✓
- `pnpm type-check` ✓ (zero TS errors)
- `pnpm build` ✓ (Next.js 15.5.18 — 5 routes including new `/api/agent-state`)

### Open next-steps (in priority order)

1. End-to-end smoke test: start apex-engine MCP (`cd ../apex-engine && pnpm setup`), `pnpm dev`, dispatch tasks to BOTH agents in parallel and confirm:
   - Each pane streams independently.
   - The BA emits a `[[NOTES]]` block and the HANDOFF panel updates.
   - The BA emits `[[HANDOFF: developer]]` — the inbox badge on the Dev pane increments.
   - Clicking "Process inbox" on Dev makes Dev respond using only the pending handoff as context.
2. Verify the Claude Agent SDK's `mcp__apex-engine__<tool>` allow-list naming actually matches what the SDK exposes once an agent invokes a tool. Adjust `apexAllowedTools()` in `src/lib/mcp-config.ts` if the SDK uses different prefixing for HTTP-transport servers.
3. Wire `AbortController` from the client (a "stop" button per pane) — server already honours `req.signal` for both Claude SDK and AI SDK streams.
4. Add an explicit "read cursor" column to `agent_state` so users can dismiss inbox items without forcing a reply turn.
5. Migrate from deprecated `next lint` to ESLint CLI directly (Next 15.5 warning).

### Parked

- LLM-driven orchestrator (instead of pure user-triggered turns) — a "team lead" that watches inboxes and decides who acts next.
- Persisting per-agent provider/model choice across reloads.
- Streaming-input mode for the Claude Agent SDK so each agent keeps a live session across turns (currently each turn is a fresh `query()` with re-serialized transcript).
- Thread list / resume sidebar (DB supports it — needs `/api/threads` GET).

### Resume commands

```bash
cd /Users/nikoe/Development/Study/apex-team
pnpm dev   # http://localhost:3000

# in another shell:
cd /Users/nikoe/Development/Study/apex-engine && pnpm setup
```

**Uncommitted:** Everything is uncommitted — `git init` hasn't been run. First commit should bundle the entire MVP (initial scaffold + parallel-agents rework).

---

## Notes / blockers

- `MessageAuthor.user` gained an optional `to: RoleId`. Older rows (if any existed) without `to` are still treated as "broadcast to both" — `buildConversation()` and the pane filter handle missing `to` gracefully.
- styled-jsx is bundled with Next 15 — no extra dep needed. The dynamic `${accent}` interpolation in `AgentPane.tsx` is at CSS value position, supported by styled-jsx.
- `agent_state` and `messages` are independent tables. The HANDOFF doc is NOT in `messages` — it's a single mutable blob per (thread, role). This is intentional: the doc is the agent's "current state" snapshot, not an audit log.
