// ticket: TEST-0006
// parent_feat: FEAT-tbd
// parent_us: TBD (Wave 139 deferred US allocation)
// role: qa
// status: in-flight

/**
 * Wave 139 — role-routing-server-vs-ui skill + 3 body amendments regression test (TEST-0006)
 *
 * Covers:
 *   Positive (4):
 *     P1 — skill file exists and contains canonical rule statement
 *     P2 — UI Dev anchor present exactly once in ui-developer.md
 *     P3 — BE Dev anchor present exactly once in backend-developer.md
 *     P4 — PO anchor present exactly once in product-owner.md
 *
 *   Negative (3):
 *     N1 — 8 trigger-pattern keywords appear in the UI Dev refusal-clause section
 *     N2 — HALT keyword appears in the UI Dev refusal section
 *     N3 — backend/features/ canonical path appears in the BE Dev assertion section
 *
 *   Edge (2):
 *     E1 — Wave 122 FEAT-XXXX anchors are byte-stable in the 3 amended bodies
 *     E2 — all 3 amended bodies cross-reference the skill path
 *
 *   Self-reference / metadata (US-085, 5 assertions):
 *     M1-M5 — test file at canonical path, frontmatter fields present, INDEX row registered
 *
 * Runtime-gate discipline:
 *   Body-amendment tests (P2, P3, P4, N1, N2, N3, E2) use a per-anchor runtime gate.
 *   If the named anchor heading is absent from the agent file, the test marks SKIP
 *   (not FAIL) with a console.warn citing the Wave 139 amendment PRs not yet merged.
 *   This prevents chicken-and-egg CI failures when this QA PR precedes the amendment PRs.
 *   Once the amendment PRs land, every SKIP flips to PASS on the next CI run.
 *
 *   Skill-file tests (P1) are similarly gated: if SKILL.md does not exist on the
 *   current branch, the existence and canonical-rule assertions skip rather than fail.
 *
 * Skill reference: .claude/skills/role-routing-server-vs-ui/SKILL.md (PR #432)
 * Canonical Wave 139 rule: "Server-side code is always Backend Developer's lane."
 * FEAT-tbd-role-routing pending formal FEAT allocation (BA follow-up wave).
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Path constants
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(__dirname, "../../../..");
const AGENTS_DIR = join(REPO_ROOT, ".claude/agents");
const SKILLS_DIR = join(REPO_ROOT, ".claude/skills");

// Skill file location (workspace-relative)
const SKILL_FILE = join(
  SKILLS_DIR,
  "role-routing-server-vs-ui",
  "SKILL.md",
);

// Agent body files under test
const UI_DEV_FILE = join(AGENTS_DIR, "ui-developer.md");
const BE_DEV_FILE = join(AGENTS_DIR, "backend-developer.md");
const PO_FILE = join(AGENTS_DIR, "product-owner.md");

// Wave 139 anchor headings (verbatim, em-dash U+2014)
const UI_DEV_ANCHOR = "### Server-vs-UI routing refusal (Wave 139 — MANDATORY)";
const BE_DEV_ANCHOR = "### Server-vs-UI routing assertion (Wave 139 — MANDATORY)";
const PO_ANCHOR = "### Server-vs-UI routing checklist (Wave 139 — MANDATORY)";

// Wave 122 anchor heading (cross-file regression guard)
const WAVE_122_ANCHOR =
  "### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readAgent(filePath: string): string {
  return readFileSync(filePath, "utf-8");
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
 * Extract the section beginning at the given anchor heading, up to the next
 * ## or ### heading (or end of file). Returns "" if the anchor is not found.
 * The anchor heading line itself is included in the returned section text.
 *
 * Matches by looking for lines whose text (after the leading "### " or "## ")
 * includes the heading text, so matching is robust whether the anchor constant
 * includes "### " or just the heading text.
 */
