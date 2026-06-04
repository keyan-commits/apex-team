/**
 * Wave 117 -- Completeness regression test (US-093 AC1)
 *
 * Spec: requirements/user-stories/US-093-requirements-first-enforcement.md
 * US: US-093 -- Requirements-first enforcement skill + implementer refusal gate
 *
 * Asserts:
 *
 *  Tests 1-4 (Implementer pre-flight anchor -- exactly once per implementer body):
 *    Each of backend-developer.md, ui-developer.md, qa.md, devsecops.md
 *    contains the canonical pre-flight anchor phrase EXACTLY once.
 *    Canonical anchor (verbatim): "Before writing any code, you MUST verify
 *    a US-NNN file exists in the active workspace's requirements/user-stories/ directory."
 *
 *  Tests 5-8 (Pre-flight anchor absent from non-implementer bodies):
 *    business-analyst.md, architect.md, ux-designer.md, product-owner.md
 *    each contain the pre-flight anchor phrase ZERO times.
 *
 *  Tests 9-12 (Co-presence anchors in each implementer's pre-flight section):
 *    Within the "### Requirements-first pre-flight gate (Wave 117 -- MANDATORY)"
 *    section of each of the 4 implementer bodies, these 6 substrings are present:
 *      1. "Wave 117"
 *      2. "MANDATORY"
 *      3. "HALT"
 *      4. "[[HANDOFF: business-analyst]]"
 *      5. "requirements/user-stories/"
 *      6. "[exception:"
 *
 *  Test 13 (BA auto-routing anchor -- exactly once in business-analyst.md):
 *    "When invoked with a raw user requirement, BA writes the US file AND emits
 *    parallel HANDOFF advisory blocks to QA and the implementing developer in the
 *    same response."
 *
 *  Tests 14-20 (BA auto-routing anchor absent from the 7 other bodies):
 *    architect.md, backend-developer.md, devsecops.md, product-owner.md,
 *    qa.md, ui-developer.md, ux-designer.md each contain the BA auto-routing
 *    anchor phrase ZERO times.
 *
 *  Tests 21-26 (Co-presence anchors in BA auto-routing section):
 *    Within the "### Auto-routing on raw user requirements (Wave 117 -- MANDATORY)"
 *    section in business-analyst.md, these 6 substrings are present:
 *      1. "Wave 117"
 *      2. "MANDATORY"
 *      3. "[[HANDOFF: qa]]"
 *      4. At least one of "ui-developer", "backend-developer", "devsecops" (as HANDOFF target)
 *      5. All three US sections: "## Story", "## Acceptance criteria", "## Out of scope"
 *      6. "same response"
 *
 *  Test 27 (Workspace-conventions section):
 *    architecture/workspace-conventions.md contains "## Requirements-first enforcement (Wave 117)"
 *    EXACTLY once.
 *
 *  Test 28 (SKILL.md exists):
 *    .claude/skills/requirements-first/SKILL.md exists.
 *
 *  Test 29 (SKILL.md YAML frontmatter contains name: requirements-first):
 *    .claude/skills/requirements-first/SKILL.md has frontmatter with "name: requirements-first".
 *
 *  Test 30 (Install script contains SKILLS_SRC_DIR):
 *    scripts/install-agents-user-scope.sh contains "SKILLS_SRC_DIR".
 *
 *  Test 31 (Self-reference -- US-085):
 *    This test file exists at its canonical path.
 *
 * Model: tests/qa/wave-112/wave-112-completeness.test.ts (harness shape).
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

// Canonical anchor phrases (verbatim substrings -- per architect.md Wave 117 NOW block)
const IMPLEMENTER_PREFLIGHT_ANCHOR =
  "Before writing any code, you MUST verify a US-NNN file exists in the active workspace's requirements/user-stories/ directory.";

const BA_AUTO_ROUTING_ANCHOR =
  "When invoked with a raw user requirement, BA writes the US file AND emits parallel HANDOFF advisory blocks to QA and the implementing developer in the same response.";

// The 4 implementer roles that MUST carry the pre-flight anchor exactly once.
const IMPLEMENTER_ROLES = [
  "backend-developer",
  "ui-developer",
  "qa",
  "devsecops",
] as const;

// The 4 non-implementer roles that MUST NOT carry the pre-flight anchor.
const NON_IMPLEMENTER_ROLES = [
  "business-analyst",
  "architect",
  "ux-designer",
  "product-owner",
] as const;

// All 8 subagent role ids.
const ALL_ROLES = [
  "architect",
  "business-analyst",
  "backend-developer",
  "devsecops",
  "product-owner",
  "qa",
  "ui-developer",
  "ux-designer",
] as const;

// The 6 co-presence anchors required within each implementer's pre-flight section.
const IMPLEMENTER_COPRESENCE_ANCHORS = [
  "Wave 117",
  "MANDATORY",
  "HALT",
  "[[HANDOFF: business-analyst]]",
  "requirements/user-stories/",
  "[exception:",
] as const;

// The 6 co-presence anchors required within BA's auto-routing section.
const BA_COPRESENCE_ANCHORS = [
  "Wave 117",
  "MANDATORY",
  "[[HANDOFF: qa]]",
  // anchor 4: at least one concrete HANDOFF target role (checked separately below)
  // anchor 5: all three US section headers (checked separately below)
  "same response",
] as const;

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
 * the next `###` or `##` heading, or EOF. Returns empty string if heading not found.
 * Including the heading ensures that heading-embedded tokens like "Wave 117" and
 * "MANDATORY" are always present in the extracted section text.
 *
 * sectionPrefix: the heading text to match (without leading `### `).
 */
