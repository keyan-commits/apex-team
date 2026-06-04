/**
 * Wave 110 — Subagent body completeness regression test
 *
 * The PRESENCE counterpart to Wave 108's subagent-body-cleanliness.test.ts
 * (which asserts ABSENCE of retired patterns).
 *
 * This suite asserts that mandatory governance clauses landed in Waves 109
 * and 110-A are PRESENT in the relevant .claude/agents/*.md files.
 *
 * Clauses under test:
 *
 * Wave 109 — architecture/ co-authorship gate
 *   AC-1: architect.md code-review rubric step 4 contains the co-authorship
 *         gate clause (non-Architect modifications to architecture/ require
 *         prior HANDOFF).
 *   AC-2: The 6 implementer bodies (business-analyst, ui-developer,
 *         backend-developer, qa, devsecops, ux-designer) each contain the
 *         "You do NOT write to `architecture/`" boundary clause.
 *
 * Wave 109 — pre-verdict SHA sync
 *   AC-3: architect.md step 0 of "Code review responsibility" contains the
 *         pre-verdict SHA sync clause.
 *   AC-4: ux-designer.md critique-workflow section contains the pre-verdict
 *         SHA sync clause.
 *
 * Wave 110-A — DevSecOps merge protocol
 *   AC-5: devsecops.md "Deployment workflow" step 3 contains:
 *         (a) "Verify gate-role PASS is recorded in HANDOFF" step-title substring
 *         (b) "do NOT merge on the implementer's claim of PASS alone" imperative
 *         (c) Co-presence of coordination/handoffs/qa.md AND
 *             coordination/handoffs/ux-designer.md references in the same step
 *
 * Pattern reference: modelled after tests/qa/wave-108/subagent-body-cleanliness.test.ts
 * Same imports, same describe/test shape, same readFileSync + regex grep pattern.
 */

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(__dirname, "../../..");
const AGENTS_DIR = join(REPO_ROOT, ".claude/agents");

/**
 * The 6 implementer bodies that must carry the architecture/ co-authorship clause.
 * (product-owner.md is intentionally excluded — PO orchestrates but doesn't implement.)
 */
const IMPLEMENTER_FILES = [
  "business-analyst.md",
  "ui-developer.md",
  "backend-developer.md",
  "qa.md",
  "devsecops.md",
  "ux-designer.md",
] as const;

// ---------------------------------------------------------------------------
// Helper — read file content as a single string and as numbered lines
// ---------------------------------------------------------------------------

function readContent(fileName: string): string {
  return readFileSync(join(AGENTS_DIR, fileName), "utf-8");
}

function readLines(
  fileName: string
): Array<{ lineNo: number; text: string }> {
  return readContent(fileName)
    .split("\n")
    .map((text, idx) => ({ lineNo: idx + 1, text }));
}

/**
 * Find contiguous lines in a file that together contain all of the given
 * patterns. Returns true when ALL patterns appear within a run of at most
 * `windowSize` consecutive lines.
 *
 * Used for co-presence assertions (e.g. both qa.md and ux-designer.md paths
 * appearing in the same step paragraph rather than in distant sections).
 */
