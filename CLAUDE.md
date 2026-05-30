# CLAUDE.md — apex-team

Local single-user web app that orchestrates **multiple role-specialized LLM agents** working on the same task **in parallel**. Each agent has:

1. Its own conversation perspective (filtered view of the shared thread).
2. Its own **persistent HANDOFF doc** — a living working-state document (current state, open questions, parked items) that the agent maintains across turns. The doc is prepended to the agent's system prompt on every turn so the agent retains continuity.
3. Its own **inbox** of cross-agent handoff messages from teammates.

Agents are NOT chained in a serial relay. The user (or future schedulers) trigger turns per agent; agents send each other async messages but do not auto-summon each other.

Built on top of **apex-engine** (sibling project at `../apex-engine`) — agents call apex-engine's MCP tools (`apex_synthesize`, `apex_fanout`, `doc_review`, `code` reviewers, `history_search`, `web_search`, …) to do their work.

## Goal

A two-pane UI (MVP: **Business Analyst** | **Developer**) where:

- Each agent has a distinct system prompt that defines its role.
- Each agent has its own composer + busy state — **both panes can be working concurrently**.
- An agent reply may contain two structured blocks:
  - `[[NOTES]] … [[/NOTES]]` — replaces the agent's own HANDOFF doc with new content. Skipped if absent.
  - `[[HANDOFF: <role>]] … [[/HANDOFF]]` — drops a message into the named teammate's inbox. May appear multiple times. Does **NOT** auto-trigger the teammate.
