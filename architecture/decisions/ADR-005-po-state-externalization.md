# ADR-005 — PO Orchestrator State Externalized into 4 Thread-Scoped DB Tables

**Date:** 2026-06-02
**Status:** Accepted
**Requirement:** US-027 (PO state externalization); closes #160.
**Wave:** 72 (`eb37ecb`)

## Context

Before Wave 72, the Product Owner's working memory — which waves are queued, which PRs are open, which peers are idle, miscellaneous pipeline flags — lived exclusively in the PO's in-context HANDOFF doc (a TEXT blob in `agent_state`). This produced three forcing functions:

1. **Unreadable to other roles.** The dashboard and external tools could only observe the PO's state by parsing the freeform HANDOFF text — brittle and unqueryable.
2. **Reachable only through the PO's turn.** No REST endpoint or MCP tool could read structured pipeline data without spending tokens on a full PO turn.
3. **Volatile at context cutoff.** The HANDOFF doc is the PO's entire working memory; if it grows beyond the effective context window, older wave state silently falls off.

The solution was to promote the four most critical state dimensions into proper SQLite tables, keeping them in the same WAL-mode database the rest of the system already uses.

## Decision

Externalize PO orchestrator state into **four thread-scoped tables**, each with a composite `UNIQUE(thread_id, <key>)` constraint and `INTEGER` epoch-ms timestamps (no `DATETIME` strings — consistent with existing tables).

| Table | Scope key | Purpose |
|---|---|---|
| `wave_queue` | `(thread_id, wave)` | Ordered queue of waves: `queued`/`active`/`blocked`/`done`, numeric priority, optional notes. |
| `pr_status` | `(thread_id, pr_number)` | Open/merged/closed/conflicting PRs with title, head SHA, `closes_issues` (freeform text). |
| `peer_idle` | `(thread_id, role)` | Boolean idle/active state per peer; `last_active_at` tracks recency. |
| `pipeline_state` | `(thread_id, key)` | KV store for named pipeline flags: `current_wave`, `phase`, `open_issue_count`, blockers, etc. |

### Thread-scoping rationale

All four tables are keyed by `thread_id`. The system can run multiple independent project threads in the same SQLite file; each thread's PO is fully isolated from every other thread's. The `UNIQUE` constraint enforces exactly one row per logical entity per thread — upsert semantics used throughout.

### `peer_idle` sole-writer invariant (OQ-S72-001)

**Only the turn driver (`runTurnWithDispatches`) writes `peer_idle`.** No MCP tool, no REST handler, no tick scheduler mutates idle state directly. The driver wraps every turn in a `markRoleActive` / `markRoleIdle` pair in `try`/`finally` blocks — for both the primary target and each dispatched peer. The `try/catch` around these calls makes them best-effort: a write failure never aborts a turn. This sole-writer rule means the idle table always reflects actual turn execution, not declared intent from a model.

MCP tools `get_peer_idle_state` / `get_pipeline_state` / `get_wave_queue` / `get_pr_status_summary` are **read-only**. There is no MCP write path for any of these tables; the `set_wave_status` proposal was explicitly deferred (see below).

### `gh`-poll best-effort pattern for `pr_status` / `open_issue_count`

The tick scheduler calls `refreshGhState(threadId, workspace)` before composing each tick message. This function:
- Runs `gh pr list --state all ...` and upserts rows into `pr_status`.
- Runs `gh issue list --state open ...` and writes the count into `pipeline_state.open_issue_count`.

Both `execSync` calls are wrapped in independent `try/catch` blocks. If `gh` is not installed, the repo is not a GitHub remote, or a network timeout fires, the function returns silently — the tables simply retain their last-known state (or remain empty on a fresh thread). The AUTO-CONTINUE tick message renders `backlog=<n>` when the count is known, and `backlog=?` as the acceptable fallback when `gh` is unavailable. No turn is aborted due to a `gh` failure.

### `set_wave_status` deferral to Wave 75

US-027 AC3 (a `set_wave_status` MCP tool that lets the PO write wave queue rows) was deferred. Shipping a write tool before the PO prompt is rewritten to consume and maintain the tables would be a setter-before-caller: the table would accumulate stale data with no producer logic. The deferral is tagged "deferred to Wave 75" alongside AC2 + AC5 in US-027. Wave 75 will add the PO prompt rewrite and the write tool together so they land as a coherent unit.

