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

## Autonomous restart support

For self-modifying use (agents shipping changes to MCP-side modules), run with the supervisor instead of plain `pnpm dev`:

```bash
pnpm dev:supervised   # http://localhost:3000 + auto-restart on sentinel change
```

The team triggers a clean restart by appending a line to `.restart-trigger`. The supervisor catches the file change, SIGTERMs the server, waits up to 5s for graceful shutdown, then respawns. Use plain `pnpm dev` if you don't need this behavior.

**Single-supervisor invariant:** the supervisor refuses to start a second instance. If you see `ERROR: another supervisor is already running`, stop the existing one first.

**Stopping the supervisor (US-084 AC3):**

```bash
# by process title (preferred):
pkill -f apex-team-supervisor

# by pidfile:
kill $(cat data/apex-team-supervisor.pid)
```

**Health check — stale compile detection (US-084 AC4):**

`GET /api/health` returns `staleCompile: true` (HTTP 503) when source files have been modified after the server started. This surfaces the "conflict markers cleared but compile not refreshed" failure mode. Restart the server to clear it.

## Fresh-Mac Setup

Complete checklist for a clean machine with no prior apex-team setup.

**Prerequisites**

1. Install Node.js 22+ — https://nodejs.org (or `brew install node`)
2. Enable pnpm: `corepack enable`
3. Install gh CLI: `brew install gh`
4. Install Claude Code: `npm i -g @anthropic-ai/claude-code`

**Clone and install**

5. `git clone https://github.com/keyan-commits/apex-team.git && cd apex-team`
6. `pnpm install`

**Configure environment**

7. `cp .env.local.example .env.local`
8. Edit `.env.local` — add `GOOGLE_GENERATIVE_AI_API_KEY` and/or `GROQ_API_KEY` if you plan to use Gemini or Groq agents (optional; Claude agents need no key)

**Bootstrap apex-engine (sibling repo)**

9. `cd ../apex-engine && pnpm setup` — starts the apex-engine MCP server at `http://127.0.0.1:31001/mcp`
10. Leave it running; return to this repo: `cd ../apex-team`

**Authenticate**

11. `claude login` — Claude agents reuse this OAuth
12. `gh auth login` — needed for QA's self-improvement issue filing

**Register the MCP server with Claude Code (once per machine)**

13. `claude mcp add apex-team --transport http http://localhost:3000/mcp`

**Start**

14. `pnpm dev:supervised` — server at `http://localhost:3000` with auto-restart support

**Verify**

15. Open `http://localhost:3000` — seven role panes should appear
16. In a Claude Code session: call `talk_to_product_owner("hello", "<thread_id>")` — PO should reply

Run `pnpm preflight` at any point to check all prerequisites automatically.

## Claude authentication

Apex-team's team agents reuse your local Claude Code OAuth session — **no `ANTHROPIC_API_KEY` needed**. Cron-based or unattended features (e.g. automated nightly skill scouting) would require a paid Anthropic API key and are deliberately not implemented; scout runs as a manual session wave instead (PO proposes one when >7 days have elapsed).

## Per-role isolated work (ADR-002 phased workflow)

Each wave follows a strict phase model: Requirements → Implementation → Verification → DevSecOps deploy.

### Start a feature branch

```bash
pnpm branch:start <wave>-<short>
# e.g. pnpm branch:start 10a-workflow-ui
```

Requires: clean working tree on `main`. Creates `feature/<wave>-<short>` from latest main.

### Per-role dev instances

| Role | Script | Port | DB |
|---|---|---|---|
| UI Developer | `pnpm dev:test:ui` | 3110 | `data/apex-team-test-ui.db` |
| BE Developer | `pnpm dev:test:be` | 3120 | `data/apex-team-test-be.db` |
| QA | `pnpm dev:test:qa` | 3100 | `data/apex-team-test-qa.db` |
| UX Designer | `pnpm dev:test:ux` | 3130 | `data/apex-team-test-ux.db` |
| **Live (user)** | `pnpm dev` | **3000** | `data/apex-team.db` |

### Workflow summary

1. **Implementers** (UI Dev / BE Dev): branch → worktree → isolated instance → implement → unit tests → HANDOFF QA + UX.
2. **UX Designer**: review on `:3130` against `design/INDEX.md` → PASS/REVISE → HANDOFF DevSecOps on final PASS.
3. **QA**: verify on `:3100` against BA's acceptance criteria → PASS/FAIL with evidence → HANDOFF DevSecOps.
4. **DevSecOps** (sole deploy authority): on QA PASS + UX PASS → `git merge --no-ff feature/<slug>` → `git push origin main`.
   - The user's `pnpm dev` on port 3000 is the live instance.
   - Rollback: `git revert HEAD` + push.

### Worktree workflow (physical filesystem isolation)

Worktrees give each implementer a **separate filesystem checkout** — uncommitted work is invisible to other roles, and each process writes to its own isolated DB.

#### Create a worktree

```bash
pnpm branch:start <role> <wave>-<short>
# e.g. pnpm branch:start ui-developer 10a-workflow-ui
# Creates ../apex-team-ui-developer-10a-workflow-ui/ on a new feature branch
```

Valid roles: `ui-developer | backend-developer | qa | ux-designer`

#### Inside the worktree

```bash
cd ../apex-team-<role>-<wave>-<short>
pnpm install          # each worktree needs its own node_modules (pnpm per-dir virtual store)
pnpm dev:test:ui      # or dev:test:be / dev:test:qa / dev:test:ux
```

**`node_modules` caveat:** run `pnpm install` once inside each new worktree before starting the server.

**DB caveat:** `pnpm dev:test:<role>` writes to a role-specific `data/apex-team-test-<role>.db` inside the worktree's own `data/` directory. DB state is per-worktree — no cross-contamination between implementers.

#### Cleanup (DevSecOps runs this after successful deploy)

```bash
pnpm branch:cleanup <role> <wave>-<short>
# Removes the worktree directory; deletes the branch if already merged into main.
```

Full ops documentation: `ops/README.md`.

## Architecture

See `CLAUDE.md` for the full stack, file layout, role ownership boundaries, and the NOTES / HANDOFF / DISPATCH protocols. `HANDOFF.md` tracks current state and open next-steps.
