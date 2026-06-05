// ticket: TEST-0001
// parent_feat: FEAT-0001
// parent_us: US-098
// role: qa
// status: done

/**
 * Wave 122 -- FEAT-XXXX feature grouping convention regression test (US-098 AC13)
 *
 * Spec: requirements/user-stories/US-098-feat-grouping-convention.md AC13
 * FEAT: requirements/features/FEAT-0001-feat-grouping-convention.md
 * Canonical anchor (verbatim, em-dash U+2014):
 *   "### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)"
 *
 * This is the FIRST test file landing under the Wave 122 convention itself --
 * dogfooding proof: path follows tests/qa/features/FEAT-NNNN-<slug>/TEST-NNNN-<slug>.test.ts.
 *
 * Assertions (5 AC13 conditions + Wave 118 negative + edge):
 *
 *  Block 1 (AC13 condition 1) -- Anchor heading present in all 8 bodies:
 *    Each of the 8 .claude/agents/*.md body files contains
 *    "### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)" EXACTLY once.
 *    One test() per body (8 tests total).
 *
 *  Block 2 (AC13 condition 2) -- Role-specific prefix in each body's section:
 *    Extract the section between the anchor and the next ## or ### heading.
 *    Grep for the role's required prefix. One test() per body (8 tests total):
 *      architect.md     -> ARCH-XXXX
 *      business-analyst.md -> FEAT-XXXX (BA IS the FEAT parent; also present in other bodies
 *                            as it's part of convention docs, but BA section is role-specific)
 *      qa.md            -> TEST-XXXX
 *      ui-developer.md  -> FE-XXXX
 *      backend-developer.md -> BE-XXXX
 *      ux-designer.md   -> UX-XXXX
 *      devsecops.md     -> OPS-XXXX
 *      product-owner.md -> "N/A for Product Owner"
 *
 *  Block 3 (AC13 condition 3) -- FEAT-0001 file exists with feat: FEAT-0001 frontmatter.
 *
 *  Block 4 (AC13 condition 4) -- requirements/features/INDEX.md contains
 *    canonical column headers "| FEAT | Slug | Status | ARCH | UX | TEST | FE | BE | OPS |".
 *
 *  Block 5 (Wave 118 comprehensive-coverage -- negative):
 *    The anchor heading "### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)"
 *    should NOT appear as a literal ### heading in architecture/workspace-conventions.md
 *    (that file has the ## FEAT-XXXX feature grouping section, not the subagent-body heading).
 *
 *  Block 6 (Wave 118 comprehensive-coverage -- edge):
 *    Em-dash char-code check: the em-dash character in the anchor phrase is U+2014,
 *    NOT a hyphen (U+002D) or en-dash (U+2013). Verified in at least two body files.
 *
 *  Block 7 -- Self-reference + US-098 metadata (US-085 discipline).
 *
 * Model: tests/qa/wave-117/wave-117-completeness.test.ts (spawn-and-grep pattern).
 * Dependencies: node:fs, node:path only -- no imports from src/ (retired).
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(__dirname, "../../../..");
const AGENTS_DIR = join(REPO_ROOT, ".claude/agents");

/**
 * The canonical anchor phrase -- verbatim, including em-dash U+2014 at position 50.
 * This is the grep target that Wave 122 requires to be byte-for-byte identical in all 8 bodies.
 */
const ANCHOR_HEADING =
  "### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)";

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

type Role = (typeof ALL_ROLES)[number];

/**
 * Role-specific prefix that MUST appear within each body's FEAT section.
 * For product-owner, the required string is the explicit N/A declaration.
 * For all other roles, it is the role-specific ticket prefix.
 *
 * Note: FEAT-XXXX appears in virtually every body because the convention uses
 * FEAT-XXXX naming throughout. The test uses the MORE-SPECIFIC prefix (e.g.,
 * TEST-XXXX for QA) to confirm per-role specialization rather than copy-paste.
 * For BA, FEAT-XXXX IS the role-specific prefix (BA is the FEAT parent).
 */
