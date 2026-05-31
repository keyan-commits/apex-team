# HANDOFF — apex-team

## ⏭️ NOW — 2026-05-31

**State.** Wave 5a complete (`eaf32e9`). All three Wave 5a streams done. Awaiting Wave 5c push authorization.

**Wave 5a delivered:**
- BE Dev (`737f154`) — issue #3 agentModels filter + history truncation + health route apex-engine probe
- UI Dev (`188d2f5`) — issue #1 model empty-string race fix + issue #2 spurious EventSource fix
- DevSecOps (`eaf32e9`) — fresh-Mac readiness: no hardcoded paths found, `.env.local.example` updated, README Fresh-Mac Setup section, `scripts/preflight.mjs` + `pnpm preflight`

**Wave 5b — Architect review:** PASS, no blocks. 1 warn + 2 nits. Issues #1, #2, #3 closed on GitHub.

**Open self-improvement issues (GitHub `self-improvement` label):**
- #4 — `page.tsx:113-117` mount fetch race: user-typed thread ID overwritten if fetch resolves after edit (warn, < 100ms window in practice)

**`pnpm preflight` on this machine:** 4/4 PASS. Exit 0.

**`pnpm type-check`:** clean.

**MCP module-cache caveat:** Wave 5a's `run-turn.ts` + `agents.ts` changes (`737f154`) are on disk but NOT live in the cached MCP graph yet. Activate after push by touching `.restart-trigger` in a dedicated turn (or from outside the team).

**Active thread for resume:** `mcp_mpsoeous_bih2`.

**Pending:** `git push origin main` — awaiting explicit user authorization. 22+ commits ahead of origin/main.

**User context:** will use apex-team on a second Mac soon; Fresh-Mac onboarding functional (preflight 4/4, README setup in place).

**Parked:**
- CI pipeline (not requested).
- Secrets management (no secrets beyond `.env*.local` which is gitignored).
- Supply-chain scanning (Dependabot/Renovate — future wave).
- SDK-native `skills: ['code-review']` for Architect / `skills: ['verify']` for QA.

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
