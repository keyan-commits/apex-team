# CLAUDE.md — apex-team

Local single-user web app that runs a **team of seven role-specialized LLM agents** working in parallel on a project. The team is driven by an external **Claude Code** session (yours, in your terminal) connected to apex-team's own **MCP server** — you talk to your Claude Code, your Claude Code drives the team via MCP tools, the web UI is the observability dashboard.

Built on top of [apex-engine](../apex-engine): every team member's Claude calls have apex-engine's MCP tools (`apex_synthesize`, `apex_fanout`, `doc_review`, `code`, `web_search`, `history_search`) available.

## Architecture

```
   ┌──────────────────────────┐
   │  Your Claude Code (CLI)  │  ← you talk to this in your terminal
   └────────────┬─────────────┘
                │ MCP (claude mcp add apex-team --transport http http://localhost:3000/mcp)
                ▼
   ┌──────────────────────────┐
   │  apex-team server.ts     │  ← custom Next.js server
   │  /mcp     (apex-team MCP)│
   │  /api/*   (Next.js API)  │
   │  /        (web dashboard)│
   └────────────┬─────────────┘
                │ runTurn → query() with apex-engine MCP wired
                ▼
   ┌────────────────────────────────────────────────────────┐
   │  7 agents, each its own SDK session + HANDOFF doc:     │
   │                                                        │
   │   Product Owner   — in-app orchestrator (DISPATCH)     │
   │   ────────────────────────────────────────────────     │
   │   Business Analyst — owns <workspace>/requirements/    │
   │   Architect        — owns NFRs + code reviews          │
   │   UI Developer     — frontend                          │
   │   Backend Developer — backend / APIs                   │
   │   QA               — all testing                       │
   │   DevSecOps        — CI/CD + secrets + supply chain    │
   └────────────────────────────────────────────────────────┘
```

## The 7 roles

