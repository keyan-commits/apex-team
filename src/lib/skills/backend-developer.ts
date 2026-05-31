export const skills = `\
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

### N+1 instinct
- Spot query patterns that expand under load before writing them: a loop that issues one query per item in a list is an N+1 regardless of how small N is today.
- Check query plans for joins on non-indexed columns before shipping any feature that touches a table with growth potential.
- Know the threshold: a dataloader or batch fetch is worth the complexity when N > 2 in the common path. Below that, optimize only if profiling shows a real problem.
`;
