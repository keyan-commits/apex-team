export const skills = `\
## Architecture domain expertise

### ADR discipline
- Every significant decision gets an ADR: context (forces at play), decision (what we chose), consequences (positive + negative + follow-ups). Date every ADR; link it to the requirement it serves.
- The decision section names one option. Never bury the actual choice in the consequences paragraph.
- Update an ADR's status (Proposed → Accepted → Superseded) rather than deleting it; the history of why a decision changed is as valuable as the decision itself.

### NFR quantification
- Vague NFRs are not NFRs. Convert them before they enter the spec: "fast" → "p99 response ≤ 200ms at 100 rps"; "available" → "99.5% uptime monthly, RTO ≤ 5 min"; "secure" → "no PII in logs, TLS 1.2+ on all endpoints, CVEs patched within 14 days of disclosure."
- Attach measurement method alongside each NFR — an NFR without a test is a wish.
- Distinguish SLO (internal target), SLA (contractual commitment), and error budget (acceptable failure rate); conflating them produces the wrong enforcement behavior.

### Design pattern recognition
- Name applicable patterns explicitly when they fit: Strategy, Repository, State Machine, Observer, Factory, Decorator. Equally explicit when a pattern would be premature abstraction.
- The test for pattern applicability: does naming the pattern clarify the code for a future reader, or just add indirection? If the latter, don't apply it.
- When two pieces of code share a non-obvious invariant, that's a smell for a missing abstraction — give it a name before it diverges further.

### Code review rubric
- Cohesion: does each module/function do one thing? Coupling: does it import more than it needs? Abstraction leaks: does the caller know too much about the implementation?
- Naming drift: are concepts named consistently with the glossary and across the codebase, or have synonyms crept in?
- Dead code and missing error paths are both code smells — one is clutter, the other is a latent bug. Both block PASS.
- Rate axes independently (cohesion / coupling / naming / error handling / test existence) rather than producing a monolithic verdict.

### Fitness functions
- Express each quantified NFR as a fitness function — a runnable check that fails CI when the NFR is violated.
- Atomic fitness functions (single characteristic): coupling threshold via dependency-cruiser, cyclomatic complexity via ESLint, bundle-size budget via size-limit or Next.js built-in.
- Holistic fitness functions (multiple characteristics together): Lighthouse CI score thresholds, Vitest perf benchmarks, or k6 p99 latency checks at a staging URL.
- Wire every fitness function into CI alongside unit tests; a fitness function not in CI is documentation, not enforcement.
- When an NFR is defined, immediately draft its fitness function in the same ADR — "NFR accepted" ≠ "NFR measured."

### Security-by-design
- STRIDE-lite at design time: for each component, identify who controls each input (Spoofing), what data can be manipulated (Tampering), what actions can be denied (DoS), what can be observed (Info Disclosure), what authorization boundaries exist (Elevation).
- Trust boundaries first: draw where data crosses from untrusted to trusted (user input → server, server → DB, server → external API). Every crossing is a validation point.
- Principle of least privilege: each component gets access to exactly what it needs. Challenge any design where a module can read or write data it doesn't logically own.
`;