function extractSection(content: string, sectionPrefix: string): string {
  const lines = content.split("\n");
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    // Match headings at any level (##, ###, ####) that contain the prefix
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
// Tests 1-4: Pre-flight anchor present EXACTLY ONCE in each implementer body
// ---------------------------------------------------------------------------

describe("AC1b -- implementer pre-flight anchor present exactly once (4 implementer bodies)", () => {
  for (const role of IMPLEMENTER_ROLES) {
    const filePath = agentPath(role);

    it(`${role}.md exists`, () => {
      expect(
        existsSync(filePath),
        `${role}.md not found at ${filePath}`
      ).toBe(true);
    });

    it(`${role}.md contains pre-flight anchor EXACTLY once`, () => {
      const content = readContent(filePath);
      const count = countOccurrences(content, IMPLEMENTER_PREFLIGHT_ANCHOR);
      expect(
        count,
        `${role}.md must contain the pre-flight anchor phrase exactly once.\n` +
          `Anchor: "${IMPLEMENTER_PREFLIGHT_ANCHOR}"\n` +
          `Found: ${count} time(s).`
      ).toBe(1);
    });
  }
});

// ---------------------------------------------------------------------------
// Tests 5-8: Pre-flight anchor ABSENT from 4 non-implementer bodies
// ---------------------------------------------------------------------------

describe("AC1b -- implementer pre-flight anchor absent from non-implementer bodies (4 files)", () => {
  for (const role of NON_IMPLEMENTER_ROLES) {
    const filePath = agentPath(role);

    it(`${role}.md exists`, () => {
      expect(
        existsSync(filePath),
        `${role}.md not found at ${filePath}`
      ).toBe(true);
    });

    it(`${role}.md contains pre-flight anchor ZERO times`, () => {
      const content = readContent(filePath);
      const count = countOccurrences(content, IMPLEMENTER_PREFLIGHT_ANCHOR);
      expect(
        count,
        `${role}.md must NOT contain the implementer pre-flight anchor phrase.\n` +
          `Anchor: "${IMPLEMENTER_PREFLIGHT_ANCHOR}"\n` +
          `Found: ${count} time(s). The pre-flight gate is implementer-only (backend-developer, ui-developer, qa, devsecops).`
      ).toBe(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Tests 9-12: Co-presence anchors within each implementer's pre-flight section
// ---------------------------------------------------------------------------

describe("AC1b -- 6 co-presence anchors within each implementer pre-flight section", () => {
  const SECTION_HEADING = "Requirements-first pre-flight gate (Wave 117";

  for (const role of IMPLEMENTER_ROLES) {
    const filePath = agentPath(role);

    describe(`${role}.md -- pre-flight section co-presence`, () => {
      it(`${role}.md: pre-flight section exists (heading contains "Requirements-first pre-flight gate (Wave 117")`, () => {
        const content = readContent(filePath);
        expect(
          content,
          `${role}.md must contain a "### Requirements-first pre-flight gate (Wave 117 -- MANDATORY)" section heading.`
        ).toContain(SECTION_HEADING);
      });

      for (const anchor of IMPLEMENTER_COPRESENCE_ANCHORS) {
        it(`${role}.md pre-flight section contains co-presence anchor: "${anchor}"`, () => {
          const content = readContent(filePath);
          const section = extractSection(content, SECTION_HEADING);
          expect(
            section.length,
            `${role}.md: Could not extract pre-flight section body for "${SECTION_HEADING}".`
          ).toBeGreaterThan(0);
          expect(
            section,
            `${role}.md pre-flight section must contain co-presence anchor: "${anchor}"\n` +
              `(Wave 117 Architect ratification -- 6 co-presence anchors required within the section body)`
          ).toContain(anchor);
        });
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Test 13: BA auto-routing anchor present EXACTLY ONCE in business-analyst.md
// ---------------------------------------------------------------------------

describe("AC1c -- BA auto-routing anchor present exactly once in business-analyst.md", () => {
  const filePath = agentPath("business-analyst");

  it("business-analyst.md exists", () => {
    expect(existsSync(filePath), `business-analyst.md not found at ${filePath}`).toBe(true);
  });

  it("business-analyst.md contains BA auto-routing anchor EXACTLY once", () => {
    const content = readContent(filePath);
    const count = countOccurrences(content, BA_AUTO_ROUTING_ANCHOR);
    expect(
      count,
      `business-analyst.md must contain the BA auto-routing anchor phrase exactly once.\n` +
        `Anchor: "${BA_AUTO_ROUTING_ANCHOR}"\n` +
        `Found: ${count} time(s).`
    ).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tests 14-20: BA auto-routing anchor ABSENT from 7 other subagent bodies
// ---------------------------------------------------------------------------

describe("AC1c -- BA auto-routing anchor absent from the 7 non-BA subagent bodies", () => {
  const OTHER_ROLES = ALL_ROLES.filter((r) => r !== "business-analyst");

  for (const role of OTHER_ROLES) {
    const filePath = agentPath(role);

    it(`${role}.md contains BA auto-routing anchor ZERO times`, () => {
      const content = readContent(filePath);
      const count = countOccurrences(content, BA_AUTO_ROUTING_ANCHOR);
      expect(
        count,
        `${role}.md must NOT contain the BA auto-routing anchor phrase.\n` +
          `Anchor: "${BA_AUTO_ROUTING_ANCHOR}"\n` +
          `Found: ${count} time(s). The auto-routing clause belongs only in business-analyst.md.`
      ).toBe(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Tests 21-26: Co-presence anchors within BA's auto-routing section
// ---------------------------------------------------------------------------

describe("AC1c -- 6 co-presence anchors within BA auto-routing section", () => {
  const SECTION_HEADING = "Auto-routing on raw user requirements (Wave 117";
  const filePath = agentPath("business-analyst");

  it('business-analyst.md: auto-routing section exists (heading contains "Auto-routing on raw user requirements (Wave 117")', () => {
    const content = readContent(filePath);
    expect(
      content,
      'business-analyst.md must contain a "### Auto-routing on raw user requirements (Wave 117 -- MANDATORY)" section heading.'
    ).toContain(SECTION_HEADING);
  });

  // Anchors 1, 2, 6: Wave 117, MANDATORY, same response
  for (const anchor of BA_COPRESENCE_ANCHORS) {
    it(`BA auto-routing section contains co-presence anchor: "${anchor}"`, () => {
      const content = readContent(filePath);
      const section = extractSection(content, SECTION_HEADING);
      expect(
        section.length,
        `business-analyst.md: Could not extract auto-routing section body for "${SECTION_HEADING}".`
      ).toBeGreaterThan(0);
      expect(
        section,
        `BA auto-routing section must contain co-presence anchor: "${anchor}"\n` +
          `(Wave 117 Architect ratification -- 6 co-presence anchors required within the section body)`
      ).toContain(anchor);
    });
  }

  // Anchor 4: at least one concrete implementer HANDOFF target
  it("BA auto-routing section contains [[HANDOFF: <ui-developer|backend-developer|devsecops>]] (implementer target)", () => {
    const content = readContent(filePath);
    const section = extractSection(content, SECTION_HEADING);
    expect(
      section.length,
      `business-analyst.md: Could not extract auto-routing section body for "${SECTION_HEADING}".`
    ).toBeGreaterThan(0);
    const hasImplementerHandoff =
      section.includes("ui-developer") ||
      section.includes("backend-developer") ||
      section.includes("devsecops");
    expect(
      hasImplementerHandoff,
      'BA auto-routing section must reference at least one implementer role as a HANDOFF target: "ui-developer", "backend-developer", or "devsecops".\n' +
        "(Wave 117 co-presence anchor 4)"
    ).toBe(true);
  });

  // Anchor 5: all three required US section headers
  it("BA auto-routing section contains all three required US section headers (## Story, ## Acceptance criteria, ## Out of scope)", () => {
    const content = readContent(filePath);
    const section = extractSection(content, SECTION_HEADING);
    expect(
      section.length,
      `business-analyst.md: Could not extract auto-routing section body for "${SECTION_HEADING}".`
    ).toBeGreaterThan(0);
    expect(
      section,
      'BA auto-routing section must mention the "## Story" US section header (Wave 117 co-presence anchor 5)'
    ).toContain("## Story");
    expect(
      section,
      'BA auto-routing section must mention the "## Acceptance criteria" US section header (Wave 117 co-presence anchor 5)'
    ).toContain("## Acceptance criteria");
    expect(
      section,
      'BA auto-routing section must mention the "## Out of scope" US section header (Wave 117 co-presence anchor 5)'
    ).toContain("## Out of scope");
  });
});

// ---------------------------------------------------------------------------
// Test 27: Workspace-conventions section header present exactly once
// ---------------------------------------------------------------------------

describe("AC1 -- architecture/workspace-conventions.md requirements-first section", () => {
  const convPath = join(REPO_ROOT, "architecture/workspace-conventions.md");
  const SECTION_HEADER = "## Requirements-first enforcement (Wave 117)";

  it("architecture/workspace-conventions.md exists", () => {
    expect(
      existsSync(convPath),
      `architecture/workspace-conventions.md not found at ${convPath}`
    ).toBe(true);
  });

  it('architecture/workspace-conventions.md contains "## Requirements-first enforcement (Wave 117)" exactly once', () => {
    const content = readContent(convPath);
    const count = countOccurrences(content, SECTION_HEADER);
    expect(
      count,
      `architecture/workspace-conventions.md must contain "${SECTION_HEADER}" exactly once.\n` +
        `Found: ${count} time(s).`
    ).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tests 28-30: Skill file + install script
// ---------------------------------------------------------------------------

describe("AC1a + AC5 -- .claude/skills/requirements-first/SKILL.md exists with frontmatter", () => {
  const skillPath = join(
    REPO_ROOT,
    ".claude/skills/requirements-first/SKILL.md"
  );

  it(".claude/skills/requirements-first/SKILL.md exists", () => {
    expect(
      existsSync(skillPath),
      `.claude/skills/requirements-first/SKILL.md not found at ${skillPath}`
    ).toBe(true);
  });

  it(".claude/skills/requirements-first/SKILL.md YAML frontmatter contains name: requirements-first", () => {
    const content = readContent(skillPath);
    // Frontmatter is between the first and second --- delimiters at the top of the file.
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    expect(
      frontmatterMatch,
      `SKILL.md must have YAML frontmatter (--- ... ---) at the top of the file`
    ).not.toBeNull();
    const frontmatter = frontmatterMatch![1];
    expect(
      frontmatter,
      `SKILL.md YAML frontmatter must contain "name: requirements-first"\n` +
        `Frontmatter found:\n${frontmatter}`
    ).toContain("name: requirements-first");
  });
});

describe("AC5 -- scripts/install-agents-user-scope.sh contains SKILLS_SRC_DIR", () => {
  const scriptPath = join(REPO_ROOT, "scripts/install-agents-user-scope.sh");

  it("scripts/install-agents-user-scope.sh exists", () => {
    expect(
      existsSync(scriptPath),
      `scripts/install-agents-user-scope.sh not found at ${scriptPath}`
    ).toBe(true);
  });

  it("scripts/install-agents-user-scope.sh contains SKILLS_SRC_DIR", () => {
    const content = readContent(scriptPath);
    expect(
      content,
      `scripts/install-agents-user-scope.sh must contain "SKILLS_SRC_DIR" (install-script extended in Wave 117 per AC5 -- skill symlink support)`
    ).toContain("SKILLS_SRC_DIR");
  });
});

// ---------------------------------------------------------------------------
// US-085 -- this test file exists at canonical path (self-reference)
// ---------------------------------------------------------------------------

describe("US-085 -- test file is on disk at canonical path", () => {
  it("tests/qa/wave-117/wave-117-completeness.test.ts exists", () => {
    const thisFile = join(
      REPO_ROOT,
      "tests/qa/wave-117/wave-117-completeness.test.ts"
    );
    expect(
      existsSync(thisFile),
      "This test file must exist on disk at tests/qa/wave-117/wave-117-completeness.test.ts (US-085 discipline)"
    ).toBe(true);
  });

  it("requirements/user-stories/US-093-requirements-first-enforcement.md exists", () => {
    const usPath = join(
      REPO_ROOT,
      "requirements/user-stories/US-093-requirements-first-enforcement.md"
    );
    expect(
      existsSync(usPath),
      `US-093 file not found at ${usPath} -- required spec for this wave`
    ).toBe(true);
  });

  it("US-093 contains ## Acceptance criteria section", () => {
    const usPath = join(
      REPO_ROOT,
      "requirements/user-stories/US-093-requirements-first-enforcement.md"
    );
    const content = readContent(usPath);
    expect(
      content,
      "US-093 must contain a ## Acceptance criteria section"
    ).toMatch(/^## Acceptance criteria/m);
  });
});
