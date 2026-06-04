/**
 * Wave 108 — Subagent body cleanliness regression test
 *
 * Spec: architecture/decisions/ADR-017-subagent-body-rewrite-rules.md
 * US: No formal US-NNN — architectural rule pack; QA test is part of the wave.
 *
 * Asserts that the 8 subagent body files (.claude/agents/*.md) contain ZERO
 * references to retired apex-team monolith patterns (ADR-017 denylist).
 *
 * Allowlist: exactly 8 lines — one "You do NOT have `mcp__apex-team__*` tools"
 * sentence per file — are permitted per ADR-017 §Allowlist exceptions.
 *
 * This is the first concrete US-085 AC5 smoke proof: tests are files on disk,
 * runnable with `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts`
 */

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(__dirname, "../../..");
const AGENTS_DIR = join(REPO_ROOT, ".claude/agents");

const AGENT_FILES = [
  "architect.md",
  "backend-developer.md",
  "business-analyst.md",
  "devsecops.md",
  "product-owner.md",
  "qa.md",
  "ui-developer.md",
  "ux-designer.md",
] as const;

/**
 * ADR-017 §"Allowlist exceptions" — the exact phrase permitted once per file.
 * All other occurrences of mcp__apex-team__ are disallowed.
 */
const MCP_APEX_ALLOWLIST_PHRASE = "You do NOT have";

/**
 * ADR-017 §"Concrete grep test" — Pattern 2 (broad legacy patterns).
 * Every match is a violation; zero exceptions.
 */
const BROAD_LEGACY_PATTERNS = [
  /pnpm dev:test/,
  /pnpm dev:supervised/,
  /\.restart-trigger/,
  /_handoff-pending/,
  /pnpm fold-handoff/,
  /talk_to_product_owner/,
  /talk_to_role/,
  /\/api\/health/,
  /data\/test-.*\.db/,
  /agent_state/,
  /:3100/,
  /:3110/,
  /:3120/,
  /:3130/,
] as const;

/**
 * ADR-017 §"Concrete grep test" — Pattern 3 (dangling src/lib pointers).
 * Every match is a violation; zero exceptions.
 */
const DANGLING_SRC_LIB_PATTERNS = [
  /src\/lib\/roles\.ts/,
  /src\/lib\/protocols\.ts/,
  /src\/lib\/skills\//,
] as const;

/**
 * ADR-017 §"Resolve the Open Question" — the Plan C adapter header must have
 * been removed. This marker phrase appearing is a violation.
 */
const PLAN_C_ADAPTER_HEADER_MARKER = /## Plan C runtime adapter/;

// ---------------------------------------------------------------------------
// Helper — read file lines with 1-based line numbers
// ---------------------------------------------------------------------------

