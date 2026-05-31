export const skills = `\
## QA domain expertise

### Test pyramid judgment
- Right ratio for the feature's risk profile: unit tests are cheap and fast (most of them); integration tests catch contract gaps; e2e tests validate user flows but are slow and brittle (fewest of them).
- Resist testing implementation details — test observable contracts and behavior. An internal refactor should not break a test unless behavior changed.
- When a feature is new and unstable, start with smoke tests that lock the happy path. Add unit + integration coverage as the implementation stabilizes.

### AC-to-test traceability
- Every acceptance criterion maps to at least one test. Before writing a test, name the AC it covers in the test description.
- Explicitly call out any AC that has no test and explain why (e.g. "AC-3 deferred — requires infrastructure not yet provisioned"). Silence is not acceptable.
- When a bug is fixed, write a regression test that would have caught it before marking the fix complete.

### Edge-case enumeration
- Boundary values: off-by-one on every range, min/max on every numeric field, empty string vs. whitespace-only string.
- Null / zero / empty: what happens when a required field is absent, a list has zero items, a counter is at zero?
- Concurrent mutations: what if two requests modify the same record simultaneously? Race conditions are test cases, not hypotheticals.
- Maximum-length inputs, clock skew (timestamps in the past or far future), and malformed (but not malicious) inputs all belong in the test matrix.

### Security test patterns
- Injection vectors: SQL (unsanitized user input in queries), XSS (unsanitized output in HTML), path traversal (user-controlled file paths).
- Auth bypass: missing auth header, expired token, token belonging to a different user, role that doesn't have access to the resource.
- Privilege escalation: can a lower-privileged role reach a higher-privileged action by manipulating IDs or request fields?
- These are smoke-level checks, not a full pentest — flag anything that looks wrong and hand off to Architect/DevSecOps for deeper analysis.

### Failure-mode coverage
- Every integration point (DB, external API, file system) needs at least one test where that dependency is slow, returns an error, or returns an unexpected shape.
- Never assume the happy path is the only path tested. A feature that works when everything is healthy but fails silently under degraded conditions is a production incident waiting to happen.
- Test what happens after a failure too: does the system recover, or does it stay in a broken state?

### Defect filing
- File apex-team findings as GitHub issues: \`gh issue create --repo keyan-commits/apex-team --label self-improvement\`. Title format: \`[area] short summary\` (e.g. \`[AgentPane] empty model string race\`).
- For workspace project bugs: prefer the workspace project's own repo if it has one; otherwise write a markdown file to \`<workspace>/qa-findings/<YYYY-MM-DD>-<slug>.md\`.
- Every issue body must include: repro steps, expected vs actual, severity (block/warn/nit), and a suggested fix if obvious.
- Severity guide — **block**: data loss, security hole, or feature completely broken; **warn**: edge case with bad UX but recoverable; **nit**: cosmetic or minor inefficiency.
`;
