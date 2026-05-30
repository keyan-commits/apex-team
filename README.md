# apex-team

A local web app that runs a **team of seven role-specialized LLM agents** working in parallel on a project. The team is driven by **your Claude Code session** (in your terminal) connected to apex-team's own **MCP server**.

You type to Claude Code → Claude Code calls apex-team's MCP tools → apex-team dispatches to the team → the web UI shows you what each role is doing in real time.

Built on top of [apex-engine](../apex-engine): every team agent has apex-engine's MCP tools available (multi-model fan-out, doc review, code review, web search, etc.).

## The team

| Role | Owns |
|---|---|
| **Product Owner** | In-app orchestrator — decides who runs next, auto-dispatches via `[[DISPATCH]]` |
| **Business Analyst** | Functional requirements; maintains `<workspace>/requirements/` directory |
| **Architect** | Non-functional requirements, system design, **all code reviews**, coding standards |
| **UI Developer** | Frontend implementation |
| **Backend Developer** | Backend / API / services |
| **QA** | All testing — unit, smoke, regression, UI, backend, security; chooses testing tech |
| **DevSecOps** | CI/CD, secrets, deployments, supply-chain security |

## Prerequisites

- Node 22+ with pnpm enabled (`corepack enable`).
- The sibling **apex-engine** project running:
  ```bash
  cd ../apex-engine && pnpm setup
  ```
- Claude Code installed and logged in (`claude login`). Agents reuse that OAuth.
- For Gemini / Groq: set keys in `.env.local`.

## Run

```bash
pnpm install
cp .env.local.example .env.local   # edit if you'll use Gemini/Groq
pnpm dev                           # http://localhost:3000  + MCP at /mcp
```

In a **separate terminal**, register apex-team's MCP with your Claude Code (once):

```bash
claude mcp add apex-team --transport http http://localhost:3000/mcp
```

Then in any Claude Code session:

```
Use apex-team. Mint a new thread, set workspace to /path/to/my/project,
then talk_to_product_owner about building a markdown todo list app.
```

Claude Code will use apex-team's tools, the PO will dispatch, peers will run, and the web dashboard at `http://localhost:3000` will stream every role's reply.

## MCP tools

| Tool | What it does |
|---|---|
| `talk_to_product_owner(message, thread_id, workspace?)` | Hand the PO a goal. PO dispatches; tool returns PO reply + every dispatched peer reply. |
| `talk_to_role(role, message, thread_id, workspace?)` | Bypass PO; talk directly to a specific role. |
| `get_team_status(thread_id)` | Snapshot of HANDOFF doc sizes + inbox counts per role. |
| `read_handoff_doc(role, thread_id)` | Current HANDOFF doc for a role. |
| `list_requirements(workspace?)` | List files in BA's `<workspace>/requirements/`. |
| `read_requirement(path, workspace?)` | Read a specific requirement file. |
| `new_thread()` | Mint a fresh thread id. |
| `list_team_roles()` | List the role ids. |
| `get_workspace()` | Server's default workspace (its cwd). |
| `record_user_message(thread_id, message)` | Append user context to a thread without triggering a turn. |

## Web dashboard

`http://localhost:3000` — every role gets its own pane:

- **Product Owner** on top (full width) — see the orchestration.
- **Six peer panes** in a 3-col grid below — see each role's perspective.
- Each pane has a collapsible HANDOFF doc panel, an inbox badge (peers only), and a composer (talk directly to that role).
- **Workspace** field in the top bar controls which directory the team operates on. Persisted in `localStorage`.

## Configuration

- `APEX_MCP_URL` — apex-engine MCP endpoint (default `http://127.0.0.1:31001/mcp`).
- `GOOGLE_GENERATIVE_AI_API_KEY` — only for Gemini agents.
- `GROQ_API_KEY` — only for Groq agents.

## Architecture

See `CLAUDE.md` for the full stack, file layout, role ownership boundaries, and the NOTES / HANDOFF / DISPATCH protocols. `HANDOFF.md` tracks current state and open next-steps.
