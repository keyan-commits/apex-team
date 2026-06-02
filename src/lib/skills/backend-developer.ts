import { IMPLEMENTER_REFUSAL_CLAUSE } from "@/lib/protocols";

export const skills = `\
${IMPLEMENTER_REFUSAL_CLAUSE}


## Backend development domain expertise

### API resource modeling
- REST noun discipline: resources are nouns (plural), actions are HTTP verbs. Never encode an action in a URL path segment when a verb covers it.
- Consistent error envelope across all endpoints: \`{ error: { code, message, details? } }\` — callers shouldn't pattern-match on HTTP status alone.
- Idempotency for mutating operations that can retry: PUT and DELETE are inherently idempotent; POST mutations that can be retried need a client-supplied idempotency key or a dedup mechanism.

### Transaction boundary discipline
- Be explicit about what each DB transaction covers. A function that does two writes either commits both or neither — partial-commit paths are bugs waiting to surface under load or interruption.
- Distinguish optimistic locking (check-then-update with version field, retry on conflict) from pessimistic locking (SELECT FOR UPDATE, hold until commit). Pick based on contention likelihood, not convenience.
- Never commit partial state silently. If a multi-step operation can't complete atomically, document the compensation path.

### Error taxonomy
- Operational errors (network timeouts, DB connection failure, external API 5xx) are expected and should be handled with retry + circuit-breaker patterns where appropriate.
- Programmer errors (type assertion failures, null dereferences, violated invariants) should crash loudly or throw — never swallow them into a generic "something went wrong."
- Log operational errors at WARN; log programmer errors at ERROR. Never log a stack trace at INFO.

### Structured logging
- Correlation ID on every request, threaded through every log line for that request. Without it, multi-service debugging is archaeology.
- Structured key-value fields (JSON), not string interpolation. \`{ userId, action, durationMs }\` is queryable; \`"user 123 did X in 45ms"\` is not.
- No PII in logs, ever. User IDs are fine; email addresses, tokens, and session cookies are not. Apply this rule at the logger level, not just at the call site.

### OpenTelemetry trace correlation
- Prefer W3C \`traceparent\` header propagation over ad-hoc correlation IDs — the OTel SDK injects and extracts these automatically across HTTP boundaries, so manual threading breaks only at service edges.
- Attach business context (thread_id, role, turn_id) as span attributes via \`span.setAttribute()\`, not only as log fields. This links logs to traces in any OTLP-compatible backend (Jaeger, Tempo, Honeycomb).
- Distinguish spans from logs: a span covers a unit of work with start/end/status; a log is a point event. Both should share the same trace_id so they're co-queryable.
- Node.js caveat: use AsyncLocalStorage (OTel's default context manager for Node) to preserve trace context across \`await\` boundaries — raw callbacks lose context without it.

### Rate limiting
- **Token-bucket**: allows bursts up to bucket capacity; replenishes at a fixed rate. Best for user-facing APIs where occasional bursts are acceptable (e.g. apex-team's \`/api/chat\` SSE endpoint).
- **Sliding-window counter**: smoother than fixed-window; counts requests in the last N seconds. Best for strict fairness across clients.
- **Fixed-window**: simplest; resets every interval. Prone to boundary spikes (2× burst at the window edge) — avoid for abuse-sensitive endpoints.
- Apply to any endpoint callable by untrusted clients (MCP tools, webhooks, public APIs). Internal service-to-service calls behind a network boundary can skip it.
- In Node.js: prefer middleware-level limiting (e.g. \`express-rate-limit\` with a Redis store for multi-instance) over application-level guards — it fires before any business logic runs.
- Return \`429 Too Many Requests\` with a \`Retry-After\` header. Include current limit metadata in response headers: \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, \`X-RateLimit-Reset\`.

### N+1 instinct
- Spot query patterns that expand under load before writing them: a loop that issues one query per item in a list is an N+1 regardless of how small N is today.
- Check query plans for joins on non-indexed columns before shipping any feature that touches a table with growth potential.
- Know the threshold: a dataloader or batch fetch is worth the complexity when N > 2 in the common path. Below that, optimize only if profiling shows a real problem.

### Pre-HANDOFF unit testing
- Stack: Vitest + \`vi.mock\` (see \`tests/smoke/po-dispatch.test.ts\` for the project pattern).
- What to test per endpoint:
  - Request validation — invalid body/missing fields → correct 4xx error envelope \`{ error: { code, message } }\`.
  - Happy path — valid input → correct 2xx shape (shape contract, not internal implementation detail).
  - Error propagation — mock the DB or downstream call to throw → route returns the expected 5xx envelope without leaking stack traces.
- What NOT to test: internal helper implementation, SQL string contents, log output (unless observability is an explicit AC).
- Mocking \`better-sqlite3\`: mock \`src/lib/db.ts\` wholesale via \`vi.mock('../../../src/lib/db')\`; return a stub object for the relevant query methods. Never test against a real DB in unit tests — that's QA's job on :3100.
- Testing Next.js API route handlers: construct a \`new Request('http://localhost/api/...', { method: 'POST', body: JSON.stringify({...}) })\` and call the exported \`GET\` / \`POST\` function directly. Assert on \`response.status\` + \`await response.json()\`.
- Pre-HANDOFF checklist (run in order, all must pass):
  1. \`pnpm type-check\` — zero errors
  2. \`pnpm test:run\` — all tests in \`tests/be/\` pass
  3. Manual smoke on \`pnpm dev:test:be\` (port 3120) — the endpoint responds correctly end-to-end
  4. HANDOFF to QA with test output evidence

### HANDOFF state updates — fragment pattern (Wave 93+)
Per ADR-014, do NOT edit \`HANDOFF.md\` directly in PRs. Write a fragment instead:
\`_handoff-pending/<wave>-backend-developer.md\`

4-section format (all sections required):
\`\`\`
## Done
- <what shipped this wave>
## In flight
- <what's mid-stream>
## Next
- <what's queued>
## Notes
- <caveats, links>
\`\`\`

PO folds all fragments into \`HANDOFF.md\` at wave close with \`pnpm fold-handoff\`.
The pre-commit hook accepts either a direct \`HANDOFF.md\` edit or a fragment — both valid during the migration window.
`;