function coPresent(
  fileName: string,
  patterns: ReadonlyArray<RegExp | string>,
  windowSize = 5
): boolean {
  const lines = readLines(fileName);
  for (let i = 0; i <= lines.length - windowSize; i++) {
    const window = lines
      .slice(i, i + windowSize)
      .map((l) => l.text)
      .join("\n");
    if (patterns.every((p) => (typeof p === "string" ? window.includes(p) : p.test(window)))) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("subagent bodies contain required governance clauses (Wave 109 + 110-A completeness)", () => {
  // -------------------------------------------------------------------------
  // AC-1 — architect.md: co-authorship gate in code-review rubric
  // -------------------------------------------------------------------------

  describe("AC-1 — architect.md: code-review rubric contains co-authorship gate for architecture/ modifications", () => {
    it("architect.md contains the co-authorship gate step (non-Architect modifications to architecture/ require prior HANDOFF)", () => {
      const content = readContent("architect.md");

      // Canonical step-title substring from Wave 109 Architect HANDOFF
      expect(
        content,
        "architect.md is missing the Wave 109 co-authorship gate step. " +
          'Expected to find "Co-authorship gate" in the code-review rubric. ' +
          "This clause was landed in Wave 109 per issue #335."
      ).toContain("Co-authorship gate");

      // The clause must flag non-Architect modifications of architecture/
      // Use /i flag: actual text is "Co-authorship gate (`architecture/` files)" (capital C)
      expect(
        content,
        "architect.md co-authorship gate clause must reference the architecture/ directory restriction."
      ).toMatch(/co-authorship.*architecture\//i);

      // The consequence must be a FAIL verdict
      expect(
        content,
        "architect.md co-authorship gate must specify a FAIL outcome for unauthorized architecture/ edits."
      ).toContain("FAIL");

      // Must require a prior HANDOFF as the approval mechanism
      expect(
        content,
        "architect.md co-authorship gate must require a prior [[HANDOFF: architect]] as the approval path."
      ).toMatch(/HANDOFF.*architect.*approving|prior.*HANDOFF.*architect/);
    });
  });

  // -------------------------------------------------------------------------
  // AC-2 — 6 implementer bodies: "You do NOT write to architecture/" boundary clause
  // -------------------------------------------------------------------------

  describe("AC-2 — 6 implementer bodies: each contains the architecture/ write-boundary clause", () => {
    for (const fileName of IMPLEMENTER_FILES) {
      it(`${fileName}: contains "You do NOT write to \`architecture/\`" boundary clause`, () => {
        const content = readContent(fileName);

        // Primary canonical phrase from Architect HANDOFF Wave 109 §Implementer-body matching clause
        expect(
          content,
          `${fileName} is missing the Wave 109 architecture/ co-authorship boundary. ` +
            'Expected to find "You do NOT write to `architecture/`" or equivalent. ' +
            "This clause was landed in Wave 109 per issue #335 across all 6 implementer bodies."
        ).toMatch(/You do NOT write to `architecture\/`|you do not write to `architecture\/`/i);

        // Clause must reference architecture/ as the durable single source of truth
        expect(
          content,
          `${fileName}: the architecture/ boundary clause must explain WHY (architecture/ is the single source of truth).`
        ).toMatch(/single source of truth|durable.*NFRs.*ADRs|NFRs.*ADRs.*coding standards/);

        // Clause must direct the agent to file a HANDOFF rather than edit unilaterally
        expect(
          content,
          `${fileName}: the architecture/ boundary clause must direct the implementer to HANDOFF to Architect instead of editing unilaterally.`
        ).toMatch(/HANDOFF.*coordination\/handoffs\/architect\.md|file.*HANDOFF.*architect/);
      });
    }
  });

  // -------------------------------------------------------------------------
  // AC-3 — architect.md: pre-verdict SHA sync in code-review step 0
  // -------------------------------------------------------------------------

  describe("AC-3 — architect.md: pre-verdict SHA sync clause present in Code review responsibility", () => {
    it("architect.md step 0 contains the pre-verdict SHA sync rule (git fetch + git checkout before reading diff)", () => {
      const content = readContent("architect.md");

      // Canonical step-title phrase from Architect HANDOFF Wave 109 §Pre-verdict SHA sync
      expect(
        content,
        "architect.md is missing the Wave 109 pre-verdict SHA sync step. " +
          'Expected to find "Pre-verdict SHA sync (mandatory" in the Code review responsibility section. ' +
          "Landed in Wave 109 per issue #314."
      ).toMatch(/Pre-verdict SHA sync \(mandatory/);

      // Must include git fetch origin
      expect(
        content,
        "architect.md pre-verdict SHA sync step must include `git fetch origin` to ensure fresh branch state."
      ).toContain("git fetch origin");

      // Must include git checkout
      expect(
        content,
        "architect.md pre-verdict SHA sync step must include `git checkout` to pin the review to the PR HEAD SHA."
      ).toContain("git checkout");
    });
  });

  // -------------------------------------------------------------------------
  // AC-4 — ux-designer.md: pre-verdict SHA sync in critique workflow
  // -------------------------------------------------------------------------

  describe("AC-4 — ux-designer.md: pre-verdict SHA sync clause present in critique workflow", () => {
    it("ux-designer.md contains the pre-verdict SHA sync rule (git fetch + git checkout before visual verdict)", () => {
      const content = readContent("ux-designer.md");

      // Canonical phrase from UX Designer pre-verdict SHA sync clause (Wave 109)
      expect(
        content,
        "ux-designer.md is missing the Wave 109 pre-verdict SHA sync clause. " +
          'Expected to find "Pre-verdict SHA sync (mandatory" in the critique workflow. ' +
          "Landed in Wave 109 per issue #314."
      ).toMatch(/Pre-verdict SHA sync \(mandatory/);

      // Must include git fetch origin
      expect(
        content,
        "ux-designer.md pre-verdict SHA sync must include `git fetch origin`."
      ).toContain("git fetch origin");

      // Must include git checkout
      expect(
        content,
        "ux-designer.md pre-verdict SHA sync must include `git checkout`."
      ).toContain("git checkout");
    });
  });

  // -------------------------------------------------------------------------
  // AC-5 — devsecops.md: Wave 110-A merge-protocol clause (3 sub-checks)
  // -------------------------------------------------------------------------

  describe("AC-5 — devsecops.md: Wave 110-A merge-protocol clause (mandatory pre-merge gate verification)", () => {
    it("devsecops.md contains the step-title substring 'Verify gate-role PASS is recorded in HANDOFF'", () => {
      const content = readContent("devsecops.md");

      expect(
        content,
        "devsecops.md is missing the Wave 110-A merge-protocol clause. " +
          'Expected to find "Verify gate-role PASS is recorded in HANDOFF" as a step in the Deployment workflow. ' +
          "Landed in Wave 110-A per issue #383."
      ).toContain("Verify gate-role PASS is recorded in HANDOFF");
    });

    it("devsecops.md contains the load-bearing imperative 'do NOT merge on the implementer's claim of PASS alone'", () => {
      const content = readContent("devsecops.md");

      expect(
        content,
        "devsecops.md merge-protocol clause is missing its load-bearing enforcement sentence. " +
          'Expected to find "do NOT merge on the implementer\'s claim of PASS alone". ' +
          "This is the sentence that makes the gate enforceable rather than advisory."
      ).toContain("do NOT merge on the implementer's claim of PASS alone");
    });

    it("devsecops.md merge-protocol step references coordination/handoffs/qa.md AND coordination/handoffs/ux-designer.md in the same step (co-presence)", () => {
      // Both paths must appear within the same step paragraph (not in distant sections).
      // We use a window of 10 lines to cover a multi-sentence step.
      const coPresenceResult = coPresent(
        "devsecops.md",
        [
          "coordination/handoffs/qa.md",
          "coordination/handoffs/ux-designer.md",
        ],
        10
      );

      expect(
        coPresenceResult,
        "devsecops.md merge-protocol step must reference BOTH coordination/handoffs/qa.md " +
          "AND coordination/handoffs/ux-designer.md within the same step paragraph. " +
          "Both gate-role HANDOFF paths must appear together so the step covers the QA gate AND " +
          "the UX gate (for UI-touching PRs). AC-5 of Wave 110-A."
      ).toBe(true);
    });
  });
});
