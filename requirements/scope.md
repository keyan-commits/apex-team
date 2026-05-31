# Scope

_Owned by Business Analyst. Last updated: 2026-05-31._

## In Scope
- 7-role LLM agent team running in a local web dashboard
- Product Owner orchestrates via DISPATCH; peers coordinate via HANDOFF (async inbox)
- External Claude Code drives the team via apex-team's MCP server
- Per-role model selection (Wave 2: UI Dev stream)
- Active-thread tracking with auto-switch (Wave 2: Backend Dev stream)
- Isolated test environment (Wave 2: DevSecOps stream)

## Out of Scope
- Multi-user / multi-machine deployment
- Real-time collaborative editing
- External auth (beyond local Claude Code OAuth)

## Deferred
- Graceful-restart supervisor (pm2 / sentinel-file watcher)
- Client-side abort button per pane
- End-to-end smoke test against external workspace
- `/api/health` MCP-transport field
- ESLint CLI migration
