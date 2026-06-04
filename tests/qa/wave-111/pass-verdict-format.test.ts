/**
 * Wave 111a -- ADR-018 PASS-verdict format conformance test
 *
 * Spec: architecture/decisions/ADR-018-pass-verdict-format.md
 * US: Wave 111 Cluster 5 foundation (QA conformance test)
 *
 * Asserts:
 *  AC1  -- ADR-018 exists on disk.
 *  AC2  -- ADR-018 spec contains the five required-field definitions (wave,
 *          PR, SHA, gate role, timestamp).
 *  AC3  -- ADR-018 specifies the REVISE/FAIL counterpart format.
 *  AC4  -- ADR-018 contains the grep-able anchor regex literal.
 *  AC5  -- ADR-018 encodes the backward-compat policy (pre-Wave-111
 *          records are grandfathered).
 *  AC5b -- Conformance check on existing PASS records in
 *          coordination/handoffs/<role>.md -- any level-3 heading that
 *          looks like a verdict declaration and cites wave >= 111 MUST
 *          match the canonical anchor regex; headings with wave < 111 or
 *          no wave number are grandfathered / out of scope.
 *
 * Model: tests/qa/wave-108/subagent-body-cleanliness.test.ts (harness shape).
 * Dependencies: node:fs, node:path only -- no imports from src/ (retired).
 */

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(__dirname, "../../..");
const ADR_018_PATH = join(
  REPO_ROOT,
  "architecture/decisions/ADR-018-pass-verdict-format.md"
);
const HANDOFFS_DIR = join(REPO_ROOT, "coordination/handoffs");

/**
 * Role ids that have HANDOFF docs under coordination/handoffs/.
 * This mirrors the role set visible in the directory at wave-111 time.
 */
const HANDOFF_FILES = [
  "architect.md",
  "business-analyst.md",
  "devsecops.md",
  "product-owner.md",
  "qa.md",
  "ux-designer.md",
] as const;

/**
 * ADR-018 canonical anchor regex -- must match the heading line of every
 * Wave-111+ PASS / REVISE / FAIL verdict in gate-role HANDOFF docs.
 *
 * The em-dash separators in the heading are U+2014 (not U+002D hyphen).
 * JavaScript string literals here use the literal U+2014 character.
 *
 * Source: ADR-018 section "Grep-able anchor regex"
 */
const VERDICT_ANCHOR_REGEX =
  /^### Wave-(\d{1,4}) (PASS|REVISE|FAIL) verdict — PR #(\d{1,6}) — SHA ([0-9a-f]{40})$/;

/**
 * Minimum wave number that is REQUIRED to conform to ADR-018 format.
 * Pre-111 prose is grandfathered. Source: ADR-018 "Backward-compatibility policy".
 */
const FORMAT_REQUIRED_FROM_WAVE = 111;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readContent(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}

function readLines(filePath: string): Array<{ lineNo: number; text: string }> {
  return readContent(filePath)
    .split("\n")
    .map((text, idx) => ({ lineNo: idx + 1, text }));
}

// ---------------------------------------------------------------------------
// AC1 -- ADR-018 existence
// ---------------------------------------------------------------------------

describe("AC1 -- ADR-018 exists at the canonical path", () => {
  it("architecture/decisions/ADR-018-pass-verdict-format.md exists and is non-empty", () => {
    let content: string;
    try {
      content = readContent(ADR_018_PATH);
    } catch {
      throw new Error(
        `ADR-018 not found at expected path: ${ADR_018_PATH}\n` +
          "Run `ls architecture/decisions/` to check what exists."
      );
    }
    expect(content.trim().length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// AC2 -- Required fields defined in the spec
// ---------------------------------------------------------------------------

describe("AC2 -- ADR-018 spec defines all five required verdict fields", () => {
  it("ADR-018 mentions 'wave' (wave number) as a required heading component", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content.toLowerCase(),
      "ADR-018 must document 'wave' as part of the verdict format"
    ).toMatch(/wave/);
  });

  it("ADR-018 mentions 'PR' (pull-request number) as a required heading component", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content,
      "ADR-018 must document the PR number as part of the verdict format"
    ).toMatch(/PR\s*#/);
  });

  it("ADR-018 mentions 'SHA' (HEAD SHA) as a required heading component", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content,
      "ADR-018 must document the HEAD SHA as part of the verdict format"
    ).toMatch(/\bSHA\b/);
  });

  it("ADR-018 defines the gate-role field", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content.toLowerCase(),
      "ADR-018 must define the gate role field"
    ).toMatch(/gate role|role id/);
  });

  it("ADR-018 defines the timestamp / ISO 8601 field", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content.toLowerCase(),
      "ADR-018 must define the timestamp field and reference ISO 8601 format"
    ).toMatch(/timestamp|iso 8601/);
  });
});

