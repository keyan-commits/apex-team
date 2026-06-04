# US-027 — Externalize PO state into structured DB tables (wave queue, PR status, peer idle)

**Status:** superseded
**Owner role:** backend-developer (schema + MCP tools + migration); ui-developer (dashboard panel); architect (schema review required before `accepted`)
**Created:** 2026-06-01
**Story ID:** US-027
**Target wave:** 72

---

## Resolution — superseded by Plan C cutover

All ACs target SQLite tables (`pipeline_state`, `wave_queue`, `pr_status`, `peer_idle`), `src/lib/db.ts`, and the MCP server — all monolith constructs retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). Under the subagent runtime, PO state is maintained in `coordination/handoffs/product-owner.md` (a file on disk); there is no SQLite DB or MCP server to wire new tables into. This story never reached `accepted` (status was `draft`).

## Narrative

As a **team operator / Product Owner**, I want the PO's wave queue, PR status, and peer idle state stored in structured SQLite tables rather than in the HANDOFF prompt context, so that context size is bounded, state is machine-readable, audit-trailed, and immune to context-window compression loss.

## Acceptance Criteria

- **AC1 — Schema migration (idempotent).** Given a fresh or existing `apex-team.db`, when the server boots, then four new tables exist (created if absent, skipped-create if present per #140 drift-trap pattern):
  - `pipeline_state(id INTEGER PK, key TEXT UNIQUE, value TEXT, updated_at INTEGER)` — KV store for current wave number, phase, blockers.
  - `wave_queue(id INTEGER PK, wave INTEGER UNIQUE, title TEXT, status TEXT CHECK(status IN ('queued','active','blocked','done')), priority INTEGER, notes TEXT, updated_at INTEGER)`.
  - `pr_status(id INTEGER PK, pr_number INTEGER UNIQUE, title TEXT, status TEXT CHECK(status IN ('open','merged','closed','conflicting')), sha TEXT, closes_issues TEXT, updated_at INTEGER)`.
  - `peer_idle(id INTEGER PK, role TEXT UNIQUE, is_idle INTEGER CHECK(is_idle IN (0,1)), last_active_at INTEGER, updated_at INTEGER)`.
  _(Testable: query each table after boot; no exception thrown.)_

- **AC2 — PO HANDOFF wave-queue section replaced.** Given PR #0 (state externalization) merged, when PO writes its HANDOFF NOTES, then the HANDOFF body contains NO markdown Wave queue table. The PO reads wave state via the `get_wave_queue` MCP tool; it does NOT reconstruct wave state from prompt context.
  _(Testable: search PO HANDOFF body for the literal string "| wave |" → 0 matches after 3 consecutive turns.)_

- **AC3 — Four new MCP tools.** Given the server is running, when any role calls:
  - `get_wave_queue()` → returns `wave_queue` rows ordered by priority;
  - `set_wave_status(wave: number, status: string, notes?: string)` → upserts `wave_queue` row;
  - `get_pr_status_summary()` → returns `pr_status` rows where `status='open'` (or all if `include_closed=true`);
  - `get_peer_idle_state(role?: string)` → returns `peer_idle` row(s),
  then each tool returns JSON with a `data` array and `updated_at` timestamps.
  _(Testable: curl `/mcp` with each tool call; verify JSON shape.)_

- **AC4 — Dashboard "Wave queue" panel reads from DB.** Given Wave queue data exists in `wave_queue` table, when the dashboard loads `/api/wave-state`, then the Wave queue panel renders rows sourced from the DB response — not parsed from PO HANDOFF text.
  _(Testable: insert a row directly into `wave_queue` via sqlite3 CLI; reload dashboard; row appears without a PO turn firing.)_

- **AC5 — Boot backfill migration (one-shot, idempotent).** Given an existing PO HANDOFF doc containing a Wave queue markdown table, when the server boots for the first time after Wave 72 ships, then each wave row is parsed and upserted into `wave_queue` (status preserved where parseable, defaulted to `queued` otherwise). Subsequent boots are no-ops (idempotent upsert).
  _(Testable: pre-populate PO HANDOFF with 3 wave rows; boot; query `wave_queue`; 3 rows present; boot again; still 3 rows, no duplicates.)_

- **AC6 — PO HANDOFF target size ≤ 2 000 chars.** Given PO HANDOFF doc exceeds 2 000 chars, when PO writes its next NOTES block, then `providers.ts` logs a `[HANDOFF-SIZE-WARNING]` console line. The warning does NOT block the turn; it is a soft enforcement signal visible in server logs.
  _(Testable: write a 2 001-char NOTES block; verify `[HANDOFF-SIZE-WARNING]` in server stdout.)_

- **AC7 — Schema versioned; drift detection on boot.** Given `wave_queue` already exists with the correct schema, when the server boots, then `CREATE TABLE IF NOT EXISTS` is used for all four tables (no DROP, no re-CREATE, no data loss). The `skip-create on existing columns` pattern from #140 applies: `ALTER TABLE … ADD COLUMN IF NOT EXISTS` for any new columns added in future waves.
  _(Testable: create tables manually; boot server; verify tables still contain prior data and no error thrown.)_

- **AC8 — Observability endpoint.** Given the server is running, when `GET /api/wave-state?thread_id=<id>` is called, then the response is HTTP 200 JSON with keys `pipeline_state`, `wave_queue`, `pr_status`, `peer_idle` — each an array of current rows. Used by dashboard + external tools.
  _(Testable: curl `/api/wave-state`; verify 200 + all four keys present.)_

## Out of Scope

- **Real-time push/SSE for wave state** — dashboard polls `/api/wave-state`; no WebSocket or SSE in Wave 72.
- **PO auto-updating `pr_status` from GitHub API** — that's a future wave (Architect must design the polling cadence to avoid rate-limiting). For Wave 72, `pr_status` rows are written by roles (PO + DevSecOps) via `set_wave_status` / direct upsert.
- **Migrating non-wave state out of prompt context** (e.g. session ledger, milestone log) — Wave 72 targets wave-queue + PR status + peer idle only. Full context-size reduction is a multi-wave effort.
- **Access control** — single-user app; no auth on `/api/wave-state` required.

## Open Questions

- **OQ-S72-001** (OPEN): Should `peer_idle` rows be updated automatically by the turn driver (after each `runTurn` completes, mark the role non-idle; when tick fires and no inbox, mark idle)? Or manually via MCP tool only? **Working assumption:** auto-update in turn driver — this is the most reliable signal. Architect to confirm before story moves to `accepted`.

## Links

_(Filled in during implementation)_

- impl: `(SHA-pending)`
- test: `(pending)`
- design-pass-by: N/A (no UI rendering pixels; AC4 dashboard panel is data-binding only — routes to Architect gate, not UX gate)
- qa-pass-by: `(pending)`
- deployed-by: `(pending)`
