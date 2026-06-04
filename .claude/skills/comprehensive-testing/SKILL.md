---
name: comprehensive-testing
description: Enforce comprehensive test coverage on QA work in ANY project. When QA writes tests for a user story, QA MUST author positive, negative, and edge-case tests AND iterate over every known sample input file in the active workspace's `requirements/samples/` directory (or the project's equivalent inputs directory). Single-representative testing is insufficient — one outlier input format will slip past a single-sample test and break in production. Applies regardless of project — apex-team itself, host workspaces apex-team drives, or any standalone repo whose Claude Code session has the eight role subagents installed.
---

# comprehensive-testing

The invariant this skill enforces:

> **QA MUST author positive, negative, and edge-case tests AND iterate over every known sample input file in the active workspace's requirements/samples/ directory before emitting any PASS verdict.**

This applies to ANY project the eight role subagents drive — apex-team, downstream host workspaces, third-party repos. The eight role subagents are user-scoped (`~/.claude/agents/`) and so is this skill; the discipline travels with them.

## Why this exists

Trigger incident — the LFM Add-PO project shipped a date-fix feature that QA validated against ONE sample file out of NINE sitting in `requirements/samples/2026-05-28-bk-daily-pos/`. Eight files used an ISO-style format (`20260524`); one outlier (`20260525`) used US-slash format (`5/27/2026`). QA picked the first file (the ISO representative), wrote a passing test, emitted PASS. The slash-format variant slipped past, shipped to production, broke on first run, required a hot-fix.

Root cause: single-sample testing. The test exercised the happy path against ONE input. The known-input set held a variant the implementation did not handle. The variant was sitting on disk the entire time.

Existing QA rules (test pyramid, edge-case enumeration, security patterns) covered the THEORY of comprehensive testing. They did not enforce the PRACTICE of "iterate over EVERY file in the known-input directory before PASS." This skill is the enforcement.

## The four mandatory test classes

Whenever QA writes tests for a user story's acceptance criteria, ALL FOUR of the following MUST be present in the test file (or the test suite for the wave) before QA emits any PASS verdict:

### 1. Positive tests — the happy path

The AC passes when given canonical, well-formed inputs. At least one positive test per acceptance criterion in the US.

Examples:
- "Given a valid PO file, the parser extracts the order date" → test that asserts the date is extracted correctly from a known-good input.
- "Given a logged-in user, they can view their profile" → test that asserts the profile page renders for an authenticated session.

### 2. Negative tests — invalid input is rejected

The AC produces an explicit error or rejection when given malformed, null, empty, or wrong-type input. At least one negative test per acceptance criterion that has a non-trivial input surface.

Examples:
- Pass `null` / `undefined` / `""` / `{}` / `[]` to the function under test → expect a clear error, not a silent passthrough.
- Pass a string where a number is expected → expect rejection at the trust boundary.
- Pass a number outside the documented domain (negative count, future timestamp where past expected) → expect rejection.
- For UI work: submit a form with missing required fields → expect validation messages, not server-side crashes.

### 3. Edge-case tests — boundaries

The AC behaves correctly at the boundary conditions of its input domain. The QA `### Edge-case enumeration` section in `qa.md` is the existing checklist; this skill makes it MANDATORY per US, not optional.

Boundary axes to cover:
- **Empty collection** — zero items in the input list.
- **Single item** — one element (off-by-one between zero and many).
- **Maximum size** — at or near the documented upper bound.
- **Off-by-one** — n, n-1, n+1 for any range boundary.
- **Unicode / non-ASCII** — names, addresses, free-text fields with diacritics, CJK, emoji.
- **Timezone / DST boundaries** — dates near midnight, dates around DST transitions, dates in different time zones.
- **Date / time formats** — ISO 8601, US slash, EU slash, locale-dependent text, epoch seconds vs. milliseconds.
- **Whitespace and casing** — leading/trailing spaces, mixed case, locale-sensitive case folding.
- **Numeric precision** — floating-point edge cases (0.1 + 0.2, very large, very small, NaN, Infinity).
- **Concurrent mutation** — race conditions on shared state (where applicable).

Not all axes apply to every AC. Pick the ones the input surface actually exposes.

### 4. Comprehensive coverage of ALL known inputs/files — every sample, every time

For any US whose acceptance criteria depend on parsing, processing, or rendering files from a known input directory, QA MUST:

