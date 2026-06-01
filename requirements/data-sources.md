# Data Sources

_Maintained by Business Analyst. Documents every external data surface the app reads from or writes to._

| Name | Type | Path / URL | Shape | Sample location | Owner |
|---|---|---|---|---|---|
| apex-team SQLite DB | SQLite | `data/apex-team.db` (gitignored) | `messages` + `agent_state` tables | — | BE Dev |
| GitHub Issues API | GitHub CLI (`gh`) | `gh issue list --repo <derived-repo>` | JSON: number, title, labels, state, updatedAt | — | BE Dev |
| apex-engine MCP | HTTP/MCP | `http://127.0.0.1:31001/mcp` (default) | MCP tools: `apex_synthesize`, `apex_fanout`, `doc_review`, `web_search`, `code`, `history_search` | — | DevSecOps |
| Claude Agent SDK | OAuth (local Claude Code session) | local process ambient | SDK `query()` interface | — | BE Dev |

## Notes

- Add a row whenever a new external data surface is discovered or consumed by the app.
- "Sample location" should point to `requirements/samples/` if a sample file exists.
- "Owner" is the team role responsible for the integration.
