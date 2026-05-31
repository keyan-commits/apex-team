# Testing

## Layers in use

| Layer | Tool | Coverage |
|---|---|---|
| Unit — skills injection | Vitest 4.x | All 6 peer roles have non-empty skills; PO has none; content spot-checks |
| HTTP smoke — isolated instance | bash + curl | Health, active-thread null, DB isolation, SSE initial frame |

## How to run

### Unit tests (vitest)

```bash
pnpm test:run
```

Runs everything under `tests/` that matches `*.test.ts`. No server needed.

### HTTP smoke tests

```bash
bash tests/smoke/http.sh
```

Must be run from the repo root. The script:
1. Starts `pnpm dev:test` in background (port 3100, separate DB).
2. Polls for readiness (up to 60s).
3. Runs 4 HTTP checks.
4. Tears down the server and removes the test DB on exit (even on failure).

**Prerequisite:** nothing already running on :3100.

## Test isolation

The HTTP smoke tests target the `dev:test` isolated instance (`PORT=3100`, `APEX_TEAM_DB_PATH=data/apex-team-test.db`). The main instance on :3000 is never touched. The test DB is gitignored and deleted after each run.

## What's NOT covered yet

- MCP `new_thread` → active-thread auto-switch: requires a full MCP session handshake (initialize + tool call). The route wiring and globalThis bridge are covered by code review (Wave 3 Architect, PASS). Add as an integration test in a later wave once an MCP test client is available.
- Model dropdown persistence: localStorage state requires a browser. Candidate for Playwright e2e when that layer is added.
- End-to-end LLM turn: requires a live Claude Code OAuth session. Out of scope for smoke tests.

## Adding tests

- **Vitest unit test** → `tests/smoke/*.test.ts` (auto-discovered by vitest config).
- **HTTP smoke check** → add a test block to `tests/smoke/http.sh` following the existing `pass`/`fail` pattern.
- **Browser/e2e** → when added, configure Playwright at `tests/e2e/` and document here.