function readLines(filePath: string): Array<{ lineNo: number; text: string }> {
  const content = readFileSync(filePath, "utf-8");
  return content.split("\n").map((text, idx) => ({ lineNo: idx + 1, text }));
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("subagent bodies do not reference legacy monolith patterns", () => {
  // -------------------------------------------------------------------------
  // Pattern 1: mcp__apex-team__ — allowed ONLY in the allowlisted disclaimer
  // -------------------------------------------------------------------------

  describe("Pattern 1 — mcp__apex-team__ only in the allowlisted disclaimer (one line per file)", () => {
    for (const fileName of AGENT_FILES) {
      const filePath = join(AGENTS_DIR, fileName);

      it(`${fileName}: mcp__apex-team__ appears at most once and only in the "You do NOT have" disclaimer`, () => {
        const lines = readLines(filePath);
        const matchingLines = lines.filter((l) =>
          l.text.includes("mcp__apex-team__")
        );
        const violations = matchingLines.filter(
          (l) => !l.text.includes(MCP_APEX_ALLOWLIST_PHRASE)
        );

        expect(
          violations,
          `${fileName}: found ${violations.length} non-allowlisted mcp__apex-team__ reference(s):\n` +
            violations
              .map((l) => `  line ${l.lineNo}: ${l.text.trim()}`)
              .join("\n")
        ).toHaveLength(0);

        // Also assert at most one occurrence total (ADR-017 grants exactly one per file)
        expect(
          matchingLines.length,
          `${fileName}: expected exactly 1 allowlisted mcp__apex-team__ line, got ${matchingLines.length}:\n` +
            matchingLines
              .map((l) => `  line ${l.lineNo}: ${l.text.trim()}`)
              .join("\n")
        ).toBeLessThanOrEqual(1);
      });
    }
  });

  // -------------------------------------------------------------------------
  // Pattern 2: broad legacy patterns — zero matches permitted anywhere
  // -------------------------------------------------------------------------

  describe("Pattern 2 — no broad legacy monolith patterns (zero matches)", () => {
    for (const fileName of AGENT_FILES) {
      const filePath = join(AGENTS_DIR, fileName);

      for (const pattern of BROAD_LEGACY_PATTERNS) {
        it(`${fileName}: does not contain "${pattern.source}"`, () => {
          const lines = readLines(filePath);
          const violations = lines.filter((l) => pattern.test(l.text));

          expect(
            violations,
            `${fileName} × pattern /${pattern.source}/: found ${violations.length} match(es) — legacy pattern must be removed per ADR-017:\n` +
              violations
                .map((l) => `  line ${l.lineNo}: ${l.text.trim()}`)
                .join("\n")
          ).toHaveLength(0);
        });
      }
    }
  });

  // -------------------------------------------------------------------------
  // Pattern 3: no dangling pointers to deleted src/lib files
  // -------------------------------------------------------------------------

  describe("Pattern 3 — no dangling src/lib pointers to deleted source files", () => {
    for (const fileName of AGENT_FILES) {
      const filePath = join(AGENTS_DIR, fileName);

      for (const pattern of DANGLING_SRC_LIB_PATTERNS) {
        it(`${fileName}: does not reference deleted file "${pattern.source}"`, () => {
          const lines = readLines(filePath);
          const violations = lines.filter((l) => pattern.test(l.text));

          expect(
            violations,
            `${fileName} × pattern /${pattern.source}/: found ${violations.length} dangling pointer(s) to a deleted source file — must be inlined or removed per ADR-017 §Inline-quote rule:\n` +
              violations
                .map((l) => `  line ${l.lineNo}: ${l.text.trim()}`)
                .join("\n")
          ).toHaveLength(0);
        });
      }
    }
  });

  // -------------------------------------------------------------------------
  // Pattern 4: Plan C runtime adapter header must be absent
  // -------------------------------------------------------------------------

  describe("Pattern 4 — Plan C runtime adapter header removed from all files", () => {
    for (const fileName of AGENT_FILES) {
      const filePath = join(AGENTS_DIR, fileName);

      it(`${fileName}: does not contain the "## Plan C runtime adapter" header`, () => {
        const lines = readLines(filePath);
        const violations = lines.filter((l) =>
          PLAN_C_ADAPTER_HEADER_MARKER.test(l.text)
        );

        expect(
          violations,
          `${fileName}: Plan C runtime adapter header still present — must be removed per ADR-017 §"Resolve the Open Question":\n` +
            violations
              .map((l) => `  line ${l.lineNo}: ${l.text.trim()}`)
              .join("\n")
        ).toHaveLength(0);
      });
    }
  });

  // -------------------------------------------------------------------------
  // Allowlist total count sanity check — must be exactly 8 (one per file)
  // -------------------------------------------------------------------------

  it("allowlist total: exactly 8 mcp__apex-team__ occurrences across all 8 files (one per file)", () => {
    let total = 0;
    const perFile: Array<{ file: string; count: number }> = [];

    for (const fileName of AGENT_FILES) {
      const filePath = join(AGENTS_DIR, fileName);
      const lines = readLines(filePath);
      const count = lines.filter((l) =>
        l.text.includes("mcp__apex-team__")
      ).length;
      total += count;
      perFile.push({ file: fileName, count });
    }

    expect(
      total,
      `Expected exactly 8 mcp__apex-team__ occurrences total (one per file); got ${total}.\nPer-file breakdown:\n` +
        perFile.map((e) => `  ${e.file}: ${e.count}`).join("\n")
    ).toBe(8);
  });
});
