/**
 * F1 fitness function — ADR-013 union-merge driver regression guard
 *
 * Asserts .gitattributes carries merge=union for every append-mostly coordination
 * doc. Removing any entry causes the merge train to stall on doc-only conflicts —
 * the exact class ADR-013 D1 was designed to prevent.
 *
 * Reproduces-then-prevents invariant (US-051 / Wave 97):
 *   Pre-fix SHA (FAIL):  first commit on feature/214-fix-f1-fitness-test
 *                        (.gitattributes missing the glob HANDOFF.md entry)
 *   Post-fix SHA (PASS): second commit on feature/214-fix-f1-fitness-test
 *                        (.gitattributes fully restored + ci.yml defaultBranch fix)
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";

function parseGitattributes(raw: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [pattern, ...attrs] = trimmed.split(/\s+/);
    map.set(pattern, attrs);
  }
  return map;
}

const GITATTRIBUTES_PATH = join(process.cwd(), ".gitattributes");
const content = readFileSync(GITATTRIBUTES_PATH, "utf8");
const entries = parseGitattributes(content);

// Every file that multiple parallel waves append to must carry merge=union.
// Removing any entry here will break the merge train (ADR-013).
const REQUIRED: string[] = [
  "HANDOFF.md",
  "**/HANDOFF.md",
  ".restart-trigger",
  "LESSONS.md",
  "requirements/INDEX.md",
  "architecture/INDEX.md",
];

describe("F1 fitness — ADR-013 .gitattributes union-merge entries", () => {
  for (const pattern of REQUIRED) {
    it(`"${pattern}" has merge=union`, () => {
      const attrs = entries.get(pattern);
      expect(attrs, `"${pattern}" is missing from .gitattributes`).toBeDefined();
      expect(
        attrs,
        `"${pattern}" is present but does not carry merge=union`,
      ).toContain("merge=union");
    });
  }

  it("does not redefine merge.union.driver (must use git built-in, not custom sort -u)", () => {
    // A custom driver redefinition (e.g. sort -u) masks real union semantics and
    // makes the CI fitness test vacuous (Wave 92 post-mortem, issue #214).
    expect(content).not.toMatch(/merge\.union\.driver/);
  });
});
