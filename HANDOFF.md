# HANDOFF — apex-team

## ⏭️ NOW — 2026-05-31

**State.** Event-bus SSE refactor + permission widening committed (`9a6f6a4`). Skills-injection Wave-1 commit-2 still in-flight on disk (uncommitted). `tsx watch` was tried as the auto-restart mechanism and reverted — it kills the in-process agent that just edited a source file, so future restarts go back to manual until a graceful-restart supervisor is built. Resume on branch `main`; HEAD = `9a6f6a4`.

**Mid-flight (uncommitted — recover after one final manual `pnpm dev` restart):**
- `package.json` — `dev` script reverted from `tsx watch` back to plain `tsx server.ts`. Running process still under `tsx watch` (it doesn't re-read package.json), so user must restart once more to drop it.
- `src/types.ts` — `skills?: string` added to `RoleDefinition`. (Architect edit, partial.)
- `src/lib/providers.ts` — `augmentSystemPrompt()` patched to inject `role.skills`. (Architect edit, partial.)
- `src/lib/skills/ui-developer.ts` — new file, 6-section UI/UX domain-expertise constant. (Architect created, partial.)
- **Not yet on disk:** `src/lib/roles.ts` wire-up of `ui-developer` skills; `architecture/decisions/ADR-001-role-skills-injection.md`; the Commit-2 `git commit`.

**Shipped today (post-event-bus session):**
- `mcp-config.ts` — `ALLOWED_BUILTIN_TOOLS` added (Read/Write/Edit/Glob/Grep/Bash/WebSearch/WebFetch) so headless team agents can act on the workspace without permission prompts (was previously blocked).
- `/api/thread-events` and event-bus verified end-to-end via a curl SSE listener; UI confirms live PO+peer streaming.
- `OrchestratorBar` thread input lets the dashboard subscribe to any thread (incl. MCP-minted) — workaround until auto-thread-discovery ships in Wave 2.
- `event-bus.ts` keys its `Map` on `globalThis` (`Symbol.for("apex-team.event-bus.emitters")`) so the `tsx`-loaded MCP module and the Next.js-bundled SSE route share state. Without this, MCP-side `publish()` and Next-side `subscribe()` hit separate Maps and the UI sees nothing from MCP turns.
- Approved PO's wave plan for the remaining backlog (Skills + Auto-thread-discovery + Model dropdown + QA test instance + Context mgmt + HANDOFF refresh). User has handed full control to PO with an autonomous-iteration mandate.

**Open next-steps (priority order):**
1. **User does ONE final manual `pnpm dev` restart** — drops `tsx watch` from the running process. Future agent edits no longer kill the agent mid-turn.
2. Re-dispatch PO → Architect to finish Wave 1 Commit 2 (roles.ts wire-up + ADR-001 + commit the skills feature).
3. **Wave 2 — three parallel streams:**
   - UI Dev: replace AgentPane's free-text model input with a dropdown (`claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`, `gemini-2.5-flash`, `llama-3.3-70b-versatile`, plus "Other…"); persist per-role choice to `localStorage`.
   - Backend Dev: `/api/active-thread` GET + write-side in `new_thread`/`talk_to_*` MCP tools so the browser auto-switches thread (no copy/paste); `src/lib/handoff-utils.ts` `summarizeHandoff(doc, maxChars)` calling `apex_synthesize`; PO prompt update to invoke it when a HANDOFF doc exceeds ~8K chars.
   - DevSecOps: `pnpm dev:test` script on `PORT=3100` with `DB_PATH=data/apex-team-test.db`; verify `db.ts` honors `DB_PATH`.
4. **Wave 3:** Architect reviews Wave 2 + drafts remaining 5 skills files (`ba`, `architect`, `backend-developer`, `qa`, `devsecops`); QA smoke tests on the `:3100` instance covering new-thread creation, `talk_to_product_owner` round-trip, active-thread auto-switch, model dropdown persistence, single-turn SSE delivery.
5. **Wave 4:** HANDOFF refresh + push to `main`.

**Parked (deliberate deferrals):**
- Graceful-restart supervisor — agents currently can't restart the parent process safely. Options: pm2 / forever / external sentinel-file watcher / detached spawn + SIGTERM. Deferred until the team is functioning end-to-end on a real external workspace.
- Role-boundary discipline — PO assigned Wave-1 implementation work to Architect (Architect's lane is design + reviews). Tolerable for tiny mechanism + PoC, revisit if pattern recurs.
- Symptom watched: BA misread a DISPATCH addressed to DevSecOps in Round 3 of the greeting test. Likely a PO authoring slip, not a routing bug. Revisit if it recurs.
- Streaming-input mode for Claude Agent SDK; thread list / resume sidebar; LLM-driven inbox watcher; SDK-native `skills: ['code-review' / 'verify' / 'security-review']` per-role (Wave 3 of original plan).
- Pre-existing backlog still open: end-to-end smoke test against an external workspace (e.g. `my-finances`); SDK `mcp__apex-engine__<tool>` allowlist naming verification under real apex-engine tool invocation; `/api/health` MCP-transport field; `next lint` → ESLint CLI migration; client-side abort button per pane.

**Active thread (so you can resume in the dashboard):** `mcp_mpsoeous_bih2`.

**Repo:** https://github.com/keyan-commits/apex-team

**Resume commands:**

```bash
cd /Users/nikoe/Development/Study/apex-team
pnpm dev                                  # http://localhost:3000  + MCP at /mcp  (plain tsx now, no watch)

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
