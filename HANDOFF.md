# HANDOFF — apex-team

## ⏭️ NOW — 2026-05-31

**State:** Working end-to-end MVP on `main`, pushed to `keyan-commits/apex-team` (private). Top pane runs **real `claude` CLI** via PTY (xterm.js + node-pty); BA + Dev panes run SDK agents with per-agent HANDOFF docs and async inbox. A shared **workspace** input in the top bar drives both the terminal's spawn cwd and the agents' `query()` cwd — point it at any project directory and the whole team operates there.

**Repo:** https://github.com/keyan-commits/apex-team

**Just done (today, 2026-05-31):**
- Shared workspace field: top bar input + `localStorage` persistence; `?cwd=` query param on `/api/pty` WS URL; `workspace` field on `/api/chat` body; threaded through `runAgentTurn` → `streamAgent` → `query({ options: { cwd } })`. Top terminal re-spawns when workspace changes; agents pick up new cwd on next turn.
- `git init` + `/handoff-init` scaffold (`INDEX.yaml`, `INDEX.md`, scripts/, `scripts/git-hooks/pre-commit`, `core.hooksPath`, `.handoff-init` marker). Existing `HANDOFF.md` was already conformant — left untouched at init time.
- Initial commit (`1167b3a`); created private `keyan-commits/apex-team` and pushed `main`.
- Expanded `INDEX.yaml` with entries for `README.md`, `CLAUDE.md`, `.env.local.example`.
- **Dependabot alert #1 patched**: postcss `<8.5.10` (GHSA-qx2v-qp2m-jg93, CVE-2026-41305 — XSS via unescaped `</style>` in stringify output). Added `overrides: { postcss: ">=8.5.10" }` to `pnpm-workspace.yaml` (mirrors apex-engine's pin), wiped + regenerated lockfile. Verified only `postcss@8.5.15` remains. Type-check + build clean.

**Open next-steps (in priority order):**
1. End-to-end smoke test against a non-trivial workspace: point apex-team at, e.g., `../my-finances/` via the workspace field and have BA read its CLAUDE.md + propose a small change.
2. Verify the Claude Agent SDK's `mcp__apex-engine__<tool>` allow-list naming once an agent actually invokes an apex-engine tool. Adjust `apexAllowedTools()` in `src/lib/mcp-config.ts` if the SDK uses a different prefix for HTTP-transport servers.
3. Wire client-side abort (stop button per pane) — server already honours `req.signal`.
4. Cross-talk from the top Claude Code terminal to BA/Dev via an **apex-team MCP server** (tools: `dispatch_to_ba`, `dispatch_to_dev`, `read_agent_handoff`). Closes the BMAD loop — Claude Code at the top can read the team's state and dispatch work.
5. Clean up unused orchestrator-as-SDK code (`OrchestratorPane.tsx`, `slash-commands.ts`, orchestrator system prompt + DISPATCH parsing). Kept in-tree during the CLI pivot in case we wanted a fallback; CLI works fine, can delete.
6. Migrate from deprecated `next lint` to ESLint CLI (Next 15.5 warning).

**Parked:**
- LLM-driven orchestrator (a "team lead" that watches inboxes and acts) — superseded by real Claude Code at the top.
- Per-agent provider/model persistence across reloads.
- Streaming-input mode for the Claude Agent SDK (each turn re-serializes the transcript into a fresh `query()`).
- Thread list / resume sidebar (DB supports it — needs `/api/threads` GET + UI).

**Resume commands:**

```bash
cd /Users/nikoe/Development/Study/apex-team
pnpm dev    # http://localhost:3000

# in another shell:
cd /Users/nikoe/Development/Study/apex-engine && pnpm setup
```

---

## Session — 2026-05-30 → 2026-05-31 — initial build + parallel rework + Claude CLI embed

**One long session that produced the whole MVP.** Major arcs, in order:

### 1. Initial scaffold (2026-05-30)
Stack chosen to match apex-engine: Next.js 15 App Router + React 19 + TS 5.7 + Tailwind v4 + SQLite (better-sqlite3) + Claude Agent SDK + AI SDK (Gemini/Groq) + pnpm. Two roles (BA, Dev). Single SSE chat endpoint with a 6-hop auto-relay handoff loop. Type-check + production build clean on first pass.

### 2. Parallel-agent rework (user feedback: "their own HANDOFF so they can work in parallel")
- ❌ Removed the auto-relay loop in `/api/chat`.
- ✅ Added `agent_state` table `(thread_id, role, handoff_doc, updated_at)` — each agent maintains its own working-state doc, persisted per thread.
- ✅ Added reply protocol: `[[NOTES]] … [[/NOTES]]` updates own HANDOFF; `[[HANDOFF: role]] … [[/HANDOFF]]` drops a message in teammate's inbox (does NOT auto-trigger).
- ✅ Pending inbox derived on the fly = handoff messages to this role with id > the role's last agent turn.
- ✅ Providers augment system prompt with `## Your current HANDOFF doc` + `## Pending inbox` sections each turn.
- ✅ `GET/PUT /api/agent-state` for UI fetch + manual edit.
- ✅ UI per-pane busy state; both panes can run concurrent SSE streams.
- ✅ `AgentStatePanel` component — collapsible HANDOFF doc viewer / editor; inbox badge; "Process inbox" button.
- ✅ `MessageAuthor.user.to: RoleId` so each pane filters out user turns aimed at the other role.