- Each pane shows a collapsible HANDOFF panel (the agent's current doc) and an inbox badge counting pending handoffs from teammates.
- A "Process inbox" button per pane runs the agent against its current inbox without a new user message — useful for "catch up on what your teammate sent you."

## Stack

- **Framework:** Next.js 15 (App Router, RSC, Streaming) · React 19 · TypeScript 5
- **Styling:** Tailwind CSS v4 + `@tailwindcss/typography` + styled-jsx (component-scoped)
- **LLM SDKs:**
  - `@anthropic-ai/claude-agent-sdk` — Claude agents (reuses local Claude Code OAuth — no API key)
  - `ai` (Vercel AI SDK v6) + `@ai-sdk/google` + `@ai-sdk/groq` — for non-Claude agents
- **MCP client:** Claude Agent SDK's built-in MCP client. Each Claude agent is configured with `mcpServers: { "apex-engine": { type: "http", url: APEX_MCP_URL } }` and an allowlist of safe tools (see `src/lib/mcp-config.ts`).
- **State:** SQLite via `better-sqlite3` (`data/apex-team.db`, gitignored). One `messages` table keyed by `thread_id`.
- **Markdown:** `react-markdown` + `remark-gfm`
- **Package manager:** pnpm
- **Run mode:** local-only, `pnpm dev` at `localhost:3000`

## Architecture

```
user message (target = one role)        ←─── per-pane composer
  │
  ▼  POST /api/chat  (SSE)
single-agent turn
  │
  ├── load this role's HANDOFF doc + pending inbox + thread history
  ├── augment system prompt with HANDOFF doc + inbox summary
  ├── stream reply (Claude Agent SDK or AI SDK)
  │     · Claude agents have apex-engine MCP tools enabled
  ├── parse reply for [[NOTES]] (own state) and [[HANDOFF: role]] (inbox drops)
  ├── persist: visible text → messages, NOTES → agent_state, each HANDOFF → messages
  └── emit `done`

Per-agent state is stored in `agent_state(thread_id, role)`. Pending inbox is
computed on the fly: handoff messages addressed to this role with id greater
than the role's most recent agent turn.
```

## File layout

```
apex-team/
├── src/
│   ├── app/
│   │   ├── page.tsx                       (top-level client component: two panes + orchestrator bar)
│   │   ├── layout.tsx, globals.css
│   │   └── api/
│   │       ├── chat/route.ts              (SSE — single-agent turn, parses NOTES + HANDOFF blocks)
│   │       ├── agent-state/route.ts       (GET/PUT — per-agent HANDOFF doc + inbox)
│   │       ├── thread/route.ts            (GET — load thread history)
│   │       └── health/route.ts            (apex-engine reachability check)
│   ├── components/
│   │   ├── AgentPane.tsx                  (one role's pane: header + HANDOFF panel + transcript + composer)
│   │   ├── AgentStatePanel.tsx            (collapsible per-pane HANDOFF doc viewer/editor)
│   │   ├── OrchestratorBar.tsx            (top bar: thread id + dispatch input)
│   │   └── MessageBubble.tsx              (markdown bubble with per-author styling)
│   ├── lib/
│   │   ├── roles.ts                       (system prompts + NOTES/HANDOFF protocol — single source of truth)
│   │   ├── providers.ts                   (claude/gemini/groq streaming; augments system prompt with HANDOFF doc + inbox)
│   │   ├── agents.ts                      (turn driver — loads state/history/inbox, streams reply)
│   │   ├── orchestrator.ts                (block parser — NOTES + HANDOFF; no relay loop)
│   │   ├── mcp-config.ts                  (apex-engine MCP server config + tool allowlist)
│   │   ├── db.ts                          (SQLite — messages + agent_state tables, pending-inbox query)
│   │   ├── sse.ts                         (server-side SSE encoder)
│   │   └── sse-client.ts                  (browser SSE consumer)
│   └── types.ts                           (shared shapes — Role, Provider, ChatMessage, AgentState, SseEvent)
├── data/                                  (gitignored — apex-team.db)
├── HANDOFF.md                              (volatile — current state, next steps)
└── README.md
```

## Commands

```bash
pnpm install         # install deps
pnpm dev             # local server at http://localhost:3000
pnpm build           # production build
pnpm type-check      # tsc --noEmit
pnpm lint
pnpm test:run        # vitest one-shot
```

## Prerequisites

- `../apex-engine` must be running with its HTTP MCP server (`cd ../apex-engine && pnpm setup`) — the team app expects it at `http://127.0.0.1:31001/mcp`. Override via `APEX_MCP_URL` in `.env.local`.
- Claude agents require Claude Code to be logged in on this machine (the Agent SDK reuses that OAuth). No Anthropic API key.
- Gemini / Groq agents only work if `GOOGLE_GENERATIVE_AI_API_KEY` / `GROQ_API_KEY` are set in `.env.local`.

## Engineering Standards (inherited from apex-engine)

1. **Keep it lean.** Minimal deps. Async-first. Server-side streaming. No abstraction without repetition.
2. **Direct integration.** Provider SDKs called directly. No aggregator/proxy layer.
3. **Streaming UX.** Tokens stream to the active pane the moment the provider emits them.
4. **Server-only secrets.** API keys are only read from `process.env` in server modules. Never expose to client. Anything imported by a `"use client"` component must be free of `node:*` imports.
5. **Role prompts live in one place** (`src/lib/roles.ts`) — they include the handoff protocol so all roles speak the same routing language.
6. **No silent role mutation.** If the orchestrator needs to inject a system message, it goes through `appendMessage` with author kind `orchestrator` so the user can see it.
7. **No basics-explanations in code comments.** Comments explain WHY (constraint, invariant, bug context) when non-obvious.

## Caveats

- **Single-user, single-machine only.** Claude Agent SDK uses local Claude Code OAuth.
- **MVP roles only.** Two roles (`business-analyst`, `developer`). Adding a role = add to `RoleId` union in `src/types.ts`, add entry to `ROLES` in `src/lib/roles.ts`, add UI hook-up in `src/app/page.tsx`.
- **No abort wiring on Claude agent yet.** Closing the tab halts streaming UI; the upstream Agent SDK call may still complete (same caveat as apex-engine).
- **Block parsing is regex-based.** If an agent strays from the `[[NOTES]]` / `[[HANDOFF: …]]` syntax, the malformed block is treated as visible text — the agent's state simply doesn't update that turn.
- **Inbox is implicit, not a separate table.** Pending = handoff messages addressed to the role with id greater than the role's most recent agent turn. Simple, no migrations, but you can't "mark read without replying" without adding an explicit cursor.

## Session Continuity

**Volatile state lives in `HANDOFF.md`.** Read it first when resuming work. Update it after every completed task. `CLAUDE.md` (this file) = stable architecture and standards.
