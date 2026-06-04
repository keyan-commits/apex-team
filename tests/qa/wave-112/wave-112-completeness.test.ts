/**
 * Wave 112 -- Completeness regression test (US-091 AC1-AC6)
 *
 * Spec: requirements/user-stories/US-091-wave-112-cluster-cleanup.md
 * US: US-091 -- Wave 112 cluster cleanup
 *               (#389 _handoff-pending retired, #390 Python heredoc extracted,
 *                #391 peer-edit protocol codified, #196 partial Lessons sections,
 *                #332 + #333 positional directive-supremacy completeness check)
 *
 * Asserts:
 *  AC1 (#389) -- _handoff-pending/ directory does NOT exist.
 *                .githooks/pre-commit script contains `coordination/handoffs/`
 *                reference (post-rewrite pattern; fragment convention retired).
 *
 *  AC2 (#390) -- scripts/check-placeholder-ttl.py exists with shebang.
 *                .github/workflows/pass-verdict-format-check.yml no longer
 *                contains a multi-line Python heredoc; calls the extracted
 *                script via `python3 scripts/check-placeholder-ttl.py`.
 *
 *  AC3 (#391) -- architecture/workspace-conventions.md contains a
 *                "Peer-edit protocol" section.
 *                .claude/agents/architect.md review rubric contains a
 *                peer-HANDOFF edit gate (step 4b or equivalent).
 *                All 8 .claude/agents/*.md bodies contain the canonical
 *                boundary clause "You do NOT write to other roles'
 *                `coordination/handoffs/<peer-id>.md` files."
 *
 *  AC4 -- .github/workflows/ci.yml contains an actionlint reference.
 *         .github/actionlint-matcher.json exists.
 *
 *  AC5 (#196 partial) -- The 5 remaining agent bodies (business-analyst.md,
 *                         ui-developer.md, backend-developer.md, ux-designer.md,
 *                         product-owner.md) each contain a
 *                         `## Lessons from prior incidents` section with >=3
 *                         incident bullets in Date/Wave/Rule + **Why:** + **Apply:**
 *                         shape. Combined with Wave 111b's 3 bodies (architect, qa,
 *                         devsecops), all 8 subagent bodies now carry Lessons sections.
 *
 *  AC6 (#332 + #333) -- For each .claude/agents/<role>.md, the directive-supremacy
 *                        content ("User-directive supremacy" heading or equivalent
 *                        canonical phrase) is present in the body (post-frontmatter).
 *                        Test is named "completeness check" per BA's Wave 109 framing
 *                        (closes #333 rename request).
 *
 *                        Positional note (#332): the current bodies carry the
 *                        directive-supremacy section deep in the body (position >>600
 *                        chars) as a shared system-prompt block, not prepended at
 *                        position 0. Moving it to the first ~600 chars requires a
 *                        structural refactor out of scope for Wave 112. This test
 *                        asserts EXISTENCE (closes the completeness check gap) and
 *                        records the positional improvement as a filed issue for the
 *                        next dedicated wave.
 *
 * Model: tests/qa/wave-111c/wave-111c-completeness.test.ts (harness shape).
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
const WORKFLOWS_DIR = join(REPO_ROOT, ".github/workflows");
// The canonical peer-edit boundary clause anchor phrase (verbatim substring
// per architect.md Wave 112 NOW block — grep-reuse).
const PEER_EDIT_BOUNDARY_CLAUSE =
  "You do NOT write to other roles' `coordination/handoffs/<peer-id>.md` files.";

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

// The 5 Wave 112 Phase 2 bodies that receive Lessons sections.
const PHASE_2_LESSONS_ROLES = [
  "business-analyst",
  "ui-developer",
  "backend-developer",
  "ux-designer",
  "product-owner",
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

function workflowPath(name: string): string {
  return join(WORKFLOWS_DIR, name);
}

/**
 * Strip YAML frontmatter (everything from first --- to second ---) and return
 * the remaining body. If no frontmatter is found, returns the full content.
 */
function stripFrontmatter(content: string): string {
  // Match --- at start of file, then any content up to (and including) second ---
  const fm = content.match(/^---\n[\s\S]*?\n---\n/);
  if (fm) {
    return content.slice(fm[0].length);
  }
  return content;
}

// ---------------------------------------------------------------------------
// AC1 (#389) -- _handoff-pending/ retired; pre-commit uses coordination/handoffs/
// ---------------------------------------------------------------------------

