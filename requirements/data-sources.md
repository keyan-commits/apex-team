# Data Sources

_Maintained by Business Analyst. Documents every external data surface the app reads from or writes to._

| Name | Type | Path / URL | Shape | Sample location | Owner |
|---|---|---|---|---|---|
| apex-team SQLite DB | SQLite | `data/apex-team.db` (gitignored) | `messages` + `agent_state` tables | — | BE Dev |
| GitHub Issues API | GitHub CLI (`gh`) | `gh issue list --repo <derived-repo>` | JSON: number, title, labels, state, updatedAt | — | BE Dev |
| apex-engine MCP | HTTP/MCP | `http://127.0.0.1:31001/mcp` (default) | MCP tools: `apex_synthesize`, `apex_fanout`, `doc_review`, `web_search`, `code`, `history_search` | — | DevSecOps |
| Claude Agent SDK | OAuth (local Claude Code session) | local process ambient | SDK `query()` interface | — | BE Dev |

## agent_state key contracts

Keys written to the `agent_state` SQLite table that are shared across more than one role (writer and renderer both need the contract).

### `health.manual_mode`

Written by: **US-080 cascade detector** (BE Dev / DevSecOps)  
Read by: **US-083 dashboard banner** (UI Dev)

```json
{
  "active": true,
  "since": "<ISO-8601 timestamp>",
  "trigger_reason": "cascade: 3+ exits in 5 min",
  "exit_count": 3,
  "window_minutes": 5
}
```

| Field | Type | Notes |
|---|---|---|
| `active` | `boolean` | `true` = cascade-protection entered manual-intervention mode; `false` = cleared |
| `since` | `string` (ISO-8601) | When manual mode was entered; omit or `null` when `active: false` |
| `trigger_reason` | `string` | Human-readable; always `"cascade: N+ exits in M min"` for cascade triggers |
| `exit_count` | `integer` | Number of exits that triggered manual mode |
| `window_minutes` | `integer` | Rolling window used (5 per current cascade-protection spec) |

OQ-320-001: schema ratified by Architect 2026-06-03. Closes BA's open question on US-083 AC2.

## Notes

- Add a row whenever a new external data surface is discovered or consumed by the app.
- "Sample location" should point to `requirements/samples/` if a sample file exists.
- "Owner" is the team role responsible for the integration.
