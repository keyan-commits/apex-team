/**
 * Wave 118 -- Completeness regression test (US-094 AC1)
 *
 * Spec: requirements/user-stories/US-094-qa-comprehensive-coverage.md
 * US: US-094 -- QA comprehensive coverage: positive/negative/edge + all known inputs
 *
 * Asserts:
 *
 *  Test 1 (QA hard-rule anchor -- exactly once in qa.md):
 *    qa.md contains the canonical Wave 118 hard-rule anchor phrase EXACTLY once.
 *    Canonical anchor (verbatim):
 *    "QA MUST author positive, negative, and edge-case tests AND iterate over every
 *    known sample input file in the active workspace's requirements/samples/ directory
 *    before emitting any PASS verdict."
 *
 *  Tests 2-8 (QA hard-rule anchor absent from the 7 other subagent bodies -- parametrized):
 *    architect.md, business-analyst.md, backend-developer.md, devsecops.md,
 *    product-owner.md, ui-developer.md, ux-designer.md each contain the hard-rule
 *    anchor phrase ZERO times.
 *
 *  Tests 9-16 (8 co-presence anchors within qa.md's Wave 118 section):
 *    Within the "### Comprehensive test coverage (Wave 118" section of qa.md,
 *    ALL of these 8 substrings are present:
 *      1. "Wave 118"
 *      2. "MANDATORY"
 *      3. "positive"
 *      4. "negative"
 *      5. "edge"
 *      6. "requirements/samples/"
 *      7. "every known sample input"
 *      8. "comprehensive-testing"
 *
 *  Test 17 (Workspace-conventions Wave 118 heading -- exactly once):
 *    architecture/workspace-conventions.md contains
 *    "## Comprehensive testing (Wave 118)" EXACTLY once.
 *
 *  Tests 18-21 (Four test-class names in workspace-conventions Wave 118 section body):
 *    Within the "## Comprehensive testing (Wave 118)" section of workspace-conventions.md,
 *    ALL of these 4 substrings are present:
 *      1. "Positive"
 *      2. "Negative"
 *      3. "Edge"
 *      4. "All known sample inputs"
 *
 *  Test 22 (.claude/skills/comprehensive-testing/SKILL.md exists):
 *    The skill file exists on disk.
 *
 *  Test 23 (SKILL.md YAML frontmatter contains name: comprehensive-testing):
 *    SKILL.md has YAML frontmatter with "name: comprehensive-testing".
 *
 *  Test 24 (SKILL.md body contains the canonical hard-rule anchor phrase verbatim):
 *    The body of SKILL.md contains the canonical anchor phrase verbatim.
 *
 * Model: tests/qa/wave-117/wave-117-completeness.test.ts (harness shape).
 * Dependencies: node:fs, node:path only -- no imports from src/ (retired).
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(__dirname, "../../..");
const AGENTS_DIR = join(REPO_ROOT, ".claude/agents");

// Canonical hard-rule anchor phrase (verbatim -- per architect.md Wave 118 NOW block)
const QA_HARD_RULE_ANCHOR =
  "QA MUST author positive, negative, and edge-case tests AND iterate over every known sample input file in the active workspace's requirements/samples/ directory before emitting any PASS verdict.";

// The 7 non-QA subagent bodies that MUST NOT carry the hard-rule anchor.
const NON_QA_ROLES = [
  "architect",
  "business-analyst",
  "backend-developer",
  "devsecops",
  "product-owner",
  "ui-developer",
  "ux-designer",
] as const;

// Section heading prefix for qa.md's Wave 118 clause (must appear in heading line).
const QA_SECTION_HEADING = "Comprehensive test coverage (Wave 118";

// The 8 co-presence anchors required within qa.md's Wave 118 section.
const QA_COPRESENCE_ANCHORS = [
  "Wave 118",
  "MANDATORY",
  "positive",
  "negative",
  "edge",
  "requirements/samples/",
  "every known sample input",
  "comprehensive-testing",
] as const;

// Workspace-conventions Wave 118 heading (must appear exactly once).
const WORKSPACE_CONV_HEADING = "## Comprehensive testing (Wave 118)";

// Section heading prefix for workspace-conventions.md Wave 118 section extraction.
const WORKSPACE_CONV_SECTION_PREFIX = "Comprehensive testing (Wave 118)";

// The 4 test-class names required in the workspace-conventions Wave 118 section body.
const WORKSPACE_CONV_TEST_CLASS_NAMES = [
  "Positive",
  "Negative",
  "Edge",
  "All known sample inputs",
] as const;

// Skill file path.
const SKILL_PATH = join(
  REPO_ROOT,
  ".claude/skills/comprehensive-testing/SKILL.md"
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readContent(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}

function agentPath(role: string): string {
  return join(AGENTS_DIR, `${role}.md`);
}

/**
 * Count how many (non-overlapping) occurrences of `needle` exist in `haystack`.
 */