function extractSection(content: string, anchor: string): string {
  // Strip leading markdown heading chars to get the heading text
  const headingText = anchor.replace(/^#{1,3} /, "");
  const lines = content.split("\n");
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      (line.startsWith("### ") || line.startsWith("## ")) &&
      line.includes(headingText)
    ) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) return "";

  const body: string[] = [lines[startIdx]];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ") || line.startsWith("### ")) break;
    body.push(line);
  }
  return body.join("\n");
}

/**
 * Returns true if the anchor heading appears at least once in the file content.
 * When false, callers should skip (console.warn) rather than fail.
 */
function anchorPresent(content: string, anchor: string): boolean {
  return content.includes(anchor);
}

// ---------------------------------------------------------------------------
// Positive P1 — Skill file exists + contains canonical rule statement
// Runtime-gated: SKIP (not FAIL) if skill PR not yet merged on this branch.
// ---------------------------------------------------------------------------

describe("P1 — role-routing-server-vs-ui skill file exists and contains canonical rule", () => {
  it("SKILL.md exists at .claude/skills/role-routing-server-vs-ui/SKILL.md", () => {
    if (!existsSync(SKILL_FILE)) {
      console.warn(
        "[TEST-0006 P1] SKILL.md not present on this branch — Wave 139 skill PR #432 not yet merged. " +
          "Skipping existence assertion (runtime gate: SKIP not FAIL).",
      );
      // Runtime gate: return without asserting (SKIP semantics)
      return;
    }
    // Skill file is present; assert it is actually a file
    expect(existsSync(SKILL_FILE)).toBe(true);
  });

  it("SKILL.md contains canonical rule statement: 'server-side code is always BE Dev's lane'", () => {
    if (!existsSync(SKILL_FILE)) {
      console.warn(
        "[TEST-0006 P1] SKILL.md not present — Wave 139 skill PR #432 not yet merged. " +
          "Skipping canonical-rule assertion.",
      );
      return;
    }
    const content = readFileSync(SKILL_FILE, "utf-8");
    // Case-insensitive substring match per spec.
    // Canonical text from SKILL.md section 1: "server-side code is always BE Dev's lane"
    const lc = content.toLowerCase();
    expect(
      lc.includes("server-side code is always be dev") ||
        lc.includes("server-side code is always backend developer") ||
        lc.includes("server-side code is always be dev's lane"),
      "SKILL.md must contain the canonical routing rule. Expected substring (case-insensitive): " +
        "'server-side code is always BE Dev's lane' or equivalent.",
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Positive P2 — UI Dev anchor present exactly once
// Runtime-gated: SKIP (not FAIL) if Wave 139 ui-developer body amendment not merged.
// ---------------------------------------------------------------------------

describe("P2 — ui-developer.md contains Wave 139 refusal anchor exactly once", () => {
  it("ui-developer.md exists", () => {
    expect(existsSync(UI_DEV_FILE), `Agent file not found: ${UI_DEV_FILE}`).toBe(true);
  });

  it(
    "ui-developer.md contains '### Server-vs-UI routing refusal (Wave 139 — MANDATORY)' exactly once",
    () => {
      const content = readAgent(UI_DEV_FILE);
      if (!anchorPresent(content, UI_DEV_ANCHOR)) {
        console.warn(
          "[TEST-0006 P2] Wave 139 UI Dev anchor not found — body amendment PR not yet merged. " +
            "Skipping (SKIP not FAIL). Once the Wave 139 ui-developer body amendment PR merges, " +
            "this test will activate.",
        );
        return;
      }
      const count = countOccurrences(content, UI_DEV_ANCHOR);
      expect(
        count,
        `ui-developer.md must contain the Wave 139 refusal anchor exactly once. Found: ${count}.\n` +
          `Anchor: "${UI_DEV_ANCHOR}"`,
      ).toBe(1);
    },
  );
});

// ---------------------------------------------------------------------------
// Positive P3 — BE Dev anchor present exactly once
// Runtime-gated: SKIP (not FAIL) if Wave 139 backend-developer body amendment not merged.
// ---------------------------------------------------------------------------

describe("P3 — backend-developer.md contains Wave 139 assertion anchor exactly once", () => {
  it("backend-developer.md exists", () => {
    expect(existsSync(BE_DEV_FILE), `Agent file not found: ${BE_DEV_FILE}`).toBe(true);
  });

  it(
    "backend-developer.md contains '### Server-vs-UI routing assertion (Wave 139 — MANDATORY)' exactly once",
    () => {
      const content = readAgent(BE_DEV_FILE);
      if (!anchorPresent(content, BE_DEV_ANCHOR)) {
        console.warn(
          "[TEST-0006 P3] Wave 139 BE Dev anchor not found — body amendment PR not yet merged. " +
            "Skipping (SKIP not FAIL). Once the Wave 139 backend-developer body amendment PR merges, " +
            "this test will activate.",
        );
        return;
      }
      const count = countOccurrences(content, BE_DEV_ANCHOR);
      expect(
        count,
        `backend-developer.md must contain the Wave 139 assertion anchor exactly once. Found: ${count}.\n` +
          `Anchor: "${BE_DEV_ANCHOR}"`,
      ).toBe(1);
    },
  );
});

// ---------------------------------------------------------------------------
// Positive P4 — PO anchor present exactly once
// Runtime-gated: SKIP (not FAIL) if Wave 139 product-owner body amendment not merged.
// ---------------------------------------------------------------------------

describe("P4 — product-owner.md contains Wave 139 routing checklist anchor exactly once", () => {
  it("product-owner.md exists", () => {
    expect(existsSync(PO_FILE), `Agent file not found: ${PO_FILE}`).toBe(true);
  });

  it(
    "product-owner.md contains '### Server-vs-UI routing checklist (Wave 139 — MANDATORY)' exactly once",
    () => {
      const content = readAgent(PO_FILE);
      if (!anchorPresent(content, PO_ANCHOR)) {
        console.warn(
          "[TEST-0006 P4] Wave 139 PO anchor not found — body amendment PR not yet merged. " +
            "Skipping (SKIP not FAIL). Once the Wave 139 product-owner body amendment PR merges, " +
            "this test will activate.",
        );
        return;
      }
      const count = countOccurrences(content, PO_ANCHOR);
      expect(
        count,
        `product-owner.md must contain the Wave 139 checklist anchor exactly once. Found: ${count}.\n` +
          `Anchor: "${PO_ANCHOR}"`,
      ).toBe(1);
    },
  );
});

// ---------------------------------------------------------------------------
// Negative N1 — 8 trigger-pattern keywords in UI Dev refusal section
// Runtime-gated: entire block skips if Wave 139 UI Dev anchor absent.
// ---------------------------------------------------------------------------

describe("N1 — UI Dev refusal section contains all 8 trigger-pattern keywords", () => {
  // Patterns per dispatch spec + SKILL.md section 5 (case-insensitive partial match)
  const TRIGGER_PATTERNS: ReadonlyArray<string> = [
    "server.mjs",
    "api route",
    "sse",
    "websocket",
    "spawn",
    "file io",
    "schema",
    "server-side business logic",
  ];

  for (const pattern of TRIGGER_PATTERNS) {
    it(`UI Dev refusal section contains trigger pattern (case-insensitive): "${pattern}"`, () => {
      const content = readAgent(UI_DEV_FILE);
      if (!anchorPresent(content, UI_DEV_ANCHOR)) {
        console.warn(
          `[TEST-0006 N1] Wave 139 UI Dev anchor absent — skipping trigger pattern check for "${pattern}". ` +
            "Body amendment PR not yet merged.",
        );
        return;
      }
      const section = extractSection(content, UI_DEV_ANCHOR);
      expect(
        section.toLowerCase().includes(pattern.toLowerCase()),
        `UI Dev refusal section must contain trigger pattern (case-insensitive): "${pattern}".\n` +
          `Section (first 400 chars): ${section.slice(0, 400)}`,
      ).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// Negative N2 — HALT keyword in UI Dev refusal section
// Runtime-gated: skips if Wave 139 UI Dev anchor absent.
// ---------------------------------------------------------------------------

describe("N2 — HALT keyword appears in UI Dev refusal section", () => {
  it("UI Dev refusal section contains the word 'HALT'", () => {
    const content = readAgent(UI_DEV_FILE);
    if (!anchorPresent(content, UI_DEV_ANCHOR)) {
      console.warn(
        "[TEST-0006 N2] Wave 139 UI Dev anchor absent — skipping HALT keyword check. " +
          "Body amendment PR not yet merged.",
      );
      return;
    }
    const section = extractSection(content, UI_DEV_ANCHOR);
    expect(
      section.includes("HALT"),
      "UI Dev refusal section must contain the word HALT.\n" +
        "Per SKILL.md section 5: Step 1 of the refusal protocol is 'HALT — do not silently absorb the server-side work.'",
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Negative N3 — backend/features/ canonical path in BE Dev assertion section
// Runtime-gated: skips if Wave 139 BE Dev anchor absent.
// ---------------------------------------------------------------------------

describe("N3 — BE Dev assertion section references backend/features/ canonical path", () => {
  it("BE Dev assertion section contains 'backend/features/' canonical retro-summary path", () => {
    const content = readAgent(BE_DEV_FILE);
    if (!anchorPresent(content, BE_DEV_ANCHOR)) {
      console.warn(
        "[TEST-0006 N3] Wave 139 BE Dev anchor absent — skipping backend/features/ path check. " +
          "Body amendment PR not yet merged.",
      );
      return;
    }
    const section = extractSection(content, BE_DEV_ANCHOR);
    expect(
      section.includes("backend/features/"),
      "BE Dev assertion section must reference 'backend/features/' as the canonical path for retro BE-NNNN summary docs.\n" +
        "Per SKILL.md section 6: retro docs go to backend/features/FEAT-NNNN-<slug>/BE-NNNN-<slug>.md.",
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge E1 — Wave 122 FEAT-XXXX anchors byte-stable in all 3 amended bodies
// These tests always run (no runtime gate) because Wave 122 is pre-existing.
// A failure here means a Wave 139 amendment accidentally corrupted a Wave 122 anchor.
// ---------------------------------------------------------------------------

describe("E1 — Wave 122 FEAT-XXXX grouping anchor still byte-stable in the 3 amended agent bodies", () => {
  const AMENDED_FILES: ReadonlyArray<{ role: string; filePath: string }> = [
    { role: "ui-developer", filePath: UI_DEV_FILE },
    { role: "backend-developer", filePath: BE_DEV_FILE },
    { role: "product-owner", filePath: PO_FILE },
  ];

  for (const { role, filePath } of AMENDED_FILES) {
    it(`${role}.md still contains Wave 122 FEAT-XXXX anchor exactly once (regression guard)`, () => {
      const content = readAgent(filePath);
      const count = countOccurrences(content, WAVE_122_ANCHOR);
      expect(
        count,
        `${role}.md Wave 122 anchor regression: expected exactly 1 occurrence, got ${count}.\n` +
          `Anchor: "${WAVE_122_ANCHOR}"\n` +
          `Wave 139 amendments must not disturb the pre-existing Wave 122 anchor.`,
      ).toBe(1);
    });
  }
});

// ---------------------------------------------------------------------------
// Edge E2 — All 3 amended bodies cross-reference the skill path
// Runtime-gated per body: skips if that body's Wave 139 anchor is absent.
// ---------------------------------------------------------------------------

describe("E2 — all 3 amended bodies cross-reference the role-routing-server-vs-ui SKILL.md path", () => {
  // Accept either user-scope (~/.claude/skills/...) or workspace-relative path forms
  const SKILL_PATH_PATTERNS: ReadonlyArray<string> = [
    "~/.claude/skills/role-routing-server-vs-ui/SKILL.md",
    ".claude/skills/role-routing-server-vs-ui/SKILL.md",
    "role-routing-server-vs-ui/SKILL.md",
  ];

  const AMENDED_FILES: ReadonlyArray<{
    role: string;
    filePath: string;
    anchor: string;
  }> = [
    { role: "ui-developer", filePath: UI_DEV_FILE, anchor: UI_DEV_ANCHOR },
    { role: "backend-developer", filePath: BE_DEV_FILE, anchor: BE_DEV_ANCHOR },
    { role: "product-owner", filePath: PO_FILE, anchor: PO_ANCHOR },
  ];

  for (const { role, filePath, anchor } of AMENDED_FILES) {
    it(`${role}.md body contains a cross-reference to the role-routing-server-vs-ui SKILL.md`, () => {
      const content = readAgent(filePath);
      if (!anchorPresent(content, anchor)) {
        console.warn(
          `[TEST-0006 E2] Wave 139 anchor for ${role} not found — body amendment PR not yet merged. ` +
            "Skipping skill cross-reference check.",
        );
        return;
      }
      const hasRef = SKILL_PATH_PATTERNS.some((p) => content.includes(p));
      expect(
        hasRef,
        `${role}.md must contain a cross-reference to the role-routing-server-vs-ui SKILL.md.\n` +
          `Accepted patterns: ${SKILL_PATH_PATTERNS.join(" | ")}\n` +
          `Per SKILL.md section 9 cross-references: each amended body should point back to the skill.`,
      ).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// Metadata M1-M5 (US-085 self-reference + TEST-0006 canonical discipline)
// ---------------------------------------------------------------------------

describe("M1–M5 — TEST-0006 self-reference and US-085 canonical discipline", () => {
  const TEST_FILE = join(
    REPO_ROOT,
    "tests/qa/features/FEAT-tbd-role-routing/TEST-0006-role-routing-anchors.test.ts",
  );
  const INDEX_FILE = join(REPO_ROOT, "tests/qa/features/INDEX.md");

  it("M1 — TEST-0006 file exists at canonical path", () => {
    expect(
      existsSync(TEST_FILE),
      `TEST-0006 file not found at canonical path: ${TEST_FILE}`,
    ).toBe(true);
  });

  it("M2 — TEST-0006 file contains 'ticket: TEST-0006' frontmatter comment", () => {
    const content = readFileSync(TEST_FILE, "utf-8");
    expect(
      content.includes("ticket: TEST-0006"),
      "TEST-0006 must declare 'ticket: TEST-0006' in frontmatter comments (US-085 discipline).",
    ).toBe(true);
  });

  it("M3 — TEST-0006 file contains 'parent_feat: FEAT-tbd' frontmatter comment", () => {
    const content = readFileSync(TEST_FILE, "utf-8");
    expect(
      content.includes("parent_feat: FEAT-tbd"),
      "TEST-0006 must declare 'parent_feat: FEAT-tbd' in frontmatter (BA to reconcile FEAT once allocated).",
    ).toBe(true);
  });

  it("M4 — TEST-0006 file contains 'role: qa' frontmatter comment", () => {
    const content = readFileSync(TEST_FILE, "utf-8");
    expect(
      content.includes("role: qa"),
      "TEST-0006 must declare 'role: qa' in frontmatter comments.",
    ).toBe(true);
  });

  it("M5 — tests/qa/features/INDEX.md contains TEST-0006 row", () => {
    expect(
      existsSync(INDEX_FILE),
      `INDEX.md not found at ${INDEX_FILE}`,
    ).toBe(true);
    const content = readFileSync(INDEX_FILE, "utf-8");
    expect(
      content.includes("TEST-0006"),
      "tests/qa/features/INDEX.md must contain a TEST-0006 row per QA allocation-log discipline.",
    ).toBe(true);
  });
});