const ROLE_PREFIX: Record<Role, string> = {
  "architect": "ARCH-XXXX",
  "business-analyst": "FEAT-XXXX",
  "qa": "TEST-XXXX",
  "ui-developer": "FE-XXXX",
  "backend-developer": "BE-XXXX",
  "ux-designer": "UX-XXXX",
  "devsecops": "OPS-XXXX",
  "product-owner": "N/A for Product Owner",
};

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
 * Count non-overlapping occurrences of needle in haystack.
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
 * Extract the content of a named section (the anchor heading line + body up to
 * the next ## or ### heading, or EOF).
 * Including the heading line ensures tokens embedded in the heading (like
 * "Wave 122" and "MANDATORY") are always present in the returned section text.
 */
function extractSection(content: string, sectionAnchor: string): string {
  const lines = content.split("\n");
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (
      (lines[i].startsWith("### ") || lines[i].startsWith("## ")) &&
      lines[i].includes(sectionAnchor)
    ) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) return "";

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
// Block 1 (AC13 condition 1): Anchor heading EXACTLY ONCE in all 8 bodies
// ---------------------------------------------------------------------------

describe("AC13 condition 1 -- anchor heading present exactly once in all 8 subagent bodies", () => {
  for (const role of ALL_ROLES) {
    const filePath = agentPath(role);

    it(`${role}.md exists`, () => {
      expect(
        existsSync(filePath),
        `${role}.md not found at ${filePath}`
      ).toBe(true);
    });

    it(`${role}.md contains anchor heading EXACTLY once`, () => {
      const content = readContent(filePath);
      const count = countOccurrences(content, ANCHOR_HEADING);
      expect(
        count,
        `${role}.md must contain the FEAT-XXXX anchor heading exactly once.\n` +
          `Heading: "${ANCHOR_HEADING}"\n` +
          `Found: ${count} time(s).\n` +
          `Wave 122 — Architect added this heading byte-for-byte to all 8 subagent bodies.`
      ).toBe(1);
    });
  }
});

// ---------------------------------------------------------------------------
// Block 2 (AC13 condition 2): Role-specific prefix in each body's FEAT section
// ---------------------------------------------------------------------------

describe("AC13 condition 2 -- role-specific ticket prefix present in each body's FEAT section", () => {
  /**
   * Extract using a partial anchor match to tolerate minor heading suffix variants.
   * The section heading starts with "### FEAT-XXXX feature grouping standard (Wave 122"
   * so we search with a substring that uniquely identifies it.
   */
  const SECTION_SEARCH = "FEAT-XXXX feature grouping standard (Wave 122";

  for (const role of ALL_ROLES) {
    const filePath = agentPath(role);
    const expectedPrefix = ROLE_PREFIX[role];

    it(`${role}.md FEAT section contains role-specific prefix: "${expectedPrefix}"`, () => {
      const content = readContent(filePath);

      // Confirm the anchor section exists first
      const section = extractSection(content, SECTION_SEARCH);
      expect(
        section.length,
        `${role}.md: Could not extract FEAT-XXXX section body.\n` +
          `Searched for section containing: "${SECTION_SEARCH}".\n` +
          `This means the anchor heading is absent or the section extractor is broken.`
      ).toBeGreaterThan(0);

      // Confirm the role-specific prefix appears in the section
      expect(
        section,
        `${role}.md FEAT section must contain its role-specific prefix: "${expectedPrefix}"\n` +
          `Wave 122 AC12 -- per-role specialization; not a generic copy-paste template.\n` +
          `Extracted section (first 500 chars):\n${section.slice(0, 500)}`
      ).toContain(expectedPrefix);
    });
  }
});

// ---------------------------------------------------------------------------
// Block 3 (AC13 condition 3): FEAT-0001 file exists with feat: FEAT-0001 frontmatter
// ---------------------------------------------------------------------------

describe("AC13 condition 3 -- requirements/features/FEAT-0001 file exists with correct frontmatter", () => {
  const feat0001Path = join(
    REPO_ROOT,
    "requirements/features/FEAT-0001-feat-grouping-convention.md"
  );

  it("requirements/features/FEAT-0001-feat-grouping-convention.md exists", () => {
    expect(
      existsSync(feat0001Path),
      `FEAT-0001 file not found at ${feat0001Path}.\n` +
        `BA must create the FEAT-0001 seed file as part of US-098 wave.`
    ).toBe(true);
  });

  it('requirements/features/FEAT-0001-feat-grouping-convention.md contains frontmatter field "feat: FEAT-0001"', () => {
    const content = readContent(feat0001Path);
    // Frontmatter block is between the first and second --- delimiters
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    expect(
      frontmatterMatch,
      `FEAT-0001 file must have YAML frontmatter (--- ... ---) at the top of the file.\n` +
        `Found start of file:\n${content.slice(0, 200)}`
    ).not.toBeNull();

    const frontmatter = frontmatterMatch![1];
    expect(
      frontmatter,
      `FEAT-0001 frontmatter must contain "feat: FEAT-0001" (AC2 of US-098).\n` +
        `Frontmatter found:\n${frontmatter}`
    ).toContain("feat: FEAT-0001");
  });
});

// ---------------------------------------------------------------------------
// Block 4 (AC13 condition 4): requirements/features/INDEX.md has canonical column headers
// ---------------------------------------------------------------------------

describe("AC13 condition 4 -- requirements/features/INDEX.md contains canonical column headers", () => {
  const indexPath = join(REPO_ROOT, "requirements/features/INDEX.md");

  /**
   * Canonical column header row verbatim (AC4 of US-098).
   * Must contain exactly these 9 columns in this order.
   */
  const CANONICAL_HEADERS = "| FEAT | Slug | Status | ARCH | UX | TEST | FE | BE | OPS |";

  it("requirements/features/INDEX.md exists", () => {
    expect(
      existsSync(indexPath),
      `requirements/features/INDEX.md not found at ${indexPath}.\n` +
        `BA must create the top-level feature registry as part of US-098 wave.`
    ).toBe(true);
  });

  it('requirements/features/INDEX.md contains canonical column headers "| FEAT | Slug | Status | ARCH | UX | TEST | FE | BE | OPS |"', () => {
    const content = readContent(indexPath);
    expect(
      content,
      `requirements/features/INDEX.md must contain the canonical column header row:\n` +
        `"${CANONICAL_HEADERS}"\n` +
        `AC4 of US-098 — this exact shape is required for grep-stability across workspaces.\n` +
        `File start:\n${content.slice(0, 400)}`
    ).toContain(CANONICAL_HEADERS);
  });

  it("requirements/features/INDEX.md contains a FEAT-0001 row", () => {
    const content = readContent(indexPath);
    expect(
      content,
      `requirements/features/INDEX.md must contain a row for FEAT-0001 (the seed feature).\n` +
        `This is the first allocation — BA should have added it in the Wave 122 registry.`
    ).toContain("FEAT-0001");
  });
});

// ---------------------------------------------------------------------------
// Block 5 (Wave 118 negative): Anchor heading ABSENT from workspace-conventions.md
//   as a functional ### Markdown heading (code-fence quoted examples are allowed)
// ---------------------------------------------------------------------------

describe("Wave 118 negative -- anchor heading absent from architecture/workspace-conventions.md as a functional ### heading", () => {
  const convPath = join(REPO_ROOT, "architecture/workspace-conventions.md");

  /**
   * workspace-conventions.md MAY MENTION the anchor phrase INSIDE a code fence
   * (as a quoted example) -- that is expected and correct documentation.
   *
   * What it MUST NOT contain is the anchor as a functional Markdown heading
   * (a line starting with "### " that is NOT inside a backtick code fence).
   *
   * The ## FEAT-XXXX feature grouping section heading uses ## (not ###) and has
   * a different suffix -- that heading passes this check.
   */
  function stripCodeFences(content: string): string {
    // Remove all content inside fenced code blocks (``` ... ```)
    return content.replace(/```[\s\S]*?```/g, "");
  }

  it('architecture/workspace-conventions.md does NOT contain the anchor as a functional ### heading (outside code fences)', () => {
    expect(existsSync(convPath), `workspace-conventions.md not found at ${convPath}`).toBe(true);
    const rawContent = readContent(convPath);
    const contentWithoutFences = stripCodeFences(rawContent);
    const lines = contentWithoutFences.split("\n");
    // Find any line that starts with "### " and contains the anchor text (minus the "### " prefix)
    const anchorText = ANCHOR_HEADING.slice(4); // "FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)"
    const matchingHeadingLines = lines.filter(
      (line) => line.startsWith("### ") && line.includes(anchorText)
    );
    expect(
      matchingHeadingLines.length,
      `architecture/workspace-conventions.md contains the subagent-body anchor as a functional ### heading ` +
        `(outside code fences) -- this heading belongs ONLY in .claude/agents/*.md body files.\n` +
        `Matching lines found outside code fences:\n${matchingHeadingLines.join("\n")}\n` +
        `Note: the anchor inside a fenced code-block example is expected and correct.`
    ).toBe(0);
  });

  it('architecture/workspace-conventions.md contains the correct ## FEAT-XXXX feature grouping section heading', () => {
    const content = readContent(convPath);
    expect(
      content,
      `architecture/workspace-conventions.md must contain "## FEAT-XXXX feature grouping (Wave 122)" ` +
        `(the workspace-conventions top-level section, NOT the subagent-body ### heading).`
    ).toContain("## FEAT-XXXX feature grouping (Wave 122)");
  });
});

// ---------------------------------------------------------------------------
// Block 6 (Wave 118 edge): Em-dash char-code verification (U+2014)
// ---------------------------------------------------------------------------

describe("Wave 118 edge -- em-dash in anchor heading is U+2014, not hyphen or en-dash", () => {
  /**
   * The anchor heading uses U+2014 (em-dash): "Wave 122 — MANDATORY"
   * NOT U+002D (hyphen): "Wave 122 - MANDATORY"
   * NOT U+2013 (en-dash): "Wave 122 – MANDATORY"
   *
   * Verify by examining the char code at the position right after "Wave 122 ".
   * Test two bodies (qa.md + architect.md) to catch if one was accidentally
   * saved with a different dash character.
   */
  const EM_DASH = "—";
  const EN_DASH = "–";
  const HYPHEN = "-";

  const DASH_CONTEXT = "Wave 122 ";

  for (const role of ["qa", "architect"] as const) {
    const filePath = agentPath(role);

    it(`${role}.md -- dash in anchor heading is U+2014 (em-dash), not hyphen or en-dash`, () => {
      const content = readContent(filePath);
      const anchorIdx = content.indexOf(ANCHOR_HEADING);
      expect(
        anchorIdx,
        `${role}.md: anchor heading not found -- cannot check dash char-code`
      ).toBeGreaterThanOrEqual(0);

      // Find "Wave 122 " within the anchor heading, then check the next char
      const contextStart = content.indexOf(DASH_CONTEXT, anchorIdx);
      expect(
        contextStart,
        `${role}.md: could not find "${DASH_CONTEXT}" within the anchor heading area`
      ).toBeGreaterThanOrEqual(0);

      const dashChar = content[contextStart + DASH_CONTEXT.length];
      const dashCodePoint = dashChar.codePointAt(0)!;

      expect(
        dashChar,
        `${role}.md anchor heading uses wrong dash at "Wave 122 [DASH] MANDATORY".\n` +
          `Expected: U+2014 (em-dash '—').\n` +
          `Found: U+${dashCodePoint.toString(16).toUpperCase().padStart(4, "0")} ('${dashChar}').\n` +
          `If U+002D: hyphen (wrong). If U+2013: en-dash (wrong). Must be U+2014.`
      ).toBe(EM_DASH);

      // Belt-and-suspenders: confirm it is NOT hyphen or en-dash
      expect(dashChar).not.toBe(HYPHEN);
      expect(dashChar).not.toBe(EN_DASH);
    });
  }
});

// ---------------------------------------------------------------------------
// Block 7 -- Self-reference + US-098 metadata (US-085 discipline)
// ---------------------------------------------------------------------------

describe("US-085 -- test file is on disk at canonical Wave 122 path + US-098 metadata", () => {
  it("tests/qa/features/FEAT-0001-feat-grouping-convention/TEST-0001-anchor-and-prefixes.test.ts exists", () => {
    const thisFile = join(
      REPO_ROOT,
      "tests/qa/features/FEAT-0001-feat-grouping-convention/TEST-0001-anchor-and-prefixes.test.ts"
    );
    expect(
      existsSync(thisFile),
      "This test file must exist on disk at the canonical Wave 122 path:\n" +
        "tests/qa/features/FEAT-0001-feat-grouping-convention/TEST-0001-anchor-and-prefixes.test.ts\n" +
        "(US-085 discipline -- test code in chat does not count)"
    ).toBe(true);
  });

  it("tests/qa/features/INDEX.md exists (QA allocation log)", () => {
    const qaIndexPath = join(REPO_ROOT, "tests/qa/features/INDEX.md");
    expect(
      existsSync(qaIndexPath),
      `tests/qa/features/INDEX.md not found at ${qaIndexPath}.\n` +
        `QA must maintain an allocation log per AC11 of US-098 (INDEX maintenance rule).`
    ).toBe(true);
  });

  it("requirements/user-stories/US-098-feat-grouping-convention.md exists", () => {
    const usPath = join(
      REPO_ROOT,
      "requirements/user-stories/US-098-feat-grouping-convention.md"
    );
    expect(
      existsSync(usPath),
      `US-098 file not found at ${usPath} -- required spec for Wave 122`
    ).toBe(true);
  });

  it("US-098 contains ## Acceptance criteria section", () => {
    const usPath = join(
      REPO_ROOT,
      "requirements/user-stories/US-098-feat-grouping-convention.md"
    );
    const content = readContent(usPath);
    expect(
      content,
      "US-098 must contain a ## Acceptance criteria section"
    ).toMatch(/^## Acceptance criteria/m);
  });

  it("US-098 AC13 references regression test assertion", () => {
    const usPath = join(
      REPO_ROOT,
      "requirements/user-stories/US-098-feat-grouping-convention.md"
    );
    const content = readContent(usPath);
    // AC13 should mention the test file or the feat-grouping-convention regression test
    expect(
      content,
      "US-098 must contain AC13 (regression test assertion)"
    ).toContain("AC13");
  });
});