function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

/**
 * Extract the content of a named section from a markdown body.
 * Returns the text from the HEADING LINE (inclusive) up to (but not including)
 * the next `###` or `##` heading at the same or higher level, or EOF.
 * Returns empty string if heading not found.
 *
 * Including the heading line ensures that heading-embedded tokens like "Wave 118"
 * and "MANDATORY" are always present in the extracted section text.
 *
 * sectionPrefix: the heading text to match (without leading `### ` or `## `).
 */
function extractSection(content: string, sectionPrefix: string): string {
  const lines = content.split("\n");
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (
      (lines[i].startsWith("### ") || lines[i].startsWith("## ")) &&
      lines[i].includes(sectionPrefix)
    ) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) return "";

  // Collect the heading line itself PLUS all lines until the next ##/### heading
  const body: string[] = [lines[startIdx]];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ") || line.startsWith("### ")) {
      break;
    }
    body.push(line);
  }
  return body.join("\n");
}

// ---------------------------------------------------------------------------
// Test 1: QA hard-rule anchor present EXACTLY ONCE in qa.md
// ---------------------------------------------------------------------------

describe("AC1b -- QA hard-rule anchor present exactly once in qa.md", () => {
  const filePath = agentPath("qa");

  it("qa.md exists", () => {
    expect(existsSync(filePath), `qa.md not found at ${filePath}`).toBe(true);
  });

  it("qa.md contains the Wave 118 hard-rule anchor EXACTLY once", () => {
    const content = readContent(filePath);
    const count = countOccurrences(content, QA_HARD_RULE_ANCHOR);
    expect(
      count,
      `qa.md must contain the Wave 118 hard-rule anchor phrase exactly once.\n` +
        `Anchor: "${QA_HARD_RULE_ANCHOR}"\n` +
        `Found: ${count} time(s).`
    ).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tests 2-8: QA hard-rule anchor ABSENT from 7 other subagent bodies (parametrized)
// ---------------------------------------------------------------------------

describe("AC1b -- QA hard-rule anchor absent from the 7 non-QA subagent bodies", () => {
  for (const role of NON_QA_ROLES) {
    const filePath = agentPath(role);

    it(`${role}.md contains the Wave 118 hard-rule anchor ZERO times`, () => {
      const content = readContent(filePath);
      const count = countOccurrences(content, QA_HARD_RULE_ANCHOR);
      expect(
        count,
        `${role}.md must NOT contain the QA Wave 118 hard-rule anchor phrase.\n` +
          `Anchor: "${QA_HARD_RULE_ANCHOR}"\n` +
          `Found: ${count} time(s). The hard-rule clause belongs only in qa.md.`
      ).toBe(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Tests 9-16: 8 co-presence anchors within qa.md's Wave 118 section
// ---------------------------------------------------------------------------

describe("AC1b/AC1c -- 8 co-presence anchors within qa.md Wave 118 section", () => {
  const filePath = agentPath("qa");

  it(`qa.md: Wave 118 section exists (heading contains "${QA_SECTION_HEADING}")`, () => {
    const content = readContent(filePath);
    expect(
      content,
      `qa.md must contain a "### Comprehensive test coverage (Wave 118 -- MANDATORY)" section heading.`
    ).toContain(QA_SECTION_HEADING);
  });

  for (const anchor of QA_COPRESENCE_ANCHORS) {
    it(`qa.md Wave 118 section contains co-presence anchor: "${anchor}"`, () => {
      const content = readContent(filePath);
      const section = extractSection(content, QA_SECTION_HEADING);
      expect(
        section.length,
        `qa.md: Could not extract Wave 118 section body for "${QA_SECTION_HEADING}". ` +
          `Verify the section heading exists in qa.md.`
      ).toBeGreaterThan(0);
      expect(
        section,
        `qa.md Wave 118 section must contain co-presence anchor: "${anchor}"\n` +
          `(Wave 118 Architect ratification -- 8 co-presence anchors required within the section body)`
      ).toContain(anchor);
    });
  }
});

// ---------------------------------------------------------------------------
// Test 17: Workspace-conventions Wave 118 heading present exactly once
// ---------------------------------------------------------------------------

describe("AC1d -- architecture/workspace-conventions.md Wave 118 section", () => {
  const convPath = join(REPO_ROOT, "architecture/workspace-conventions.md");

  it("architecture/workspace-conventions.md exists", () => {
    expect(
      existsSync(convPath),
      `architecture/workspace-conventions.md not found at ${convPath}`
    ).toBe(true);
  });

  it(`architecture/workspace-conventions.md contains "${WORKSPACE_CONV_HEADING}" exactly once`, () => {
    const content = readContent(convPath);
    const count = countOccurrences(content, WORKSPACE_CONV_HEADING);
    expect(
      count,
      `architecture/workspace-conventions.md must contain "${WORKSPACE_CONV_HEADING}" exactly once.\n` +
        `Found: ${count} time(s).`
    ).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tests 18-21: Four test-class names in workspace-conventions Wave 118 section
// ---------------------------------------------------------------------------

describe("AC1d -- four test-class names present in workspace-conventions Wave 118 section", () => {
  const convPath = join(REPO_ROOT, "architecture/workspace-conventions.md");

  for (const className of WORKSPACE_CONV_TEST_CLASS_NAMES) {
    it(`workspace-conventions Wave 118 section contains test-class name: "${className}"`, () => {
      const content = readContent(convPath);
      const section = extractSection(content, WORKSPACE_CONV_SECTION_PREFIX);
      expect(
        section.length,
        `architecture/workspace-conventions.md: Could not extract Wave 118 section body ` +
          `for "${WORKSPACE_CONV_SECTION_PREFIX}". Verify the section heading exists.`
      ).toBeGreaterThan(0);
      expect(
        section,
        `workspace-conventions.md Wave 118 section must contain test-class name: "${className}"\n` +
          `(Wave 118 -- four mandatory test classes: Positive, Negative, Edge, All known sample inputs)`
      ).toContain(className);
    });
  }
});

// ---------------------------------------------------------------------------
// Tests 22-24: Skill file existence + frontmatter + canonical anchor
// ---------------------------------------------------------------------------

describe("AC2 -- .claude/skills/comprehensive-testing/SKILL.md", () => {
  it(".claude/skills/comprehensive-testing/SKILL.md exists", () => {
    expect(
      existsSync(SKILL_PATH),
      `.claude/skills/comprehensive-testing/SKILL.md not found at ${SKILL_PATH}`
    ).toBe(true);
  });

  it(".claude/skills/comprehensive-testing/SKILL.md YAML frontmatter contains name: comprehensive-testing", () => {
    const content = readContent(SKILL_PATH);
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    expect(
      frontmatterMatch,
      `SKILL.md must have YAML frontmatter (--- ... ---) at the top of the file`
    ).not.toBeNull();
    const frontmatter = frontmatterMatch![1];
    expect(
      frontmatter,
      `SKILL.md YAML frontmatter must contain "name: comprehensive-testing"\n` +
        `Frontmatter found:\n${frontmatter}`
    ).toContain("name: comprehensive-testing");
  });

  it("SKILL.md body contains the canonical Wave 118 hard-rule anchor phrase verbatim", () => {
    const content = readContent(SKILL_PATH);
    const count = countOccurrences(content, QA_HARD_RULE_ANCHOR);
    expect(
      count,
      `SKILL.md must contain the canonical Wave 118 hard-rule anchor phrase verbatim.\n` +
        `Anchor: "${QA_HARD_RULE_ANCHOR}"\n` +
        `Found: ${count} time(s). The skill body must carry the same anchor phrase as qa.md's hard-rule clause.`
    ).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// US-085 -- self-reference + spec existence
// ---------------------------------------------------------------------------

describe("US-085 -- test file on disk at canonical path + US-094 spec exists", () => {
  it("tests/qa/wave-118/wave-118-completeness.test.ts exists", () => {
    const thisFile = join(
      REPO_ROOT,
      "tests/qa/wave-118/wave-118-completeness.test.ts"
    );
    expect(
      existsSync(thisFile),
      "This test file must exist on disk at tests/qa/wave-118/wave-118-completeness.test.ts (US-085 discipline)"
    ).toBe(true);
  });

  it("requirements/user-stories/US-094-qa-comprehensive-coverage.md exists", () => {
    const usPath = join(
      REPO_ROOT,
      "requirements/user-stories/US-094-qa-comprehensive-coverage.md"
    );
    expect(
      existsSync(usPath),
      `US-094 file not found at ${usPath} -- required spec for this wave`
    ).toBe(true);
  });

  it("US-094 contains ## Acceptance criteria section", () => {
    const usPath = join(
      REPO_ROOT,
      "requirements/user-stories/US-094-qa-comprehensive-coverage.md"
    );
    const content = readContent(usPath);
    expect(
      content,
      "US-094 must contain a ## Acceptance criteria section"
    ).toMatch(/^## Acceptance criteria/m);
  });
});