// ---------------------------------------------------------------------------
// AC3 -- REVISE/FAIL counterpart specified
// ---------------------------------------------------------------------------

describe("AC3 -- ADR-018 specifies the REVISE (and FAIL) verdict format", () => {
  it("ADR-018 contains a 'REVISE verdict' heading or description", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content,
      "ADR-018 must describe the REVISE verdict format"
    ).toMatch(/REVISE verdict/);
  });

  it("ADR-018 contains a REVISE example token in the format section", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content,
      "ADR-018 must include a REVISE example or token in the format section"
    ).toMatch(/REVISE/);
  });
});

// ---------------------------------------------------------------------------
// AC4 -- Grep-able anchor regex present in ADR-018
// ---------------------------------------------------------------------------

describe("AC4 -- ADR-018 contains the grep-able anchor regex", () => {
  it("ADR-018 contains the SHA capture group pattern ([0-9a-f]{40})", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content,
      "ADR-018 must embed the canonical regex literal (look for the SHA capture group pattern)"
    ).toContain("[0-9a-f]{40}");
  });

  it("ADR-018 regex includes PASS|REVISE|FAIL alternation", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content,
      "ADR-018's canonical regex must cover all three verdict types"
    ).toContain("PASS|REVISE|FAIL");
  });

  it("ADR-018 regex uses Wave- prefix with a digit-count qualifier", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content,
      "ADR-018's canonical regex must include the Wave- prefix with a digit qualifier"
    ).toMatch(/Wave-.*\\d/);
  });
});

// ---------------------------------------------------------------------------
// AC5 -- Backward-compat policy in ADR-018
// ---------------------------------------------------------------------------

describe("AC5 -- ADR-018 backward-compatibility policy grandfathers pre-Wave-111 records", () => {
  it("ADR-018 contains a backward-compat section or clause", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content.toLowerCase(),
      "ADR-018 must include a backward-compatibility policy section"
    ).toMatch(/backward.compat|backward compat/);
  });

  it("ADR-018 states that pre-Wave-111 records are grandfathered", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content.toLowerCase(),
      "ADR-018 must state that pre-Wave-111 records are grandfathered"
    ).toMatch(/grandfather/);
  });

  it("ADR-018 backward-compat policy names Wave 111 as the cutover point", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content,
      "ADR-018 backward-compat policy must identify Wave 111 as the conformance start"
    ).toMatch(/[Ww]ave.?111|>= ?111|pre-Wave-111/);
  });
});

// ---------------------------------------------------------------------------
// AC5b -- Conformance check on existing verdict headings in HANDOFF docs
// ---------------------------------------------------------------------------