### 3. Role-ownership tightening (user feedback: "BA should manage all the requirements")
- BA system prompt: "**You own the product requirements end-to-end.** Your HANDOFF doc IS the canonical product spec." Explicit boundaries: BA does NOT design implementation.
- Dev system prompt: "**You do NOT own the product requirements.** Never pick a default for a business decision." Explicit examples of what counts as business-logic (always escalate) vs technical (decide yourself).

### 4. Auto routing classifier
- New `POST /api/route-task` calls Claude Haiku 4.5 to classify a task → `business-analyst | developer | both`. Result + REASON surfaced in the status bar.
- Orchestrator bar dropdown: `→ Auto`, `→ BA`, `→ Dev`, `→ Both`. `Both` fires two `runTurn` promises in parallel.

### 5. Orchestrator-as-SDK-agent (later superseded — see arc 6)
Added a third agent ("orchestrator") with its own pane, HANDOFF doc, system prompt, and a new `[[DISPATCH: role]]` block that auto-triggered the target's turn (distinct from peer HANDOFF). Slash commands at the app level (`/help`, `/status`, `/clear`, `/ba`, `/dev`, `/both`, `/auto`) intercepted client-side. **This was the wrong abstraction** — user wanted real Claude Code, not a simulation. Code kept in-tree but unused; cleanup deferred.

### 6. Pivot — embed real `claude` CLI in the top pane (user feedback: "I want claude-code to be the top chat")
- Recognized the gap: `@anthropic-ai/claude-agent-sdk` is a library; `claude` (CLI) is a binary. Real `/status`, `/memory`, `/skills` etc. are CLI-only.
- New `server.ts` — custom Next.js server with WebSocket upgrade at `/api/pty`. Spawns `claude` via `node-pty`; bridges raw output and resize messages to xterm.js in the browser.
- `pnpm dev` script: `next dev` → `NODE_ENV=development tsx server.ts`.
- New deps: `node-pty`, `@xterm/xterm`, `@xterm/addon-fit`, `ws`, `tsx`, `@types/ws`.
- New `TerminalPane` component. Dynamically imports xterm (touches `window` at module top), themes to apex-team's palette.
- BA/Dev panes unchanged — still SDK agents.

### 7. node-pty gotcha — pnpm drops +x on `spawn-helper`
Symptom: `posix_spawnp failed.` for every spawn, even against `/bin/zsh`. Diagnosed via a probe script that compared `child_process.spawn` (worked) vs `node-pty.spawn` (failed). Root cause: pnpm's tarball extraction drops the execute bit from `prebuilds/<platform>/spawn-helper`. Fix in `scripts/fix-node-pty-perms.mjs`, wired to `package.json → scripts.postinstall` so it runs on every install. Cross-referenced in [reference-node-pty-pnpm] memory.

### 8. Workspace input (2026-05-31)
Shared workspace field in the top bar — drives the PTY spawn's `cwd` (via `?cwd=` on the WS URL) AND the SDK agents' `query({ options: { cwd } })`. Persisted in `localStorage`. Default comes from `/api/health` which returns the server's `process.cwd()`. Changing the workspace re-spawns the top terminal; agents pick up the new cwd on their next turn.

### Verified at end of session
- `pnpm install` ✓ (incl. native builds: better-sqlite3, sharp, unrs-resolver, node-pty, esbuild)
- `pnpm type-check` ✓ (zero TS errors)
- `pnpm build` ✓ (Next.js 15.5.18 — 6 routes incl. `/api/agent-state`, `/api/route-task`)
- End-to-end smoke test ✓ (BA → Dev handoff round-trip with `[[NOTES]]` + `[[HANDOFF: role]]` blocks rendering correctly)
- Real Claude CLI in top pane ✓ (`/status` renders the actual TUI panel)
- Initial commit `1167b3a` ✓
- Pushed to `keyan-commits/apex-team` (private) ✓

### Caveats carried forward
- The Claude Agent SDK's `mcp__apex-engine__<tool>` allow-list naming hasn't been verified against an actual MCP tool call yet — see open next-step #2.
- Non-Claude providers (Gemini/Groq) don't accept a `cwd` parameter. They see the path in their system prompt but can't `Read` files there.
- `messages.author.kind === "dispatch"` and the DISPATCH SSE event exist in code but are unreachable from the UI now that the orchestrator-as-SDK-agent isn't rendered.
- `MessageAuthor.user.to` is optional for backward compat with rows that pre-date the field.
- `agent_state` and `messages` are independent tables. The HANDOFF doc is a single mutable blob per (thread, role) — not an audit log.
