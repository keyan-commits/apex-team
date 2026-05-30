# apex-team

A local web app that orchestrates a small **team of LLM agents** — each agent has a distinct role (MVP: Business Analyst + Developer), runs as its own conversation, and hands off to its teammate via a structured `[[HANDOFF: role]] … [[/HANDOFF]]` protocol.

Built on top of [apex-engine](../apex-engine): agents call apex-engine's MCP tools (`apex_synthesize`, `apex_fanout`, `doc_review`, code reviewers, `web_search`, etc.) when they need to research, review, or fan out a question to multiple models.

## What you get

- Two-pane UI (BA | Developer). Each pane shows messages from that role's perspective and has its own composer.
- A top **Orchestrator bar** to dispatch a task to one of the agents.
- Automatic handoff relay: an agent ends a reply with `[[HANDOFF: developer]] … [[/HANDOFF]]` and the orchestrator immediately streams the other agent's response (cap: 6 hops per user turn).
- Per-agent provider switching: **Claude** (default — reuses Claude Code OAuth, no API key), **Gemini**, **Groq**.
- SQLite-backed thread persistence.

## Prerequisites

- Node 22+ with pnpm enabled (`corepack enable`).
- The sibling **apex-engine** project running with its HTTP MCP server:
  ```bash
  cd ../apex-engine
  pnpm setup        # one-shot install + start
  ```
  Default MCP URL: `http://127.0.0.1:31001/mcp`.
- For Claude agents: be logged into Claude Code on this machine (`claude login`).
- For Gemini / Groq agents: set the matching key in `.env.local` (see `.env.local.example`).

## Run

```bash
pnpm install
cp .env.local.example .env.local   # edit if you'll use Gemini or Groq
pnpm dev                           # http://localhost:3000
```

## Try it

1. In the top bar, leave the dropdown on **→ BA** and type:
   *"Plan a tiny markdown todo list app for a developer audience."*
   Click **Dispatch**.
2. Watch the Business Analyst draft user stories + acceptance criteria, then end the reply with a `[[HANDOFF: developer]]` block.
3. The Developer pane fills in automatically with an implementation outline.
4. Either pane's composer lets you intervene: ask BA to tighten a story, or ask Dev for a risk callout.

## Configuration

- `APEX_MCP_URL` — apex-engine MCP HTTP endpoint (default `http://127.0.0.1:31001/mcp`).
- `GOOGLE_GENERATIVE_AI_API_KEY` — only needed when switching an agent to Gemini.
- `GROQ_API_KEY` — only needed when switching an agent to Groq.

## Architecture

See `CLAUDE.md` for the full stack, file layout, and engineering standards. `HANDOFF.md` tracks current state and open next-steps.