## Design note: per-agent worktree isolation (resolves #168)

Wave 72 code review revealed a related structural hazard: the system has one shared working directory, and concurrent agent turns can `git checkout` different branches into it, corrupting each other's reads and writes. This is distinct from the state-externalization decision but surfaces the same class of issue — shared mutable state between concurrent actors.

### Invariant

**The primary working tree is read-only for branch state during any concurrent multi-agent wave.** All branch-level work (checkout, edit, build, test) happens in isolated per-agent worktrees at `/tmp/<role>-<branch>` (e.g. `/tmp/arch-adr`, `/tmp/qa-166`). The primary tree is only switched by a deliberate, serialized merge into `main`.

### Placement

This invariant belongs in two places:
1. **`LESSONS.md`** — append an entry: "Wave 72 review revealed that concurrent agent `git checkout` in the shared working directory corrupts reads mid-turn. Use `git worktree add /tmp/<role>-<branch> origin/<branch>` instead; clean up with `git worktree remove /tmp/<role>-<branch>` when done."
2. **`src/lib/protocols.ts`** — add a `WORKTREE_ISOLATION_PROTOCOL` constant and reference it from the Architect's and DevSecOps's role prompts. The rule: any agent that needs to inspect or modify a branch other than the current checked-out `main` creates a worktree; it never `git checkout` in the shared tree.

### Cleanup discipline

Worktrees accumulate if agents crash or a wave stalls. DevSecOps's post-merge step should include `git worktree prune` to remove stale registrations, and a `ls /tmp/<role>-*` audit before each wave fan-out to confirm no orphan worktrees are holding branch locks.

### Implementation assignment

Wave 75 (or a small standalone wave): BE Dev or DevSecOps appends the LESSONS.md entry and wires `WORKTREE_ISOLATION_PROTOCOL` into `protocols.ts` + the relevant role prompts. No schema or API change required — this is a protocol and tooling-discipline fix.

## Consequences

**Positive:**
- Dashboard and MCP clients can query structured pipeline state without spending tokens.
- `peer_idle` table enables accurate idle-peer detection from outside any turn.
- `pr_status` table feeds the AUTO-CONTINUE message with real PR data (`gh`-polled) instead of PO self-report.
- `open_issue_count` in `pipeline_state` removes the `backlog=?` placeholder when `gh` is available.
- Thread isolation ensures concurrent projects never mix state.

**Negative:**
- `refreshGhState` adds a synchronous `execSync` call before every tick; at `timeout: 10_000` ms, a slow `gh` response can add up to 10s of tick latency. Acceptable at current tick intervals (20–120s); revisit if tick intervals drop below 10s.
- `wave_queue` and `pipeline_state` are only as accurate as what the PO explicitly writes. Until the PO prompt is rewritten (Wave 75), these tables are populated only by the `gh` poller and manual MCP calls — not by PO turn output.
- `set_wave_status` deferral means US-027 AC3 remains open. Tracked in US-027 as "deferred to Wave 75."

## Recurring rules

1. **`peer_idle` sole-writer:** only `runTurnWithDispatches` calls `markRoleActive`/`markRoleIdle`. No other module may write to `peer_idle` directly. Enforce in code review.
2. **`gh`-poll best-effort:** every `execSync` call to `gh` is wrapped in its own `try/catch`; failures are silent. Never let `gh` absence abort a tick.
3. **Worktree isolation:** agents inspecting or modifying a branch use `git worktree add /tmp/<role>-<branch>`; they never `git checkout` in the shared working tree.
4. **Write tools after consumers:** do not ship a DB write MCP tool (e.g. `set_wave_status`) without the PO prompt logic that consumes and maintains its data. Setter-before-caller = stale data accumulation.

## Compatibility

Depends on Wave 71 tick scheduler (`d146799`) and Wave 73 MODEL_FIT_POLICY (`316e411`). `set_wave_status` and PO-prompt integration deferred to Wave 75. Worktree isolation protocol deferred to Wave 75 (or standalone wave). Complements ADR-003 (tick budget) and ADR-004 (runTurnWithDispatches).
