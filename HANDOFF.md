# HANDOFF — apex-team

## ⏭️ NOW — 2026-05-31

**State.** Wave 5a complete across all three streams. BE Dev (`737f154`): issue #3 + history truncation + health route. UI Dev (`188d2f5`): issues #1 + #2. DevSecOps (SHA-pending): fresh-Mac readiness — `.env.local.example` updated, README Fresh-Mac Setup added, `scripts/preflight.mjs` + `pnpm preflight`. `pnpm type-check` clean. Awaiting Wave 5b Architect review.

**Wave 4 complete — commits on `main` ahead of `origin/main`:**

| SHA | Commit |
|---|---|
| `2fe1e5d` | chore: backfill SHA b7b90d0 in HANDOFF NOW block |
| `b7b90d0` | fix(ba): auto-seed business-analyst on every user message via MCP |
| `d2a8ff8` | chore: backfill SHA 8adf5a1 in HANDOFF NOW block |
| `8adf5a1` | feat: dev-supervisor with sentinel-file graceful restart |
| `47dc6bc` | chore: backfill SHA 780faa9 in HANDOFF NOW block |
| `780faa9` | feat: QA self-improvement issue-filing loop |
| `2f0b6dd` | chore: backfill SHA 97216d5 in HANDOFF NOW block |
| `97216d5` | feat: PO-initialized model defaults per thread |
| `0c7fefa` | chore: backfill SHA e6c93d1 in HANDOFF NOW block |
| `e6c93d1` | feat: live activity indicators + active-thread polling |
| `5097f80` | chore: backfill SHA 3df1112 in HANDOFF NOW block |
| `3df1112` | test: wave 3 smoke tests against :3100 isolated instance |
| `8d351bf` | chore: backfill SHA cea839c in HANDOFF NOW block |
| `cea839c` | feat: wave 3 — remaining 5 role skills + apex-team requirements snapshot |
| `8f74e74` | chore: backfill SHA 2fd294f in HANDOFF NOW block |
| `2fd294f` | feat: per-role model dropdown with localStorage persistence |
| `c276d8d` | chore: backfill SHA f754ade in HANDOFF NOW block |
| `f754ade` | feat: dev:test isolated instance on :3100 with separate DB |
| `2241ea7` | chore: backfill SHA a3dd9cb in HANDOFF NOW block |
| `a3dd9cb` | feat: auto-thread-discovery + handoff context-management primitives |

**Architect Wave 4b review:** PASS, no blocks. 2 warns + 3 nits. Issue #3 filed (`agentModels` cast without `ALL_ROLES` filter at `run-turn.ts:122`).

**Open self-improvement issues (GitHub `self-improvement` label):**
- #1 — AgentPane "Other…" sends empty model string before typing (warn)
- #2 — Spurious EventSource on locally-minted thread before active-thread fetch (nit)
- #3 — `agentModels` cast to `Record<RoleId,string>` without `ALL_ROLES` filter (warn)

**MCP module-cache caveat:** `b7b90d0` and other MCP-side changes are on disk but NOT in the running server's cached module graph (if `pnpm dev` is running). Activate on next process restart. Use `pnpm dev:supervised` for future sessions — MCP-side changes activate cleanly via `.restart-trigger`.

**Active thread for resume:** `mcp_mpsoeous_bih2`.

**Next planned workspace:** point apex-team workspace field at `/Users/nikoe/Development/Study/my-finances` (iOS SwiftUI personal-finance app).

**Pending:** `git push origin main` — awaiting explicit user authorization.

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