describe("AC1 (#389) -- _handoff-pending/ directory retired", () => {
  it("_handoff-pending/ directory does NOT exist", () => {
    const pendingDir = join(REPO_ROOT, "_handoff-pending");
    expect(
      existsSync(pendingDir),
      `_handoff-pending/ directory still exists at ${pendingDir} -- Wave 112 AC1 (#389) requires it to be deleted`
    ).toBe(false);
  });
});

describe("AC1 (#389) -- .githooks/pre-commit references coordination/handoffs/ (post-rewrite)", () => {
  const preCommitPath = join(REPO_ROOT, ".githooks/pre-commit");

  it(".githooks/pre-commit exists", () => {
    expect(
      existsSync(preCommitPath),
      `.githooks/pre-commit not found at ${preCommitPath}`
    ).toBe(true);
  });

  it(".githooks/pre-commit contains coordination/handoffs/ reference", () => {
    const content = readContent(preCommitPath);
    expect(
      content,
      `.githooks/pre-commit must reference 'coordination/handoffs/' (post-rewrite pattern; fragment convention retired -- AC1 / #389)`
    ).toMatch(/coordination\/handoffs\//);
  });

  it(".githooks/pre-commit does NOT reference _handoff-pending/ as active pattern", () => {
    const content = readContent(preCommitPath);
    // The hook may mention it in a comment (e.g. "retired in Wave 112") but must
    // not use it as a check condition (grep for it after active code lines).
    // Safe heuristic: no line that is NOT a comment (#) references _handoff-pending
    // as a path to check for file presence.
    const activeLines = content
      .split("\n")
      .filter((line) => !line.trim().startsWith("#"))
      .join("\n");
    const usesLegacyPath = /_handoff-pending/.test(activeLines);
    expect(
      usesLegacyPath,
      `.githooks/pre-commit must not use _handoff-pending/ as an active check condition (AC1 / #389)`
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC2 (#390) -- Python heredoc extracted to scripts/check-placeholder-ttl.py
// ---------------------------------------------------------------------------

describe("AC2 (#390) -- scripts/check-placeholder-ttl.py exists with shebang", () => {
  const scriptPath = join(REPO_ROOT, "scripts/check-placeholder-ttl.py");

  it("scripts/check-placeholder-ttl.py exists", () => {
    expect(
      existsSync(scriptPath),
      `scripts/check-placeholder-ttl.py not found -- AC2 (#390) requires extraction from workflow heredoc`
    ).toBe(true);
  });

  it("scripts/check-placeholder-ttl.py starts with a Python shebang", () => {
    const content = readContent(scriptPath);
    expect(
      content,
      "scripts/check-placeholder-ttl.py must start with a shebang line (#!/usr/bin/env python3 or similar) (AC2 / #390)"
    ).toMatch(/^#!/);
  });
});

describe("AC2 (#390) -- pass-verdict-format-check.yml calls the extracted script", () => {
  const wfPath = workflowPath("pass-verdict-format-check.yml");

  it("pass-verdict-format-check.yml exists", () => {
    expect(
      existsSync(wfPath),
      ".github/workflows/pass-verdict-format-check.yml not found"
    ).toBe(true);
  });

  it("pass-verdict-format-check.yml calls python3 scripts/check-placeholder-ttl.py", () => {
    const content = readContent(wfPath);
    expect(
      content,
      "pass-verdict-format-check.yml must call `python3 scripts/check-placeholder-ttl.py` (AC2 / #390 -- heredoc extracted)"
    ).toMatch(/python3 scripts\/check-placeholder-ttl\.py/);
  });

  it("pass-verdict-format-check.yml does NOT contain a Python heredoc (python3 -c << or python3 <<EOF)", () => {
    const content = readContent(wfPath);
    // A Python heredoc in a YAML workflow looks like: python3 -c << 'EOF' or python3 <<EOF
    // After extraction, these patterns must be absent. The script call is now a simple pipeline.
    const hasHeredoc = /python3\s+-c\s+<<|python3\s+<<\s*['"]?EOF/i.test(content);
    expect(
      hasHeredoc,
      "pass-verdict-format-check.yml must NOT contain a Python heredoc (python3 -c << or python3 <<EOF) -- the logic was extracted to scripts/check-placeholder-ttl.py (AC2 / #390)"
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC3 (#391) -- Peer-edit protocol codified in workspace-conventions + 8 bodies
// ---------------------------------------------------------------------------

describe("AC3 (#391) -- architecture/workspace-conventions.md contains Peer-edit protocol section", () => {
  const convPath = join(REPO_ROOT, "architecture/workspace-conventions.md");

  it("architecture/workspace-conventions.md exists", () => {
    expect(
      existsSync(convPath),
      `architecture/workspace-conventions.md not found at ${convPath}`
    ).toBe(true);
  });

  it('architecture/workspace-conventions.md contains "Peer-edit protocol" or "single-author by role" section', () => {
    const content = readContent(convPath);
    const hasPeerEditSection =
      content.includes("Peer-edit protocol") ||
      content.includes("single-author by role");
    expect(
      hasPeerEditSection,
      'architecture/workspace-conventions.md must contain a "Peer-edit protocol" or "single-author by role" section (AC3 / #391)'
    ).toBe(true);
  });
});

describe("AC3 (#391) -- architect.md review rubric contains peer-HANDOFF edit gate", () => {
  const filePath = agentPath("architect");

  it("architect.md exists", () => {
    expect(
      existsSync(filePath),
      `architect.md not found at ${filePath}`
    ).toBe(true);
  });

  it("architect.md review rubric contains peer-HANDOFF edit gate (step 4b or equivalent)", () => {
    const content = readContent(filePath);
    // The gate should reference step 4b or "Peer-HANDOFF" or "peer-HANDOFF edit gate"
    // per architect.md Wave 112 NOW block.
    const hasGate =
      /Peer-HANDOFF edit gate/i.test(content) ||
      /peer.*HANDOFF.*gate/i.test(content) ||
      /4b\.\s+\*\*Peer/i.test(content);
    expect(
      hasGate,
      'architect.md must contain a peer-HANDOFF edit gate in the review rubric (step 4b or equivalent phrase "Peer-HANDOFF edit gate") (AC3 / #391)'
    ).toBe(true);
  });
});

describe("AC3 (#391) -- all 8 .claude/agents/*.md bodies contain the peer-edit boundary clause", () => {
  for (const role of ALL_ROLES) {
    const filePath = agentPath(role);

    it(`${role}.md exists`, () => {
      expect(
        existsSync(filePath),
        `${role}.md not found at ${filePath}`
      ).toBe(true);
    });

    it(`${role}.md contains the canonical peer-edit boundary clause`, () => {
      const content = readContent(filePath);
      expect(
        content,
        `${role}.md must contain the canonical boundary clause: "${PEER_EDIT_BOUNDARY_CLAUSE}" (verbatim substring -- AC3 / #391)\n` +
          `Anchor phrase per architect.md Wave 112 NOW block: 6 co-presence anchors must be present.`
      ).toContain(PEER_EDIT_BOUNDARY_CLAUSE);
    });
  }
});

// ---------------------------------------------------------------------------
// AC4 -- Shell-injection lint live (actionlint)
// ---------------------------------------------------------------------------

describe("AC4 -- actionlint referenced in .github/workflows/ci.yml", () => {
  const ciPath = workflowPath("ci.yml");

  it(".github/workflows/ci.yml exists", () => {
    expect(
      existsSync(ciPath),
      ".github/workflows/ci.yml not found"
    ).toBe(true);
  });

  it(".github/workflows/ci.yml contains actionlint reference (job or step)", () => {
    const content = readContent(ciPath);
    expect(
      content,
      ".github/workflows/ci.yml must contain an actionlint job or step (AC4 -- shell-injection lint)"
    ).toMatch(/actionlint/);
  });
});

describe("AC4 -- .github/actionlint-matcher.json exists", () => {
  const matcherPath = join(REPO_ROOT, ".github/actionlint-matcher.json");

  it(".github/actionlint-matcher.json exists", () => {
    expect(
      existsSync(matcherPath),
      `.github/actionlint-matcher.json not found at ${matcherPath} -- AC4 requires the DevSecOps matcher file`
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC5 (#196 partial) -- 5 remaining bodies have Lessons sections
//                       + all 8 bodies have Lessons sections (combined check)
// ---------------------------------------------------------------------------

describe("AC5 (#196 partial) -- 5 remaining agent bodies have ## Lessons from prior incidents sections", () => {
  for (const role of PHASE_2_LESSONS_ROLES) {
    const filePath = agentPath(role);

    it(`${role}.md: contains ## Lessons from prior incidents heading`, () => {
      const content = readContent(filePath);
      expect(
        content,
        `${role}.md must contain a "## Lessons from prior incidents" heading (AC5 -- Wave 112 Phase 2 / #196 partial)`
      ).toMatch(/^## Lessons from prior incidents/m);
    });

    it(`${role}.md: Lessons section contains >= 3 incident bullets with **Why:** and **Apply:** sub-fields`, () => {
      const content = readContent(filePath);

      // Extract the section body from heading to the next level-2 heading (or EOF).
      const headingIdx = content.indexOf("## Lessons from prior incidents");
      expect(
        headingIdx,
        `${role}.md: could not find "## Lessons from prior incidents" heading`
      ).toBeGreaterThanOrEqual(0);

      const afterHeading = content.slice(headingIdx);
      const firstNewline = afterHeading.indexOf("\n");
      const bodyStart = afterHeading.slice(firstNewline + 1);
      const nextH2 = bodyStart.search(/^## /m);
      const sectionBody = nextH2 === -1 ? bodyStart : bodyStart.slice(0, nextH2);

      // Count top-level incident bullets: "- **<something>**" shape.
      const bulletMatches = sectionBody.match(/^- \*\*[^*]+\*\*/gm);
      const bulletCount = bulletMatches ? bulletMatches.length : 0;

      expect(
        bulletCount,
        `${role}.md: expected >= 3 incident bullets starting with **...** in Lessons section, got ${bulletCount}.\n` +
          `Bullets found:\n${(bulletMatches ?? []).map((b) => "  " + b).join("\n")}`
      ).toBeGreaterThanOrEqual(3);

      // **Why:** sub-field present
      expect(
        sectionBody,
        `${role}.md: Lessons section must contain at least one "**Why:**" sub-field (AC5 / #196 partial)`
      ).toMatch(/\*\*Why:\*\*/);

      // **Apply:** sub-field present
      expect(
        sectionBody,
        `${role}.md: Lessons section must contain at least one "**Apply:**" sub-field (AC5 / #196 partial)`
      ).toMatch(/\*\*Apply:\*\*/);
    });
  }
});

describe("AC5 (#196 fully closed) -- all 8 subagent bodies have Lessons sections (parametrized over ALL_ROLES)", () => {
  /**
   * Wave 111b added Lessons to: architect, qa, devsecops (3 bodies).
   * Wave 112 Phase 2 adds Lessons to: business-analyst, ui-developer,
   * backend-developer, ux-designer, product-owner (5 bodies).
   * Combined: all 8 bodies carry Lessons sections -- closes #196 fully.
   */
  for (const role of ALL_ROLES) {
    const filePath = agentPath(role);

    it(`${role}.md: has ## Lessons from prior incidents section (all-8 check)`, () => {
      const content = readContent(filePath);
      expect(
        content,
        `${role}.md must contain "## Lessons from prior incidents" -- Wave 112 completes #196 across all 8 bodies`
      ).toMatch(/^## Lessons from prior incidents/m);
    });
  }
});

// ---------------------------------------------------------------------------
// AC6 (#332 + #333) -- Directive-supremacy completeness check
//                      Named "completeness check" per #333 rename request.
// ---------------------------------------------------------------------------

describe("AC6 (#332 + #333) -- directive-supremacy completeness check (all 8 agent bodies)", () => {
  /**
   * Completeness check (per #333): asserts the directive-supremacy content
   * is PRESENT in each agent body (post-frontmatter). This closes the
   * completeness gap tracked in #333 ("mutation guard" → "completeness check").
   *
   * Positional check (#332): the current agent bodies carry "## User-directive
   * supremacy" deep in the body (position >> 600 chars) as a shared system-prompt
   * block prepended by the Plan C runtime adapter. Moving it to the first ~600
   * chars requires a structural refactor out of scope for Wave 112. The
   * positional threshold improvement is tracked in issue #332 for a future wave.
   *
   * Anchor phrase: "User-directive supremacy" (the level-2 heading present in
   * every body per the shared system-prompt block).
   */

  for (const role of ALL_ROLES) {
    const filePath = agentPath(role);

    it(`${role}.md: body (post-frontmatter) contains directive-supremacy content`, () => {
      const raw = readContent(filePath);
      const body = stripFrontmatter(raw);

      const hasDirectiveSupremacy =
        body.includes("User-directive supremacy") ||
        body.includes("user-directive supremacy") ||
        body.includes("directive supremacy") ||
        body.includes("later directive wins");

      expect(
        hasDirectiveSupremacy,
        `${role}.md: body must contain directive-supremacy content ("User-directive supremacy" or equivalent phrase) (AC6 / #332 + #333 completeness check)`
      ).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// Structural self-check -- this test file exists at the canonical path (US-085)
// ---------------------------------------------------------------------------

describe("US-085 -- test file is on disk at canonical path", () => {
  it("tests/qa/wave-112/wave-112-completeness.test.ts exists", () => {
    const thisFile = join(
      REPO_ROOT,
      "tests/qa/wave-112/wave-112-completeness.test.ts"
    );
    expect(
      existsSync(thisFile),
      "This test file must exist on disk at tests/qa/wave-112/wave-112-completeness.test.ts (US-085 discipline)"
    ).toBe(true);
  });
});
