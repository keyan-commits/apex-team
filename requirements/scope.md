# Scope

_Owned by Business Analyst. Last updated: 2026-05-31._

## In Scope

**Team and orchestration**
- 8 roles: Product Owner (orchestrator), Business Analyst, Architect, UX Designer, UI Developer, Backend Developer, QA, DevSecOps
- PO orchestrates via `[[DISPATCH]]` (auto-trigger); peers coordinate via `[[HANDOFF]]` (async inbox)
- External Claude Code session drives the team via apex-team's MCP server (`/mcp` endpoint)
- Per-role model selection persisted in `localStorage` per `apex-model-<role>` key

**Infrastructure**
- Local single-user web dashboard (`http://localhost:3000`) with per-role panes
- SQLite-backed message + agent-state store (`data/apex-team.db`)
- MCP server (Streamable HTTP transport) exposing `talk_to_role`, `get_team_status`, and related tools
- apex-engine MCP tools available to every agent turn (`apex_synthesize`, `apex_web_search`, etc.)

**Mandatory phased workflow (ADR-002)**
- Requirements phase: PO must convene Architect + UX Designer + BA before any implementation wave
- BA owns `requirements/` as canonical source of truth; all implementation references a story ID
- Implementation phase: feature branches + isolated dev instances per implementer role
- Verification phase: UX Designer gate (UI changes) then QA gate (all changes) on `:3100`
- Deployment phase: DevSecOps is the sole agent authorized to merge to main and push

**Agent isolation**
- Per-role isolated dev instances: `pnpm dev:test:ui` (3110), `pnpm dev:test:be` (3120), `pnpm dev:test` (3100 for QA)
- Each instance uses its own SQLite DB (`data/test-*.db`)

**UX Designer role**
- Design specs in `<workspace>/design/INDEX.md` — referenced by every UI user story
- PASS-gates all UI changes before QA proceeds

**Self-improvement loop**
- Weekly scout wave capability (manual trigger; PO proposes when ≥7 days elapsed)
- `skill-proposal` / `mcp-proposal` GitHub issue flow for skill acquisition
- Any role may search mcpmarket.com or the Anthropic skill marketplace

## Out of Scope (and why)

| Item | Rationale |
|---|---|
| Multi-user deployment | Claude Agent SDK uses local Claude Code OAuth — single-machine only by design |
| Multi-machine sync | No shared DB or broker; SQLite is node-local |
| Public deployment / hosting | No auth, no secrets isolation beyond `.env.local` — not designed for public exposure |
| Real-time collaborative editing of the same thread | Single-user assumption; no conflict-resolution model |
| External auth beyond Claude Code OAuth | Adds complexity with no user value for a personal tool |

## Deferred (in-scope intent, not yet scheduled)

| Item | Blocker |
|---|---|
| Client-side abort button per pane | Requires server-side abort signal propagation through SSE |
| CI/CD pipeline (GitHub Actions) | Needs ANTHROPIC_API_KEY for non-OAuth runs — not available |
| Dependabot / Renovate | Can be added once CI is in place |
| LLM-driven inbox watcher | Needs design spec; low priority |
| Thread list / resume sidebar | Needs UX spec; deferred |
| Playwright MCP for QA Playwright testing | Transport drop issue (#31) not yet resolved |

## Constraints

- **Single-user, single-machine only.** Claude Agent SDK uses local OAuth. No API key.
- **No `ANTHROPIC_API_KEY`.** User is on Claude subscription (not pay-per-token). Cron / CI cannot call Claude API directly.
- **pnpm package manager.** Not npm or yarn.
- **SQLite for state.** `data/` directory is gitignored. DB is local to the machine.
- **apex-engine dependency.** Must be running at `http://127.0.0.1:31001/mcp` (or `APEX_MCP_URL` override) for agent turns to have access to MCP tools.