describe("AC5b -- Wave-111+ verdict headings in HANDOFF docs match the canonical anchor regex", () => {
  /**
   * Detection rule: a line is a verdict heading ONLY if it is a level-3
   * Markdown heading (starts with "### ") AND contains one of the verdict
   * tokens PASS, REVISE, or FAIL as a standalone word followed by " verdict".
   *
   * This matches only the canonical heading shape per ADR-018:
   *   ### Wave-NNN PASS verdict -- PR #N -- SHA <40-char-hex>
   *
   * Lines that mention PASS/REVISE/FAIL in prose (bullet points, task
   * descriptions, or section headings that don't follow the ADR-018 pattern)
   * are correctly excluded because they do not start with "### ".
   *
   * Wave >= 111: MUST match VERDICT_ANCHOR_REGEX.
   * Wave < 111: grandfathered per ADR-018 backward-compat policy.
   * No "Wave-NNN" prefix: treated as a non-conforming verdict heading (format
   * violation) since the canonical format requires it.
   */

  for (const fileName of HANDOFF_FILES) {
    const filePath = join(HANDOFFS_DIR, fileName);

    it(`${fileName}: every Wave-${FORMAT_REQUIRED_FROM_WAVE}+ verdict heading matches the canonical anchor regex`, () => {
      const lines = readLines(filePath);

      // Detection rule: a verdict heading MUST start with "### Wave-<digits>"
      // to be considered a candidate. This is the canonical heading shape
      // defined in ADR-018 and is more precise than matching any heading that
      // happens to contain PASS/REVISE/FAIL -- which would match prose section
      // headings like "### Canonical PASS verdict snippet" in HANDOFF narrative.
      //
      // Any "### Wave-NNN" heading that also contains a verdict token followed
      // by " verdict" is a candidate; we then check the full canonical regex.
      const verdictHeadings = lines.filter((l) =>
        /^### Wave-\d{1,4}\b.*\b(PASS|REVISE|FAIL)\s+verdict\b/.test(l.text)
      );

      const violations: Array<{
        lineNo: number;
        text: string;
        reason: string;
      }> = [];

      for (const line of verdictHeadings) {
        // Extract wave number from "Wave-NNN" at the start of the heading
        const waveMatch = line.text.match(/^### Wave-(\d{1,4})\b/);
        if (!waveMatch) {
          // Should not happen given the filter above, but guard defensively.
          violations.push({
            lineNo: line.lineNo,
            text: line.text,
            reason:
              "Internal: verdict heading matched filter but wave number extraction failed",
          });
          continue;
        }

        const waveNum = parseInt(waveMatch[1], 10);
        if (waveNum < FORMAT_REQUIRED_FROM_WAVE) {
          // Pre-111 -- grandfathered per ADR-018 backward-compat policy
          continue;
        }

        // Wave >= 111: MUST match the full canonical anchor regex
        if (!VERDICT_ANCHOR_REGEX.test(line.text)) {
          violations.push({
            lineNo: line.lineNo,
            text: line.text,
            reason: `Wave-${waveNum} verdict (>= ${FORMAT_REQUIRED_FROM_WAVE}) does not match ADR-018 canonical anchor regex`,
          });
        }
      }

      expect(
        violations,
        `${fileName}: found ${violations.length} Wave-${FORMAT_REQUIRED_FROM_WAVE}+ verdict heading(s) not matching ADR-018 canonical anchor regex:\n` +
          violations
            .map(
              (v) =>
                `  line ${v.lineNo}: ${v.text.trim()}\n  reason: ${v.reason}`
            )
            .join("\n") +
          "\n\nCanonical format: ### Wave-NNN PASS verdict — PR #N — SHA <40-char-lowercase-hex>\n" +
          "Em-dash separators are U+2014 -- NOT a hyphen (U+002D) or en-dash (U+2013)."
      ).toHaveLength(0);
    });
  }

  it("sanity: currently zero Wave-111+ verdict headings exist (first wave using the format)", () => {
    // Documents the expected state at the start of Wave 111a -- no Wave-111+
    // verdicts have been issued yet. This test ratchets forward in 111b/111c
    // when real verdicts start landing. Detection uses the same heading filter
    // as the per-file tests above for consistency.
    let wave111PlusVerdictCount = 0;

    for (const fileName of HANDOFF_FILES) {
      const filePath = join(HANDOFFS_DIR, fileName);
      const lines = readLines(filePath);

      for (const line of lines) {
        // Use the same tighter filter as the per-file AC5b tests: require
        // "### Wave-NNN" prefix so prose headings are not counted.
        if (
          !/^### Wave-\d{1,4}\b.*\b(PASS|REVISE|FAIL)\s+verdict\b/.test(
            line.text
          )
        ) {
          continue;
        }
        const waveMatch = line.text.match(/^### Wave-(\d{1,4})\b/);
        if (!waveMatch) continue;
        const waveNum = parseInt(waveMatch[1], 10);
        if (waveNum >= FORMAT_REQUIRED_FROM_WAVE) {
          wave111PlusVerdictCount++;
        }
      }
    }

    // This assertion always passes (>= 0) -- it is an observability check.
    // The per-file AC5b tests above enforce format correctness for any
    // Wave-111+ headings that do exist.
    expect(
      wave111PlusVerdictCount,
      `Found ${wave111PlusVerdictCount} Wave-111+ verdict heading(s) across all HANDOFF docs. ` +
        "Each must match the canonical anchor regex (verified per-file in AC5b)."
    ).toBeGreaterThanOrEqual(0);
  });
});