| Role | Ownership | Channel |
|---|---|---|
| **Product Owner (PO)** | In-app orchestrator. Reads goals from you; decides who runs next. Uses `[[DISPATCH: role]]` (auto-trigger). | Auto-summons the team. |
| **Business Analyst (BA)** | Functional / business requirements. Maintains `<workspace>/requirements/` directory (INDEX.md, scope.md, glossary.md, open-questions.md, user-stories/*). Every other role asks BA for business logic. | `[[HANDOFF: role]]` (peer inbox). |
| **Architect** | **Non-functional requirements** (perf, security envelope, observability, scalability, deployability), **system design**, **coding standards**, **all code reviews**, design pattern guidance. Maintains `<workspace>/architecture/`. | `[[HANDOFF: role]]`. |
| **UI Developer** | Frontend implementation. Reads requirements + architecture, writes UI code. Escalates business questions to BA, tech questions to Architect. | `[[HANDOFF: role]]`. |
| **Backend Developer** | Backend / API / service implementation. Same escalation pattern as UI Dev. | `[[HANDOFF: role]]`. |
| **QA** | **All testing**: unit, smoke, regression, UI, backend, security. Picks the testing tech. Does **not** do code reviews (that's Architect's lane). | `[[HANDOFF: role]]`. |
| **DevSecOps** | CI/CD pipelines, secrets, deployments, supply-chain security (Dependabot/equivalent), runtime security (TLS, IAM). Maintains `<workspace>/ops/`. | `[[HANDOFF: role]]`. |

**Two cross-agent channels:**

- `[[HANDOFF: role]] … [[/HANDOFF]]` — peer-to-peer. Async, lands in target's inbox, does **NOT** auto-trigger. Used by all six non-PO roles.
- `[[DISPATCH: role]] … [[/DISPATCH]]` — orchestrator-to-team. **Auto-triggers** the target's turn. Used only by PO.

Both roles can emit `[[NOTES]] … [[/NOTES]]` to update their own persistent HANDOFF doc.

## How to drive the team

### From your Claude Code session (recommended)

```bash
# One-time:
claude mcp add apex-team --transport http http://localhost:3000/mcp
```

Then in any Claude Code session, ask it to use apex-team's tools:

- `talk_to_product_owner(message, thread_id, workspace?)` — hand the PO a goal, get back the PO's reply plus every dispatched peer's reply.
- `talk_to_role(role, message, thread_id, workspace?)` — bypass PO, talk directly to any specific role.
- `get_team_status(thread_id)` — busy/idle, HANDOFF doc sizes, inbox counts.
- `read_handoff_doc(role, thread_id)` — full text of a role's working state.
- `list_requirements(workspace?)` / `read_requirement(path, workspace?)` — access BA's requirements/.
- `new_thread()` — mint a fresh thread id.
- `list_team_roles()` — discover what role ids you can target.
- `record_user_message(thread_id, message)` — drop context into a thread without triggering a turn.

### From the web UI (observability + manual drive)

`http://localhost:3000` — every role has its own pane:
- PO pane at the top (full width).
- Six peer panes below in a 3-column grid (or 2-col / 1-col on narrower screens).

Each pane has its own composer (talk directly to that role) plus a collapsible HANDOFF doc panel and an inbox badge. Inbox > 0 → an orange "Process inbox" button appears.

The **workspace** field in the top bar (persisted in `localStorage`) is the directory the agents' Read/Edit/Bash tools target.

## Stack

- **Framework:** Next.js 15 (App Router) · React 19 · TypeScript 5
- **Server:** custom Next.js server (`server.ts` via `tsx`) so we can mount the MCP endpoint at `/mcp` alongside the Next.js request handler.
- **Styling:** Tailwind CSS v4 + `@tailwindcss/typography` + styled-jsx.
- **LLM SDKs:**
  - `@anthropic-ai/claude-agent-sdk` — Claude agents (reuses local Claude Code OAuth).
  - `ai` (Vercel AI SDK) + `@ai-sdk/google` + `@ai-sdk/groq` — non-Claude providers.
- **MCP server:** `@modelcontextprotocol/sdk` 1.x with Streamable HTTP transport. Tools defined in `src/mcp/tools.ts`.
- **State:** SQLite via `better-sqlite3` (`data/apex-team.db`, gitignored). Two tables: `messages` + `agent_state`.
- **Markdown:** `react-markdown` + `remark-gfm`.
- **Package manager:** pnpm.

## File layout

```
apex-team/
├── server.ts                              (custom Next server + MCP mount at /mcp)
├── src/
│   ├── app/
│   │   ├── page.tsx                       (7-pane dashboard)
│   │   ├── layout.tsx, globals.css
│   │   └── api/
│   │       ├── chat/route.ts              (SSE — runs one turn, persists, streams)
│   │       ├── agent-state/route.ts       (GET/PUT per-agent HANDOFF doc + inbox)
│   │       ├── thread/route.ts            (GET — thread history)
│   │       └── health/route.ts            (apex-engine reachability + default cwd)
│   ├── components/
│   │   ├── AgentPane.tsx                  (one role's pane — handles all 7)
│   │   ├── AgentStatePanel.tsx            (collapsible HANDOFF doc viewer/editor)
│   │   ├── OrchestratorBar.tsx            (top bar: thread id + workspace + new)
│   │   └── MessageBubble.tsx              (markdown bubble, per-author styling)
│   ├── lib/
│   │   ├── roles.ts                       (7 system prompts + ALL_ROLES + TEAM_ROLES + isTeamRole)
│   │   ├── providers.ts                   (Claude SDK + AI SDK streamers; augments system prompt)
│   │   ├── agents.ts                      (turn driver — loads state + history + inbox)
│   │   ├── run-turn.ts                    (shared by /api/chat + MCP tools — persists everything)
│   │   ├── orchestrator.ts                (parses NOTES + HANDOFF + DISPATCH blocks)
│   │   ├── mcp-config.ts                  (apex-engine MCP server config + tool allowlist)
│   │   ├── db.ts                          (SQLite — messages + agent_state)
│   │   ├── sse.ts, sse-client.ts          (server-side encoder + browser consumer)
│   │   └── (no slash-commands.ts, no routing.ts — both deleted in v2)
│   ├── mcp/
│   │   ├── handler.ts                     (Streamable HTTP MCP handler at /mcp)
│   │   └── tools.ts                       (8 MCP tools — talk_to_*, get_team_status, etc.)
│   └── types.ts                           (RoleId | TeamRoleId | AccentKey + message kinds + SSE events)
├── data/                                  (gitignored — apex-team.db)
├── HANDOFF.md, INDEX.yaml, INDEX.md       (per /handoff-init convention)
└── README.md
```

## Prerequisites

- `../apex-engine` running with its HTTP MCP at `http://127.0.0.1:31001/mcp` (`cd ../apex-engine && pnpm setup`). Override via `APEX_MCP_URL`.
- Claude agents need Claude Code logged in (`claude login`) — the SDK reuses that OAuth.
- Gemini / Groq agents need their respective keys in `.env.local`.
- For external Claude Code → apex-team MCP: `claude mcp add apex-team --transport http http://localhost:3000/mcp`.

## Commands

```bash
pnpm install
pnpm dev             # http://localhost:3000  (MCP at /mcp on the same port)
pnpm build
pnpm type-check
pnpm test:run
```

## Engineering standards

1. **Keep it lean.** Minimal deps. Async-first. No abstraction without repetition.
2. **Direct integration.** Provider SDKs called directly. No aggregator/proxy.
3. **Streaming UX.** Tokens stream to the active pane the moment the provider emits them. MCP tools block until done (no streaming there).
4. **Server-only secrets.** API keys in `process.env`; never expose to client.
5. **One source of truth per artifact:**
   - Functional requirements: `<workspace>/requirements/` (BA-owned).
   - Architecture + NFRs + standards: `<workspace>/architecture/` (Architect-owned).
   - Ops / CI / deployment: `<workspace>/ops/` (DevSecOps-owned).
   - Working state per role per thread: `agent_state` table (volatile).
6. **No basics-explanations in code comments.** Comments explain WHY (constraint, invariant, bug context) when non-obvious.

## Caveats

- **Single-user, single-machine only.** Claude Agent SDK uses local Claude Code OAuth.
- **MCP tools block until the agent finishes its turn.** `talk_to_product_owner` is the longest because it also runs every dispatched peer sequentially.
- **No client-side abort yet** — server respects `req.signal` but the UI has no stop button.
- **No client-side message persistence sync** — the web UI's `messages` array is local; on reload it refetches via `/api/agent-state` per role but not the full message log. Refreshing mid-conversation loses the rendered transcript (DB still has it).
- **Block parsing is regex-based.** Malformed blocks (whitespace inside the role token, wrong tags) get rendered as visible text.
- **Inbox is implicit, no cursor.** Pending = handoff messages addressed to a role with id > that role's last agent turn id. Means "process inbox" without a reply still marks the items seen.

## Session continuity

`HANDOFF.md` (root, NOW block on top) is the live resume point. Update it via `/handoff` at end of session, commit the work + the HANDOFF together, push. `CLAUDE.md` (this file) is stable architecture + standards.
