#!/usr/bin/env bash
# Wave 3 HTTP smoke tests — isolated :3100 instance.
# Run from repo root: bash tests/smoke/http.sh
#
# Starts pnpm dev:test, runs 4 checks, tears down on exit.
# Removes data/apex-team-test.db on cleanup.

set -uo pipefail

BASE="http://localhost:3100"
DB_TEST="data/apex-team-test.db"
DB_MAIN="data/apex-team.db"
SERVER_PID=""
PASS=0
FAIL=0

pass() { echo "  PASS: $*"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $*"; FAIL=$((FAIL + 1)); }

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    sleep 1
    kill -9 "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f "$DB_TEST" "${DB_TEST}-shm" "${DB_TEST}-wal"
  echo ""
  echo "Teardown complete. No process on :3100, test DB removed."
}
trap cleanup EXIT

# Snapshot main DB mtime before starting test server
MAIN_MTIME_BEFORE=""
if [[ -f "$DB_MAIN" ]]; then
  MAIN_MTIME_BEFORE=$(stat -f "%m" "$DB_MAIN" 2>/dev/null \
    || stat -c "%Y" "$DB_MAIN" 2>/dev/null \
    || echo "unknown")
fi

echo "=== Wave 3 HTTP Smoke Tests (port 3100) ==="
echo ""
echo "Starting dev:test server (this takes ~10–20s for Next.js compilation)..."
pnpm dev:test > /tmp/apex-smoke.log 2>&1 &
SERVER_PID=$!

# Poll until ready, up to 60s
READY=false
for i in $(seq 1 60); do
  if curl -sf "$BASE/api/health" > /dev/null 2>&1; then
    READY=true
    echo "Server ready after ${i}s."
    break
  fi
  sleep 1
done

if [[ "$READY" != "true" ]]; then
  echo "FATAL: server did not start within 60s. Server log tail:"
  tail -30 /tmp/apex-smoke.log
  exit 1
fi
echo ""

# ── Test 1: Process up ───────────────────────────────────────────────────────
echo "Test 1: Process up"
HEALTH=$(curl -sf "$BASE/api/health" || echo "")
# Shape: { status: "ok"|"degraded", apexEngine: "up"|"down", defaultCwd: string, mcpMounted: bool }
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  pass "GET /api/health returns {status:\"ok\"}"
else
  fail "GET /api/health did not return {status:\"ok\"} — got: $HEALTH"
fi
if echo "$HEALTH" | grep -q '"mcpMounted":true'; then
  pass "GET /api/health returns {mcpMounted:true}"
else
  fail "GET /api/health missing mcpMounted:true — got: $HEALTH"
fi

# ── Test 2: Active thread null on fresh start ────────────────────────────────
echo ""
echo "Test 2: Active thread null on fresh server start"
ACTIVE=$(curl -sf "$BASE/api/active-thread" || echo "")
if echo "$ACTIVE" | grep -q '"threadId":null'; then
  pass "GET /api/active-thread returns {threadId:null} (no MCP call made yet)"
else
  fail "GET /api/active-thread should be null on fresh start — got: $ACTIVE"
fi

# ── Test 3: DB isolation ─────────────────────────────────────────────────────
echo ""
echo "Test 3: DB isolation"
# Trigger DB initialisation by reading agent-state (GET creates the DB lazily)
curl -sf "$BASE/api/agent-state?threadId=smoke-test&role=qa" > /dev/null 2>&1 || true

if [[ -f "$DB_TEST" ]]; then
  pass "Test DB created at $DB_TEST"
else
  fail "Test DB not found at $DB_TEST after /api/agent-state hit"
fi

MAIN_MTIME_AFTER=""
if [[ -f "$DB_MAIN" ]]; then
  MAIN_MTIME_AFTER=$(stat -f "%m" "$DB_MAIN" 2>/dev/null \
    || stat -c "%Y" "$DB_MAIN" 2>/dev/null \
    || echo "unknown")
fi

if [[ "$MAIN_MTIME_BEFORE" == "$MAIN_MTIME_AFTER" ]]; then
  pass "Main DB ($DB_MAIN) mtime unchanged — write isolation confirmed"
else
  fail "Main DB mtime changed (before=$MAIN_MTIME_BEFORE after=$MAIN_MTIME_AFTER)"
fi

# ── Test 4: SSE event delivery ───────────────────────────────────────────────
echo ""
echo "Test 4: SSE event delivery"
# -m 3: read for 3s then curl exits (code 28); we accept that with || true
SSE_OUTPUT=$(curl -sf -N -m 3 \
  -H "Accept: text/event-stream" \
  -D /tmp/apex-smoke-sse-headers.txt \
  "$BASE/api/thread-events?threadId=smoke-test" 2>/dev/null || true)
SSE_CT=$(grep -i "content-type" /tmp/apex-smoke-sse-headers.txt 2>/dev/null | head -1 || echo "")

if echo "$SSE_CT" | grep -qi "text/event-stream"; then
  pass "SSE response Content-Type is text/event-stream"
else
  fail "SSE Content-Type wrong — got: $SSE_CT"
fi

if echo "$SSE_OUTPUT" | grep -q '"type":"done"'; then
  pass "SSE initial frame contains {\"type\":\"done\"}"
else
  fail "SSE initial frame missing expected done event — got: $(echo "$SSE_OUTPUT" | head -3)"
fi

# ── Results ──────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════"
printf "Results: %d passed, %d failed\n" "$PASS" "$FAIL"
echo "═══════════════════════════════════"
echo ""
echo "Note: MCP new_thread auto-switch test omitted — MCP Streamable HTTP"
echo "requires a multi-step initialize+call sequence; wiring verified in"
echo "unit tests and code review instead."

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