1. **Enumerate every file under `<workspace>/requirements/samples/**`** (or the project's equivalent sample-input directory — `samples/`, `fixtures/`, `test-data/`, `examples/`, whatever convention the host project uses).
2. **Run the test against EACH file individually.** Single-loop test that iterates the directory and asserts the AC holds for every entry. Do NOT pick a "representative" file; the representative is a lie when one outlier exists.
3. **If a file fails, flag it as a coverage finding** and HANDOFF to the implementing developer with the failing file's path and the unexpected behavior — do not skip the file, do not exclude it from the loop, do not write a "known limitation" comment to the test.
4. **If only ONE sample file exists**, flag the lack of variety as a coverage gap in your PASS verdict notes. File an issue (`label: bug`, body in user-story format) requesting the BA / domain experts surface additional sample inputs covering the format variants that production sees. A single-file sample directory cannot prove "handles all known inputs."

## Decision tree — does this skill fire on the current US?

```
Is QA writing tests for a US? ── No ──> skill does not apply.
                              │
                              Yes
                              │
                              ▼
Does the AC reference parsing/processing/rendering input files,
records, or external data? ── No ──> apply test classes 1-3 (positive +
                              │      negative + edge-case). Test class 4
                              │      (sample-directory iteration) does
                              │      not apply.
                              │
                              Yes
                              ▼
Does the active workspace have a sample-input directory
under `requirements/samples/` (or project equivalent)? 
  ── No ──> apply test classes 1-3 AND file an issue requesting
            the BA / domain expert seed the directory with the
            sample inputs production sees. A PASS without
            sample variety carries a documented coverage gap.
  │
  Yes
  ▼
Does the directory contain ≥ 2 distinct sample files? 
  ── No ──> apply test classes 1-3 AND flag the single-file
            directory as a coverage gap in the PASS verdict.
            File an issue requesting additional samples.
  │
  Yes
  ▼
Apply all four test classes. Write a parameterized / loop test
that iterates EVERY file in the sample directory. Assert the AC
holds for each file. Do not pick a representative.
```

## Walk-through example — the LFM date-fix incident

**US (paraphrased):** "Given a BK daily PO file, the parser extracts the order date and normalizes it to ISO 8601."

**Sample directory (existed at QA dispatch time):** `requirements/samples/2026-05-28-bk-daily-pos/` containing 9 files:
- `20260524-A.pdf`, `20260524-B.pdf`, …, `20260524-H.pdf` — 8 files using ISO-style header dates (`20260524`).
- `20260525-A.pdf` — 1 outlier file using US-slash header date (`5/27/2026`).

**What QA did (incorrect):**

```ts
// tests/qa/wave-NNN/date-extraction.test.ts
import { extractDate } from "@/lib/parsers/bk-po";

test("extracts ISO date from BK PO", async () => {
  const file = await readFixture("20260524-A.pdf");  // ← one representative
  expect(extractDate(file)).toBe("2026-05-24");
});
```

Test passed. PASS verdict emitted. Production blew up on the slash-format file.

**What QA should have done (per this skill):**

```ts
// tests/qa/wave-NNN/date-extraction.test.ts
import { extractDate } from "@/lib/parsers/bk-po";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const SAMPLE_DIR = "requirements/samples/2026-05-28-bk-daily-pos";

describe("BK PO date extraction — coverage over ALL known sample files", () => {
  const files = readdirSync(SAMPLE_DIR);

  // Test class 4: iterate EVERY sample file.
  test.each(files)("extracts a normalized ISO date from %s", async (file) => {
    const content = await readFixture(join(SAMPLE_DIR, file));
    const date = extractDate(content);
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);  // ISO 8601
  });

  // Test class 1: positive — the canonical happy path.
  test("ISO-style header (20260524) → 2026-05-24", async () => {
    const file = await readFixture(join(SAMPLE_DIR, "20260524-A.pdf"));
    expect(extractDate(file)).toBe("2026-05-24");
  });

  // Test class 2: negative — malformed inputs are rejected.
  test("non-PDF input → throws ParseError", () => {
    expect(() => extractDate(Buffer.from("not a pdf"))).toThrow(/ParseError/);
  });

  test("empty buffer → throws ParseError", () => {
    expect(() => extractDate(Buffer.alloc(0))).toThrow(/ParseError/);
  });

  // Test class 3: edge cases — boundary date formats.
  test("US-slash header (5/27/2026) → 2026-05-27", async () => {
    // This is the format the outlier file uses; explicit boundary test.
    const file = await readFixture(join(SAMPLE_DIR, "20260525-A.pdf"));
    expect(extractDate(file)).toBe("2026-05-27");
  });

  test("date crossing DST boundary preserves civil date", async () => {
    // Whatever the project's timezone discipline mandates.
  });
});
```

The `test.each(files)` loop would have caught the slash-format outlier before PASS. The explicit edge-case test for the US-slash format encodes the expected behavior (a contract); the loop is the safety net that catches future variants the team forgets to enumerate.

## What this skill does NOT do

- It does NOT replace QA's existing `### Edge-case enumeration`, `### Test pyramid judgment`, or `### AC-to-test traceability` sections — those remain QA's own checklists. This skill adds a hard-rule on top: the four test classes are MANDATORY per US, not aspirational.
- It does NOT require exhaustive negative-input fuzzing on every AC. The bar is "at least one negative test per AC with a non-trivial input surface." Pure read-only ACs with no input surface (e.g. "the system renders a static About page") may carry positive + edge-case tests only; the negative class still applies if there is any way to break the AC (missing static asset, bad route).
- It does NOT cover NFR test design — perf budgets, security envelopes, observability — those remain Architect's and QA's joint responsibility per the existing `### Security test patterns` and `### Failure-mode coverage` sections.
- It does NOT mandate a specific test framework. Vitest's `test.each`, Jest's parameterized tests, Mocha's loop pattern, Playwright's data-driven tests — pick the host project's framework and use its parameterization primitive.

## Anti-patterns this skill prevents

1. **One-representative-file testing** — QA picks the first file in the sample directory, writes a passing test, emits PASS. The outlier formats sitting next to it never get exercised. This is the exact LFM incident.
2. **"Happy path only" PASS** — QA writes tests covering positive cases, never sends a malformed input through the function under test. Production hits the malformed input on day one.
3. **"Edge cases later" deferral** — QA notes that boundary tests are "nice to have" or "follow-up" and emits PASS anyway. The boundary IS the bug; deferring it ships the bug.
4. **Treating sample files as test inventory** — QA writes one test per sample file by hand instead of looping. The pattern works until someone adds a new sample file and forgets to add a matching test. Loop over the directory; the loop adapts.
5. **Excluding "weird" sample files** — QA spots an outlier in the sample directory, marks it `xtest` or filters it out, and emits PASS on the remainder. The outlier exists because production produced it; excluding it from the test suite is a guaranteed production incident.

## When the active workspace is unconventional

- **No `requirements/samples/` directory.** Test class 4 does not fire by file enumeration. Apply test classes 1-3 and file an issue requesting BA / domain experts seed the directory with representative inputs.
- **Samples live elsewhere (`fixtures/`, `test-data/`, `examples/`, `__fixtures__/`).** Same discipline — iterate the host project's convention. The skill anchors on the IDEA of "iterate every known input," not on a specific path.
- **Samples are dynamic (fetched from an external system at test time).** Snapshot a representative slice into the workspace before the test runs; the test loops the snapshot. A test that fetches live data is not reproducible and not subject to this skill's iteration rule, but the snapshot it depends on IS.
- **Samples are sensitive (PII, secrets).** Stub or redact before commit; the sample directory still holds the structural variants, just with sensitive fields scrubbed. The skill applies to redacted samples; the redaction process is BA + DevSecOps's concern.

## Cross-references

- `.claude/agents/qa.md` §"Comprehensive test coverage (Wave 118 — MANDATORY)" — the hard-rule clause that fires on every QA dispatch.
- `.claude/agents/qa.md` §"Edge-case enumeration" — the pre-existing checklist this skill makes mandatory.
- `.claude/agents/qa.md` §"AC-to-test traceability" — the rule that each AC gets ≥1 test of each applicable class.
- `architecture/workspace-conventions.md` §"Comprehensive testing (Wave 118)" — the durable doc explaining where this skill plugs into the directory contract.
- `.claude/skills/requirements-first/SKILL.md` — the upstream skill that ensures every implementation request has a US to test against in the first place. This skill is the downstream sibling that covers the "what tests" question after BA writes the US.
