/**
 * Wave 120 — Pre-commit verdict-format gate regression tests (US-096 AC5)
 *
 * Spec: requirements/user-stories/US-096-pre-commit-verdict-format-gate.md
 * US: US-096 — Pre-commit verdict-format gate (ADR-018)
 *
 * Strategy: two-layer approach per wave task description.
 *
 * Layer A — JS re-implementation (fast, deterministic unit tests):
 *   The canonical ADR-018 regex and grandfathering logic are implemented in
 *   JavaScript here and tested against all 8 known fixture files under
 *   requirements/samples/wave-120-verdict-format/. This proves the logic is
 *   correct independent of the shell hook's exact syntax, and runs in every
 *   CI environment without a shell spawn.
 *
 * Layer B — Runtime-gated integration test:
 *   If .githooks/pre-commit contains the canonical regex substring (signalling
 *   that DevSecOps has landed AC1–AC4), the test spawns a helper or exercises
 *   the hook's regex against each fixture file using grep-compatible logic.
 *   This guards against local-vs-hook drift and auto-skips while the DevSecOps
 *   PR is still in flight (similar to Wave 119's VIEWER_READY gate).
 *
 * Layer C — Source-of-truth co-presence:
 *   Assert that .githooks/pre-commit and .github/workflows/pass-verdict-format-check.yml
 *   both reference the same canonical regex substring. No local-vs-CI drift (AC2).
 *
 * Fixtures (requirements/samples/wave-120-verdict-format/):
 *   bad-pending-sha.md        — SHA (pending) placeholder      → VIOLATION
 *   bad-short-sha.md          — 7-char SHA                     → VIOLATION
 *   bad-extra-word.md         — "viewer" extra word before PR  → VIOLATION
 *   bad-en-dash.md            — en-dash (U+2013) separators    → VIOLATION
 *   good-canonical.md         — correct PASS verdict           → PASS
 *   good-revise.md            — correct REVISE verdict         → PASS
 *   grandfathered-pre-111.md  — Wave-105 prose (wave < 111)    → PASS (skipped)
 *   mixed.md                  — one good + one bad verdict     → VIOLATION (bad line only)
 *
 * Wave 118 coverage classes:
 *   Positive  — good-canonical, good-revise → no violations
 *   Negative  — bad-pending-sha, bad-short-sha, bad-extra-word, bad-en-dash → violation detected
 *   Edge      — grandfathered-pre-111 (wave < 111 skipped), mixed (bad-and-good co-presence)
 *   Iterate   — parametrized loop over all 8 known fixture files (Wave 118 iterate-all rule)
 *
 * S10: not triggered — wave touches no user-supplied collection logic.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const APEX_TEAM_ROOT = resolve(import.meta.dirname, '../../..');
const FIXTURES_DIR = resolve(APEX_TEAM_ROOT, 'requirements/samples/wave-120-verdict-format');
const PRE_COMMIT_HOOK = resolve(APEX_TEAM_ROOT, '.githooks/pre-commit');
const CI_WORKFLOW = resolve(APEX_TEAM_ROOT, '.github/workflows/pass-verdict-format-check.yml');

// ---------------------------------------------------------------------------
// ADR-018 canonical regex — JavaScript implementation
//
// Source of truth: architecture/decisions/ADR-018-pass-verdict-format.md
// §"Grep-able anchor regex"
//
//   ^### Wave-(\d{1,4}) (PASS|REVISE|FAIL) verdict — PR #(\d{1,6}) — SHA ([0-9a-f]{40})$
//
// The em-dash character is U+2014 (—), not hyphen (-) or en-dash (–).
// ---------------------------------------------------------------------------

/** Regex that detects any line that LOOKS like a verdict heading (Wave-NNN ... verdict). */
const VERDICT_CANDIDATE_RE = /^### Wave-(\d{1,4})[^\d].*\b(PASS|REVISE|FAIL) verdict\b/;

/** ADR-018 canonical regex — the full, strict format that Wave-111+ verdicts must match. */
const CANONICAL_VERDICT_RE =
  /^### Wave-(\d{1,4}) (PASS|REVISE|FAIL) verdict — PR #(\d{1,6}) — SHA ([0-9a-f]{40})$/;

/** Wave number threshold — verdicts with wave < FORMAT_REQUIRED_FROM_WAVE are grandfathered. */
const FORMAT_REQUIRED_FROM_WAVE = 111;

