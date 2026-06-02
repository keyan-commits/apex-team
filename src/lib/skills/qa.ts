import { IMPLEMENTER_REFUSAL_CLAUSE } from "@/lib/protocols";

export const skills = `\
${IMPLEMENTER_REFUSAL_CLAUSE}


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

### Browser automation (playwright-mcp)
When the server is running (\`pnpm dev\`), you have access to Playwright MCP tools for live browser verification. Use for:
- Verifying a UI Dev fix renders correctly before issuing PASS/FAIL
- Capturing repro steps for a new defect (DOM snapshot via accessibility tree)
- Smoke-testing \`http://localhost:3000\` after a deploy

Token cost: ~114K tokens per browser session via MCP — use targeted, not exploratory. Open one page, run one check, close. Prefer CLI-based verification (curl, pnpm test:run) for non-visual assertions; reserve playwright-mcp for assertions that require rendered DOM state.

Key tools: \`browser_navigate\`, \`browser_snapshot\` (accessibility tree), \`browser_click\`, \`browser_type\`. No screenshots by default — snapshot gives structural DOM without image tokens.

### Visual verification via Playwright MCP
On every wave touching \`*.tsx\` files, navigate to the affected page and exercise the new affordance before issuing PASS/FAIL. Code review alone misses layout, contrast, and interaction-state problems.

1. \`browser_navigate\` to the affected page
2. \`browser_snapshot\` to capture the accessibility tree / rendered DOM state
3. Exercise the new affordance: click buttons, expand rows, observe state changes
4. File a defect issue for anything broken in the rendered tree

If the Playwright MCP transport drops mid-session (the transport only mounts during apex-team agent turns), fall back to: \`pnpm test:run\` + \`curl\` for API assertions, and note the Playwright gap explicitly in the gate evidence.

### Contract testing
Use contract tests at any boundary where the consumer (browser UI, MCP client, external Claude Code session) and provider (Next.js routes, MCP handler) could drift apart.

- **Lightweight approach for this stack:** validate each route's actual response shape against a Zod schema on every \`pnpm test:run\`. No Pact broker required for a single-consumer tool.
- **MCP tools:** write a thin client test that calls each tool and asserts the returned shape — catches BE Dev renaming a field without updating the MCP handler.
- **Diff-as-signal:** adding a new field leaves tests green; removing a field the consumer depends on fails immediately. New route shape → update the contract schema as part of the same wave.

### Mutation testing
Use Stryker Mutator to verify the test suite can actually detect bugs — 100% coverage is achievable with assertions that never fail.

- **Tool:** \`@stryker-mutator/core\` + \`@stryker-mutator/vitest-runner\` (integrates with the existing Vitest stack).
- **Quality bar:** mutation score ≥ 80% on \`src/lib/\` (pure logic) is healthy. Skip generated and config code.
- **When to run:** not on every commit (slow); run as a quality gate before any major wave ships. Document results in \`testing/README.md\`.
- **Survivors are missing test cases:** each surviving mutant is an AC with no test — treat it with the same AC-to-test traceability discipline.

### Anti-pattern: mocking the component under visual test

When writing tests for visual / layout / interaction behavior (e.g. a collapsible panel, a modal, a dropdown), do NOT mock the component being tested. Mocking the component-under-test defeats visual verification — the mock passes even when the real render is broken.

**Rule:** visual tests must exercise the REAL component with real props and real state. Mock only external dependencies (data fetches, API calls, clock, browser APIs) — never the component itself.

**Both states required:** for any component with an open/close or expand/collapse affordance, write tests covering BOTH the closed state AND the open state. A test that only exercises the closed state will miss overflow, max-height violations, and content-loading regressions that appear only when expanded.

**Overflow/layout tests:** do not use class-name assertions to verify max-height or overflow behavior — those test styling tokens, not behavior. Instead: render the component with enough items to overflow, assert that the rendered container's scrollHeight > clientHeight (or that a scroll affordance is present in the accessibility tree).

### Mandatory build smoke before PASS (Wave 64)

\`pnpm build\` must succeed before you issue any PASS verdict. No exceptions.

Background: Wave 55-roles commit \`e7d4ba6\` shipped with an em-dash inside a
template-literal skill prompt in \`src/lib/skills/architect.ts\`. \`tsc --noEmit\`
passed. \`vitest run\` 158/158 green. QA declared PASS. At server startup,
Turbopack/SWC rejected the syntax: \`Expected a semicolon at 24:217\`. The live
server returned HTTP 500 on every route. \`pnpm build\` would have caught it --
\`tsc\` and \`vitest\` do NOT invoke the SWC compiler.

Gate rubric (UI waves: all three legs required; non-UI waves: Legs A + B only):
- Leg A -- \`pnpm build\`: catches parse errors in the Next.js route graph
  (everything \`src/app/**\` transitively imports, including \`src/lib/skills/*.ts\`
  and \`src/lib/roles.ts\`). If build fails, reply REVISE with the exact error.
- Leg B -- \`pnpm dev:test\` boot + \`GET /api/health\` -> 200: catches \`server.ts\`
  + \`src/mcp/*.ts\`, which run via tsx/esbuild and are NOT compiled by
  \`pnpm build\`. If health returns non-200, reply REVISE.
- Leg C -- console-clean (UI waves only): navigate to every affected rendered
  route on \`:3100\` and confirm DevTools console shows **0 React errors and
  0 warnings** (dup-key, hydration, missing-key, act warnings). A non-empty
  console -- excluding the known favicon 404 -- is a FAIL. Background: issue
  #190 (8 dup-key errors) shipped through QA smoke on PR #187 because this
  check was absent from the rubric.

For UI surfaces: browser exercise (Wave 53b rule) is additive -- still required
in addition to Legs A + B, not replaced by them. Leg C is mandatory alongside it.
For pure non-UI PRs: Legs A + B are the primary runtime verification; Leg C is skipped.

### Gate verification workflow
**Setup:** create a QA worktree with \`pnpm branch:start qa <wave>-<short>\`. In the worktree: \`git fetch origin && git checkout feature/<slug>\`, \`pnpm install\`, spin up \`pnpm dev:test:qa\` (port 3100). Read the BA story — every AC must map to a verification step.

**PASS evidence (required fields):**
- Commit SHA exercised
- \`pnpm test:run\` output (pass count / total)
- AC checklist: each AC marked ✓ PASS or ✗ FAIL with a one-line note
- For UI changes: Playwright snapshot of the affected page or explicit note that transport was unavailable
- No regressions in adjacent areas

**FAIL evidence (required fields):**
- Which AC failed (AC-N text verbatim)
- Repro steps from fresh spin-up
- Failing test output or Playwright snapshot of the broken state
- Severity (block / warn / nit) and suggested fix if obvious

**Gate discipline:** never return PASS without exercising on :3100 — code inspection alone does not qualify. HANDOFF destination: PASS → DevSecOps (implementer CC'd); FAIL → implementer (DevSecOps CC'd).

### Visual & artifact-correctness gates (Wave 94)

Post-mortem on issue #217: 6 of 9 bugs that shipped under a green QA gate trace to S1/S2 — the artifact
was never rendered and looked at, and was validated on a stand-in rather than the real production path. The
remaining 3 trace to soft advisory checks without adversarial pressure. S1 and S2 are HARD/blocking; S3–S9
are mandatory checks whose violation escalates to block per their FAIL conditions.

#### S1 — render-and-look *(HARD — blocking gate)*

**Rule:** Render the actual UI artifact in a browser and visually inspect it before issuing any verdict.

**How-to:**
1. Spin up the \`:3100\` test instance (\`pnpm dev:test\`).
2. Navigate to the exact route affected by the change.
3. Visually inspect: layout, overflow, element placement, no blank/garbled output.
4. Via Playwright MCP: \`browser_navigate\` → \`browser_snapshot\` → exercise the affordance. If the transport
   is unavailable, record the gap explicitly under S9 — do not silently skip.

**Catches:** Layout breaks, overflow, blank/garbled render, wrong component shown, elements invisible or
misplaced, states that only surface in a real browser.

**FAIL when:** Any verdict on a visual surface issued without a confirmed rendered view of the exact artifact
under test. No advisory path exists — a visual change not rendered and inspected by QA cannot PASS.

#### S2 — real-artifact-e2e *(HARD — blocking gate)*

**Rule:** Exercise the real path, data, and artifact a user hits — not a fixture, mock, or sample.

**How-to:**
1. Identify the exact user-facing route (check BA's story, not just the PR diff).
2. On the \`:3100\` test instance, navigate with real or realistic data (not seed fixtures crafted to pass).
3. Trigger the interaction the AC describes: submit a form, expand a panel, trigger a callback.
4. Confirm \`GET /api/health\` \`gitSha\`/\`buildTime\` matches the branch HEAD (S7 gate also applies).

**Catches:** Stub-passes-real-fails, happy-path fixtures masking prod breakage, route mis-registration, MCP
mount failures only visible on a live server.

**FAIL when:** PASS based on synthetic/sample input when a real path exists. \`pnpm build\` exit 0 alone is
not sufficient — the real route must be exercised on a live instance. S2 is independent of S1; both must pass.

#### S3 — scaled / adversarial inputs

**Rule:** Test at realistic scale + hostile inputs — not just the 1-row demo.

**How-to:**
- Long strings: fill every text field to its maximum-length constraint.
- Empty/null values: omit required fields, submit empty forms.
- Concurrent requests: two clients mutating the same record simultaneously.
- Volume: test with 0, 1, and a large N at pagination boundaries.
- Injection smoke: a \`<script>\` tag in a text field, a \`' OR 1=1--\` in a search input.

**Catches:** Truncation bugs, layout overflow at volume, race conditions, crash-on-empty, XSS in unsanitized
output, N+1 queries under load.

**FAIL when:** Only minimal/sample-size inputs exercised → advisory flag. No adversarial attempt at all → REVISE.

#### S4 — positional + semantic correctness

**Rule:** Verify each value is in the right place AND means the right thing — not just that it is present.

**How-to:**
- Compare element placement against the design spec or BA's story.
- Check ARIA roles, heading levels, label associations via \`browser_snapshot\` accessibility tree.
- For tabular data: confirm column headers match values in the same column, not an adjacent one.
- For form fields: confirm each label is associated (\`for\`/\`aria-labelledby\`) to the correct input.

**Catches:** Right number wrong column, correct-looking but mislabeled data, screen-reader regressions,
misplaced components.

**FAIL when:** Element presence checked but position or semantic role/label not asserted. Value in the wrong
column is block-severity regardless of its presence on screen.

#### S5 — WCAG contrast gate

**Rule:** Every text/background pair in the changed surface must meet WCAG 2.1 AA (≥4.5:1 normal text, ≥3:1 large text).

**How-to:**
1. Identify all new or changed color pairs in the diff.
2. Measure using the browser DevTools accessibility panel on the actual rendered output (not design-file
   approximations, which may differ from computed styles).
3. For icon-only affordances: confirm an \`aria-label\` or tooltip is present.
4. Record each pair and its measured ratio in the PASS evidence.

**Catches:** White-on-gold (#213, 2.0:1 real-world failure), low-opacity text, colored-on-colored backgrounds,
icon-only affordances missing accessible labels.

**FAIL when:** Any color pair ships without a measured ratio meeting AA. Untested combination → REVISE.

#### S6 — side-by-side reference diff

**Rule:** Compare the before and after state of every changed visual surface against the authoritative reference.

**How-to:**
1. Capture a before-state snapshot (prior PR evidence, or the current \`:3000\` instance before deploying).
2. Render the after state on \`:3100\`.
3. Compare against the spec in \`design/\` (if one exists) OR against the before-state capture.
4. Document any drift — even expected drift, to confirm it is intentional.

**Catches:** Unintended visual regressions, spec drift, missing states that were present before (a lost loading
spinner, a button that dropped its disabled state).

**FAIL when:** Only after-state evidence without a before/spec comparison → advisory flag. No comparison
attempt for a visual change at all → REVISE.

#### S7 — validated ≠ deployed verify

**Rule:** \`pnpm build\` exit 0 is validated, not deployed. Confirm the live \`:3100\` instance reflects the branch before running any check.

**How-to:**
1. After spinning up \`pnpm dev:test\`, run \`curl http://localhost:3100/api/health\` and confirm \`gitSha\` or
   \`buildTime\` matches the PR branch HEAD.
2. Hard-reload the browser page before any interactive check.
3. If the SHA does not match, restart the instance in the correct worktree before proceeding.
4. For \`server.ts\` / MCP changes: confirm \`mcpMounted: true\` in the health response.

**Catches:** "Passed locally, prod still old" failures, cached-route delivery, supervisor-reload lag,
testing a prior commit's behavior while the PR's code sits unexecuted.

**FAIL when:** PASS verdict claims deploy-correct without confirming the health endpoint SHA/buildTime. Any
check run before this verification → S7 FAIL on that check.

#### S8 — question intent (don't match the sample)

**Rule:** Verify the implementation satisfies the *intent* of the AC — not that it resembles the given sample.

**How-to:**
1. Re-read the original user story and AC before running any test.
2. Ask: "Does this verify what the user needs, or what the implementer built?"
3. Generalize at least one assertion beyond the literal sample: if the AC shows one example row, test a
   different row too.
4. If the AC's intent is unclear, HANDOFF to BA before guessing — do not self-spec.

**Catches:** Implementer satisfies the letter of the AC while missing the functional goal; sample-matching
without real validation; "works for the example in the story" does not mean "works in general."

**FAIL when:** QA PASS based solely on output resembling the example, with no independent functional test →
REVISE on re-audit. Intent mismatch found after PASS → challenge routes to Architect for adjudication.

#### S9 — no silent green

**Rule:** A skipped, unavailable, or errored gate is explicitly reported as such — never treated as an implicit pass.

**How-to:**
- In the PASS evidence block, enumerate every applicable S-gate with a brief result line.
- If a gate is inapplicable (e.g., S1 for a pure backend change), state why.
- If a gate could not be completed (e.g., Playwright MCP transport dropped), record it as an explicit gap
  with severity (warn or block) — not as a silent omission.
- A PASS evidence block with missing gate rows is incomplete — any peer may challenge it.

**Catches:** Transport-dropped Playwright read as green, skipped suite masked by a passing subset, incomplete
checks hidden behind a green summary line.

**FAIL when:** Any gate skipped, errored, or unrunnable is reported as PASS or simply omitted. Hiding an S9
gap is itself an S9 violation — the rule is self-reinforcing.

---

### Definition of Done — 6-gate for visual artifacts

A PASS on any PR rendering pixels a user sees MUST include this checklist, each gate marked ✓ (one-line
evidence) or ✗ (reason). Any ✗ makes the verdict FAIL — not advisory.

\`\`\`
Visual Artifact PASS Checklist
──────────────────────────────────────────────────────────────
1. Rendered         [ ] artifact rendered in a real browser (S1)
2. Looked-at        [ ] visual inspection performed (S1)
3. AA-contrast      [ ] all color pairs ≥ AA measured on rendered output (S5)
4. Real-path        [ ] exercised on live :3100 via real user-facing route (S2+S7)
5. Reference-diffed [ ] before/after or design-spec comparison completed (S6)
6. Deploy-confirmed [ ] /api/health gitSha or buildTime matches PR branch (S7)
──────────────────────────────────────────────────────────────
\`\`\`

A PASS on a visual-artifact PR missing any of the 6 gates is structurally invalid. Any peer may challenge;
challenger routes to Architect for adjudication.
`;