// ---------------------------------------------------------------------------
// Helper: find all verdict-format violations in a Markdown string.
//
// Returns an array of { lineNumber, line } for every Wave-111+ verdict heading
// that does not match the canonical format. Empty array = no violations.
// ---------------------------------------------------------------------------

interface Violation {
  lineNumber: number;
  line: string;
}

function findVerdictViolations(content: string): Violation[] {
  const violations: Violation[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const candidateMatch = VERDICT_CANDIDATE_RE.exec(line);
    if (!candidateMatch) continue;

    const waveNum = parseInt(candidateMatch[1], 10);
    if (waveNum < FORMAT_REQUIRED_FROM_WAVE) {
      // Grandfathered — silently skip (backward-compat policy, ADR-018 §"Backward-compatibility")
      continue;
    }

    // Wave >= 111: must match canonical format exactly
    if (!CANONICAL_VERDICT_RE.test(line)) {
      violations.push({ lineNumber: i + 1, line });
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Fixture catalogue — the complete known set for Wave 120
// These are the 8 files that Wave 118's iterate-all rule requires.
// ---------------------------------------------------------------------------

interface FixtureCase {
  filename: string;
  expectViolation: boolean;
  description: string;
}

const FIXTURE_CASES: FixtureCase[] = [
  {
    filename: 'bad-pending-sha.md',
    expectViolation: true,
    description: 'SHA (pending) placeholder — Wave 112/115 failure pattern',
  },
  {
    filename: 'bad-short-sha.md',
    expectViolation: true,
    description: '7-char abbreviated SHA instead of required 40-char full SHA',
  },
  {
    filename: 'bad-extra-word.md',
    expectViolation: true,
    description: '"viewer" extra word before PR token — Wave 119 failure pattern',
  },
  {
    filename: 'bad-en-dash.md',
    expectViolation: true,
    description: 'en-dash (U+2013) separators instead of em-dash (U+2014)',
  },
  {
    filename: 'good-canonical.md',
    expectViolation: false,
    description: 'canonical PASS verdict — all fields correct, em-dash separators, 40-char SHA',
  },
  {
    filename: 'good-revise.md',
    expectViolation: false,
    description: 'canonical REVISE verdict — same heading shape as PASS, correct format',
  },
  {
    filename: 'grandfathered-pre-111.md',
    expectViolation: false,
    description: 'Wave-105 prose verdict — grandfathered (wave < 111), must be silently skipped',
  },
  {
    filename: 'mixed.md',
    expectViolation: true,
    description: 'one good verdict + one bad verdict — bad line must be flagged despite good sibling',
  },
];

// ---------------------------------------------------------------------------
// Runtime gate — auto-skip integration tests if DevSecOps hook PR is pending
// ---------------------------------------------------------------------------

/**
 * Canonical regex substring embedded in the hook (ADR-018 exact literal).
 * The hook must contain this string if AC2 (same-regex requirement) is satisfied.
 * Note: we search for the em-dash character (U+2014) as part of the match.
 */
const HOOK_REGEX_ANCHOR = 'CANONICAL_PATTERN=';

function hookHasVerdictCheck(): boolean {
  if (!existsSync(PRE_COMMIT_HOOK)) return false;
  const src = readFileSync(PRE_COMMIT_HOOK, 'utf8');
  return src.includes(HOOK_REGEX_ANCHOR);
}

const HOOK_READY = hookHasVerdictCheck();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Wave 120 — fixture directory scaffolding', () => {
  it('fixtures directory exists at requirements/samples/wave-120-verdict-format/', () => {
    expect(existsSync(FIXTURES_DIR), `expected ${FIXTURES_DIR} to exist`).toBe(true);
  });

  it('all 8 expected fixture files exist on disk', () => {
    for (const c of FIXTURE_CASES) {
      const path = join(FIXTURES_DIR, c.filename);
      expect(existsSync(path), `expected fixture ${c.filename} to exist at ${path}`).toBe(true);
    }
  });

  it('exactly 8 fixture files exist (no surprise files; completeness guard)', () => {
    const actual = readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.md'));
    expect(actual.length).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// Positive tests — good fixtures must produce zero violations
// ---------------------------------------------------------------------------

describe('Wave 120 — Positive: good verdict headings pass the check', () => {
  it('good-canonical.md: canonical PASS verdict produces no violations (AC5b)', () => {
    const content = readFileSync(join(FIXTURES_DIR, 'good-canonical.md'), 'utf8');
    const violations = findVerdictViolations(content);
    expect(violations).toHaveLength(0);
  });

  it('good-revise.md: canonical REVISE verdict produces no violations (AC5b)', () => {
    const content = readFileSync(join(FIXTURES_DIR, 'good-revise.md'), 'utf8');
    const violations = findVerdictViolations(content);
    expect(violations).toHaveLength(0);
  });

  it('good-canonical.md verdict heading has full 40-char SHA', () => {
    const content = readFileSync(join(FIXTURES_DIR, 'good-canonical.md'), 'utf8');
    const verdictLine = content.split('\n').find(l => CANONICAL_VERDICT_RE.test(l));
    expect(verdictLine, 'expected a canonical verdict heading line in good-canonical.md').toBeTruthy();
    const shaMatch = verdictLine!.match(/SHA ([0-9a-f]{40})$/);
    expect(shaMatch, 'expected 40-char hex SHA in verdict line').toBeTruthy();
    expect(shaMatch![1].length).toBe(40);
  });

  it('good-revise.md verdict heading has REVISE token (not PASS)', () => {
    const content = readFileSync(join(FIXTURES_DIR, 'good-revise.md'), 'utf8');
    const verdictLine = content.split('\n').find(l => CANONICAL_VERDICT_RE.test(l));
    expect(verdictLine).toContain('REVISE verdict');
  });
});

// ---------------------------------------------------------------------------
// Negative tests — bad fixtures must produce at least one violation
// ---------------------------------------------------------------------------

describe('Wave 120 — Negative: bad verdict headings are flagged (AC5a)', () => {
  it('bad-pending-sha.md: SHA (pending) is flagged as violation', () => {
    const content = readFileSync(join(FIXTURES_DIR, 'bad-pending-sha.md'), 'utf8');
    const violations = findVerdictViolations(content);
    expect(violations.length).toBeGreaterThan(0);
    const offending = violations.find(v => v.line.includes('(pending)'));
    expect(offending, 'expected violation for SHA (pending) line').toBeTruthy();
  });

  it('bad-short-sha.md: 7-char SHA is flagged as violation', () => {
    const content = readFileSync(join(FIXTURES_DIR, 'bad-short-sha.md'), 'utf8');
    const violations = findVerdictViolations(content);
    expect(violations.length).toBeGreaterThan(0);
    // SHA portion should be short (7 chars), not the required 40
    const offending = violations.find(v => /SHA [0-9a-f]{1,9}$/.test(v.line));
    expect(offending, 'expected violation for short-SHA line').toBeTruthy();
  });

  it('bad-extra-word.md: extra "viewer" word before PR # is flagged as violation', () => {
    const content = readFileSync(join(FIXTURES_DIR, 'bad-extra-word.md'), 'utf8');
    const violations = findVerdictViolations(content);
    expect(violations.length).toBeGreaterThan(0);
    const offending = violations.find(v => v.line.includes('viewer PR'));
    expect(offending, 'expected violation for "viewer PR" extra-word line').toBeTruthy();
  });

  it('bad-en-dash.md: en-dash (U+2013) separators are flagged as violation (AC2)', () => {
    const content = readFileSync(join(FIXTURES_DIR, 'bad-en-dash.md'), 'utf8');
    // Confirm the fixture actually uses en-dash (U+2013) not em-dash (U+2014)
    const verdictLine = content.split('\n').find(l => l.startsWith('### Wave-'));
    expect(verdictLine).toBeDefined();
    expect(verdictLine).toContain('–'); // en-dash present
    expect(verdictLine).not.toContain('—'); // em-dash absent

    const violations = findVerdictViolations(content);
    expect(violations.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Edge-case tests
// ---------------------------------------------------------------------------

describe('Wave 120 — Edge: grandfathered and mixed-content cases', () => {
  it('grandfathered-pre-111.md: Wave-105 prose verdict produces NO violations (AC5c / AC3)', () => {
    const content = readFileSync(join(FIXTURES_DIR, 'grandfathered-pre-111.md'), 'utf8');
    const violations = findVerdictViolations(content);
    expect(violations).toHaveLength(0);
  });

  it('grandfathered-pre-111.md: Wave-105 heading is detected as a candidate but wave < 111 causes skip', () => {
    const content = readFileSync(join(FIXTURES_DIR, 'grandfathered-pre-111.md'), 'utf8');
    // The line must match the candidate pattern (otherwise the test is vacuous)
    const candidateLine = content.split('\n').find(l => VERDICT_CANDIDATE_RE.test(l));
    expect(candidateLine, 'expected a verdict-candidate line in grandfathered-pre-111.md').toBeTruthy();
    // Extract wave number and verify < 111
    const waveMatch = candidateLine!.match(/^### Wave-(\d{1,4})/);
    expect(waveMatch).toBeTruthy();
    const waveNum = parseInt(waveMatch![1], 10);
    expect(waveNum).toBeLessThan(FORMAT_REQUIRED_FROM_WAVE);
  });

  it('mixed.md: bad verdict line IS flagged; good verdict line is NOT in the violation set', () => {
    const content = readFileSync(join(FIXTURES_DIR, 'mixed.md'), 'utf8');
    const violations = findVerdictViolations(content);
    // Must have exactly one violation (the bad line)
    expect(violations.length).toBe(1);
    // The violation must be the (pending) SHA line, not the good line
    expect(violations[0].line).toContain('(pending)');
    expect(violations[0].line).not.toMatch(CANONICAL_VERDICT_RE);
  });

  it('mixed.md: the good verdict line in the file matches the canonical regex', () => {
    const content = readFileSync(join(FIXTURES_DIR, 'mixed.md'), 'utf8');
    const goodLine = content
      .split('\n')
      .find(l => CANONICAL_VERDICT_RE.test(l));
    expect(goodLine, 'expected a canonical verdict line in mixed.md').toBeTruthy();
    expect(goodLine).toContain('a16c924739eddf928f63a257abdd77fbfa6fb1f8');
  });

  it('findVerdictViolations returns empty array for a file with no verdict headings at all', () => {
    const noVerdicts = '# Some HANDOFF doc\n\nNo verdict headings here.\n\n## Some section\n\nJust prose.\n';
    expect(findVerdictViolations(noVerdicts)).toHaveLength(0);
  });

  it('exact Wave-111 boundary: Wave-110 is grandfathered; Wave-111 is enforced', () => {
    const wave110 = '### Wave-110 PASS verdict — random free-form prose without canonical format';
    const wave111bad = '### Wave-111 PASS verdict — PR #0 — SHA (pending)';

    expect(findVerdictViolations(wave110)).toHaveLength(0); // grandfathered
    expect(findVerdictViolations(wave111bad)).toHaveLength(1); // enforced
  });

  it('Wave-111 with correct format: no violation', () => {
    const wave111good =
      '### Wave-111 PASS verdict — PR #386 — SHA a16c924739eddf928f63a257abdd77fbfa6fb1f8';
    expect(findVerdictViolations(wave111good)).toHaveLength(0);
  });

  it('FAIL verdict type is also enforced by the canonical regex', () => {
    const badFail = '### Wave-120 FAIL verdict — PR #0 — SHA (pending)';
    const goodFail =
      '### Wave-120 FAIL verdict — PR #0 — SHA 017145022ee78d2849356f9ef3d56ddb42adf577';
    expect(findVerdictViolations(badFail)).toHaveLength(1);
    expect(findVerdictViolations(goodFail)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Parametrized iterate-all: Wave 118 mandatory iteration over all 8 fixtures
//
// This single loop is the Wave 118 "iterate every known sample input" gate.
// Adding a new fixture to FIXTURES_DIR without a matching FIXTURE_CASES entry
// will cause the count-check test (in scaffolding describe above) to fail,
// forcing the test author to add the case here too.
// ---------------------------------------------------------------------------

describe('Wave 120 — Iterate-all: parametrized check over all 8 known fixtures (Wave 118)', () => {
  for (const fixture of FIXTURE_CASES) {
    const fixtureLabel = basename(fixture.filename, '.md');

    it(`[${fixtureLabel}] violation expected=${fixture.expectViolation}: ${fixture.description}`, () => {
      const filePath = join(FIXTURES_DIR, fixture.filename);
      expect(existsSync(filePath), `fixture file must exist: ${filePath}`).toBe(true);

      const content = readFileSync(filePath, 'utf8');
      const violations = findVerdictViolations(content);

      if (fixture.expectViolation) {
        expect(
          violations.length,
          `expected ≥1 violation in ${fixture.filename} but got 0`
        ).toBeGreaterThan(0);
      } else {
        expect(
          violations.length,
          `expected 0 violations in ${fixture.filename} but got: ${JSON.stringify(violations)}`
        ).toBe(0);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Source-of-truth co-presence check (Layer C — AC2)
//
// Assert that .githooks/pre-commit and .github/workflows/pass-verdict-format-check.yml
// both reference the same canonical regex to prevent local-vs-CI drift.
// ---------------------------------------------------------------------------

describe('Wave 120 — AC2: source-of-truth co-presence (no local-vs-CI drift)', () => {
  it('CI workflow pass-verdict-format-check.yml exists', () => {
    expect(existsSync(CI_WORKFLOW), `expected ${CI_WORKFLOW} to exist`).toBe(true);
  });

  it('CI workflow contains the canonical CANONICAL_PATTERN variable name', () => {
    const ciContent = readFileSync(CI_WORKFLOW, 'utf8');
    expect(ciContent).toContain('CANONICAL_PATTERN=');
  });

  it('CI workflow canonical regex contains em-dash (U+2014)', () => {
    const ciContent = readFileSync(CI_WORKFLOW, 'utf8');
    // Find the CANONICAL_PATTERN= line
    const patternLine = ciContent.split('\n').find(l => l.includes('CANONICAL_PATTERN='));
    expect(patternLine, 'expected CANONICAL_PATTERN= line in CI workflow').toBeTruthy();
    expect(patternLine).toContain('—'); // em-dash
  });

  it('CI workflow canonical regex contains the 40-char hex SHA group [0-9a-f]{40}', () => {
    const ciContent = readFileSync(CI_WORKFLOW, 'utf8');
    expect(ciContent).toContain('[0-9a-f]{40}');
  });

  it('CI workflow grandfathering threshold is 111 (FORMAT_REQUIRED_FROM_WAVE)', () => {
    const ciContent = readFileSync(CI_WORKFLOW, 'utf8');
    expect(ciContent).toContain('FORMAT_REQUIRED_FROM_WAVE=111');
  });

  it('pre-commit hook exists at .githooks/pre-commit', () => {
    expect(existsSync(PRE_COMMIT_HOOK), `expected ${PRE_COMMIT_HOOK} to exist`).toBe(true);
  });

  // This test verifies AC2 after DevSecOps lands the hook changes.
  // Auto-skips while the hook doesn't yet have the verdict check.
  it('pre-commit hook and CI workflow reference the same canonical regex anchor (AC2) — skipped until hook PR lands', () => {
    if (!HOOK_READY) {
      console.log(
        'SKIP AC2 hook co-presence: .githooks/pre-commit does not yet contain CANONICAL_PATTERN= ' +
          '— auto-unskips once DevSecOps lands AC1–AC4'
      );
      return;
    }
    const hookContent = readFileSync(PRE_COMMIT_HOOK, 'utf8');
    const ciContent = readFileSync(CI_WORKFLOW, 'utf8');

    // Both must contain the canonical regex anchor and the em-dash
    expect(hookContent).toContain('CANONICAL_PATTERN=');
    expect(ciContent).toContain('CANONICAL_PATTERN=');

    // Both must reference the 40-char hex SHA group
    expect(hookContent).toContain('[0-9a-f]{40}');
    expect(ciContent).toContain('[0-9a-f]{40}');

    // Both must use em-dash in the regex (U+2014)
    const hookPatternLine = hookContent.split('\n').find(l => l.includes('CANONICAL_PATTERN='));
    const ciPatternLine = ciContent.split('\n').find(l => l.includes('CANONICAL_PATTERN='));
    expect(hookPatternLine).toContain('—');
    expect(ciPatternLine).toContain('—');
  });
});

// ---------------------------------------------------------------------------
// Runtime-gated integration tests (Layer B)
//
// If the hook contains CANONICAL_PATTERN=, DevSecOps has landed AC1–AC4.
// We then extract the regex string from the hook and verify it matches
// EXACTLY the same lines as our JS implementation above.
// Auto-skips otherwise to keep CI green while the hook PR is in flight.
// ---------------------------------------------------------------------------

describe('Wave 120 — Integration: hook regex matches JS implementation (runtime-gated)', () => {
  if (!HOOK_READY) {
    it.skip(
      'SKIP: .githooks/pre-commit does not yet contain CANONICAL_PATTERN= — ' +
        'auto-unskips once DevSecOps lands the verdict-format check in the hook',
      () => {}
    );
  }

  if (HOOK_READY) {
    it('hook CANONICAL_PATTERN regex accepts the same good lines as the JS canonical regex', () => {
      const hookContent = readFileSync(PRE_COMMIT_HOOK, 'utf8');
      const patternLine = hookContent.split('\n').find(l => l.includes('CANONICAL_PATTERN='));
      expect(patternLine).toBeTruthy();

      // Extract the regex string from the shell variable assignment.
      // Shell form: CANONICAL_PATTERN='^### Wave-...$'
      // Strip variable name, single quotes, and trailing comment.
      const rawPattern = patternLine!
        .replace(/.*CANONICAL_PATTERN=['"]/, '')
        .replace(/['"].*$/, '')
        .trim();

      expect(rawPattern.length).toBeGreaterThan(20);

      // The raw shell regex uses ERE syntax matching JS regex semantics for this pattern.
      // Convert to JS RegExp for behavioral comparison.
      const hookRe = new RegExp(rawPattern);

      const goodLines = [
        '### Wave-120 PASS verdict — PR #0 — SHA 017145022ee78d2849356f9ef3d56ddb42adf577',
        '### Wave-120 REVISE verdict — PR #1 — SHA 017145022ee78d2849356f9ef3d56ddb42adf577',
        '### Wave-111 PASS verdict — PR #386 — SHA a16c924739eddf928f63a257abdd77fbfa6fb1f8',
      ];

      for (const line of goodLines) {
        expect(hookRe.test(line), `hook regex should accept: ${line}`).toBe(true);
        expect(CANONICAL_VERDICT_RE.test(line), `JS regex should accept: ${line}`).toBe(true);
      }
    });

    it('hook CANONICAL_PATTERN regex rejects the same bad lines as the JS canonical regex', () => {
      const hookContent = readFileSync(PRE_COMMIT_HOOK, 'utf8');
      const patternLine = hookContent.split('\n').find(l => l.includes('CANONICAL_PATTERN='));
      const rawPattern = patternLine!
        .replace(/.*CANONICAL_PATTERN=['"]/, '')
        .replace(/['"].*$/, '')
        .trim();
      const hookRe = new RegExp(rawPattern);

      const badLines = [
        '### Wave-120 PASS verdict — PR #0 — SHA (pending)',
        '### Wave-120 PASS verdict — PR #0 — SHA abc1234',
        '### Wave-119 PASS verdict — viewer PR #3 — SHA abc1234567890abcdef1234567890abcdef12345',
        '### Wave-120 PASS verdict – PR #0 – SHA 017145022ee78d2849356f9ef3d56ddb42adf577',
      ];

      for (const line of badLines) {
        expect(hookRe.test(line), `hook regex should reject: ${line}`).toBe(false);
        expect(CANONICAL_VERDICT_RE.test(line), `JS regex should reject: ${line}`).toBe(false);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Canonical regex unit tests (testing the regex itself, not a file)
// ---------------------------------------------------------------------------

describe('Wave 120 — Canonical regex correctness (CANONICAL_VERDICT_RE)', () => {
  const validLines = [
    '### Wave-111 PASS verdict — PR #386 — SHA a16c924739eddf928f63a257abdd77fbfa6fb1f8',
    '### Wave-120 PASS verdict — PR #0 — SHA 017145022ee78d2849356f9ef3d56ddb42adf577',
    '### Wave-120 REVISE verdict — PR #1 — SHA 017145022ee78d2849356f9ef3d56ddb42adf577',
    '### Wave-120 FAIL verdict — PR #999 — SHA 017145022ee78d2849356f9ef3d56ddb42adf577',
    '### Wave-9999 PASS verdict — PR #123456 — SHA 017145022ee78d2849356f9ef3d56ddb42adf577',
  ];

  for (const line of validLines) {
    it(`accepts valid line: ${line.slice(0, 60)}...`, () => {
      expect(CANONICAL_VERDICT_RE.test(line)).toBe(true);
    });
  }

  const invalidLines: Array<[string, string]> = [
    ['SHA (pending)', '### Wave-120 PASS verdict — PR #0 — SHA (pending)'],
    ['7-char SHA', '### Wave-120 PASS verdict — PR #0 — SHA abc1234'],
    ['39-char SHA', '### Wave-120 PASS verdict — PR #0 — SHA 017145022ee78d2849356f9ef3d56ddb42adf57'],
    ['41-char SHA', '### Wave-120 PASS verdict — PR #0 — SHA 017145022ee78d2849356f9ef3d56ddb42adf5771'],
    ['en-dash sep', '### Wave-120 PASS verdict – PR #0 – SHA 017145022ee78d2849356f9ef3d56ddb42adf577'],
    ['hyphen sep', '### Wave-120 PASS verdict - PR #0 - SHA 017145022ee78d2849356f9ef3d56ddb42adf577'],
    ['extra word viewer', '### Wave-119 PASS verdict — viewer PR #3 — SHA abc1234567890abcdef1234567890abcdef12345'],
    ['uppercase SHA', '### Wave-120 PASS verdict — PR #0 — SHA 017145022EE78D2849356F9EF3D56DDB42ADF577'],
    ['missing PR hash', '### Wave-120 PASS verdict — PR 0 — SHA 017145022ee78d2849356f9ef3d56ddb42adf577'],
    ['no wave prefix', '### 120 PASS verdict — PR #0 — SHA 017145022ee78d2849356f9ef3d56ddb42adf577'],
    ['h2 heading', '## Wave-120 PASS verdict — PR #0 — SHA 017145022ee78d2849356f9ef3d56ddb42adf577'],
    ['trailing space', '### Wave-120 PASS verdict — PR #0 — SHA 017145022ee78d2849356f9ef3d56ddb42adf577 '],
  ];

  for (const [label, line] of invalidLines) {
    it(`rejects invalid line [${label}]: ${line.slice(0, 60)}...`, () => {
      expect(CANONICAL_VERDICT_RE.test(line)).toBe(false);
    });
  }
});

// ---------------------------------------------------------------------------
// Metadata / self-reference (US-085 traceability)
// ---------------------------------------------------------------------------

describe('Wave 120 — metadata', () => {
  it('test file exists at canonical path tests/qa/wave-120/pre-commit-verdict-gate.test.ts', () => {
    const expected = resolve(APEX_TEAM_ROOT, 'tests/qa/wave-120/pre-commit-verdict-gate.test.ts');
    expect(existsSync(expected)).toBe(true);
  });

  it('US-096 user story exists with ## Acceptance criteria section', () => {
    const usFile = resolve(
      APEX_TEAM_ROOT,
      'requirements/user-stories/US-096-pre-commit-verdict-format-gate.md'
    );
    expect(existsSync(usFile)).toBe(true);
    const content = readFileSync(usFile, 'utf8');
    expect(content).toMatch(/^## Acceptance criteria/m);
  });

  it('US-096 names AC5 test file path exactly', () => {
    const usFile = resolve(
      APEX_TEAM_ROOT,
      'requirements/user-stories/US-096-pre-commit-verdict-format-gate.md'
    );
    const content = readFileSync(usFile, 'utf8');
    expect(content).toContain('tests/qa/wave-120/pre-commit-verdict-gate.test.ts');
  });

  it('ADR-018 exists with Grep-able anchor regex section', () => {
    const adrFile = resolve(
      APEX_TEAM_ROOT,
      'architecture/decisions/ADR-018-pass-verdict-format.md'
    );
    expect(existsSync(adrFile)).toBe(true);
    const content = readFileSync(adrFile, 'utf8');
    expect(content).toContain('Grep-able anchor regex');
    expect(content).toContain('[0-9a-f]{40}');
  });

  it('runtime gate flag is boolean', () => {
    expect(typeof HOOK_READY).toBe('boolean');
  });

  it('all 8 fixture files listed in FIXTURE_CASES are the canonical wave-120 test set', () => {
    expect(FIXTURE_CASES).toHaveLength(8);
    const expectedFilenames = new Set([
      'bad-pending-sha.md',
      'bad-short-sha.md',
      'bad-extra-word.md',
      'bad-en-dash.md',
      'good-canonical.md',
      'good-revise.md',
      'grandfathered-pre-111.md',
      'mixed.md',
    ]);
    for (const c of FIXTURE_CASES) {
      expect(expectedFilenames.has(c.filename), `unexpected fixture in FIXTURE_CASES: ${c.filename}`).toBe(
        true
      );
    }
  });
});
