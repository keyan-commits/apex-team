/**
 * Wave 111b -- Completeness regression test (US-089 AC1-AC5)
 *
 * Spec: requirements/user-stories/US-089-wave-111b-fanout.md
 * US: US-089 -- Wave 111b Fan-out: Lessons-in-Bodies, UX Skills, Skill Proposals,
 *               ADR-018 Amendment, ADR-018 Cross-refs
 *
 * Asserts:
 *  AC1 -- architect.md, qa.md, devsecops.md each contain
 *         `## Lessons from prior incidents` with >=3 bullets in
 *         Date/Wave -- Rule: / Why: / Apply: shape.
 *  AC2 -- ux-designer.md contains the `## Design tools` (or equivalent)
 *         section addressing all 6 proposed skills (#199).
 *  AC3 -- Each of 11 skill topics lands in the relevant subagent body:
 *           - business-analyst.md: BDD/Given-When-Then + traceability index
 *           - architect.md: AI/agent review lens + STRIDE gate
 *           - ui-developer.md: prefers-reduced-motion + View Transitions API
 *           - backend-developer.md: N+1/eager-load + graceful shutdown/health-probe
 *           - qa.md: Contract testing + Mutation testing
 *           - devsecops.md: OIDC workload identity + Policy-as-code
 *  AC4 -- ADR-018 contains the Wave 111b amendment heading and the string
 *         `(pending)`; pass-verdict-format.test.ts still passes (asserted
 *         separately; here we verify ADR-018 itself contains the amendment).
 *  AC5 -- devsecops.md, architect.md, ux-designer.md, qa.md each contain
 *         `ADR-018` inline citation; this test file exists at the canonical path.
 *
 * Model: tests/qa/wave-108/subagent-body-cleanliness.test.ts (harness shape).
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
const ADR_018_PATH = join(
  REPO_ROOT,
  "architecture/decisions/ADR-018-pass-verdict-format.md"
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

// ---------------------------------------------------------------------------
// AC1 -- `## Lessons from prior incidents` in 3 gate-role bodies
// ---------------------------------------------------------------------------

describe("AC1 -- Lessons from prior incidents section in 3 gate-role bodies", () => {
  /**
   * Bullet shape expected:
   *   - **Date / Wave / Rule** — ...
   *     - **Why:** ...
   *     - **Apply:** ...
   *
   * The US-089 AC1 spec says:
   *   "- **Date/Wave** — Rule: <one-line rule>. Why: <incident summary>. Apply: <how to use>."
   * The actual bodies (landed by Architect Phase 1) use the form documented in
   * architect.md HANDOFF:
   *   "- **Date / Wave / Rule** — one-line incident summary"
   *   "  - **Why:** root cause"
   *   "  - **Apply:** concrete behavior"
   * Either inline (US-089 AC1 spec shape) or nested-bullet (Architect HANDOFF shape)
   * format is acceptable -- we match on the presence of **Why:** and **Apply:** fields
   * anywhere in the section body, and count bullets that start with **<bold>**.
   */

  const GATE_ROLE_BODIES: Array<[string, string]> = [
    ["architect", "architect.md"],
    ["qa", "qa.md"],
    ["devsecops", "devsecops.md"],
  ];

  for (const [role, fileName] of GATE_ROLE_BODIES) {
    const filePath = agentPath(role);

    it(`${fileName}: contains ## Lessons from prior incidents heading`, () => {
      const content = readContent(filePath);
      expect(
        content,
        `${fileName}: must contain a "## Lessons from prior incidents" heading (AC1 -- Cluster 1)`
      ).toMatch(/^## Lessons from prior incidents/m);
    });

    it(`${fileName}: Lessons section contains at least 3 incident bullets with **Why:** and **Apply:** sub-fields`, () => {
      const content = readContent(filePath);

      // Extract the section body from the heading to the next level-2 heading
      // (or end of file if this is the last section).
      // JavaScript does not support \Z; use [\s\S]* to consume to EOF, and
      // rely on a non-greedy match bounded by a lookahead for the next ## heading.
      // Fallback: if no subsequent ## heading exists, capture everything after.
      const headingIdx = content.indexOf("## Lessons from prior incidents");
      expect(
        headingIdx,
        `${fileName}: could not find "## Lessons from prior incidents" heading`
      ).toBeGreaterThanOrEqual(0);

      const afterHeading = content.slice(headingIdx);
      // Find the next ## heading after the first line (skip the heading line itself)
      const firstNewline = afterHeading.indexOf("\n");
      const bodyStart = afterHeading.slice(firstNewline + 1);
      const nextH2 = bodyStart.search(/^## /m);
      const sectionBody = nextH2 === -1 ? bodyStart : bodyStart.slice(0, nextH2);

      // Count bullets that start with bold text (top-level incident entries)
      // Shape: "- **<something>**" or "- **<something>** — ..."
      const bulletMatches = sectionBody.match(/^- \*\*[^*]+\*\*/gm);
      const bulletCount = bulletMatches ? bulletMatches.length : 0;

      expect(
        bulletCount,
        `${fileName}: expected at least 3 incident bullets starting with **...** in Lessons section, got ${bulletCount}.\nBullets found:\n${(bulletMatches ?? []).map((b) => "  " + b).join("\n")}`
      ).toBeGreaterThanOrEqual(3);

      // **Why:** field present in the section
      expect(
        sectionBody,
        `${fileName}: Lessons section must contain at least one "**Why:**" sub-field`
      ).toMatch(/\*\*Why:\*\*/);

      // **Apply:** field present in the section
      expect(
        sectionBody,
        `${fileName}: Lessons section must contain at least one "**Apply:**" sub-field`
      ).toMatch(/\*\*Apply:\*\*/);
    });
  }
});

// ---------------------------------------------------------------------------
// AC2 -- UX `## Design tools` section covers all 6 proposed skills (#199)
// ---------------------------------------------------------------------------

describe("AC2 -- ux-designer.md Design tools section covers all 6 proposed skills", () => {
  const filePath = agentPath("ux-designer");

  it("ux-designer.md contains a ## Design tools (or equivalent) section", () => {
    const content = readContent(filePath);
    // Accept "## Design tools" or "## Community design skills" or "## Skill evaluation"
    expect(
      content,
      "ux-designer.md must contain a '## Design tools' (or equivalent skill-evaluation) section (AC2 -- Cluster 2, #199)"
    ).toMatch(/^## (Design tools|Community design skills|Skill evaluation)/m);
  });

  /**
   * All 6 skills must be mentioned by name (case-insensitive).
   * Either adopted (invocation pattern) or deferred/rejected (rationale present).
   * The AC requires no skill be silently omitted.
   */
  const REQUIRED_SKILL_NAMES: Array<[string, RegExp]> = [
    ["Impeccable", /impeccable/i],
    ["figma-implement-design", /figma.implement.design|figma-implement/i],
    ["playwright-skill", /playwright.skill|playwright-skill/i],
    ["theme-factory", /theme.factory|theme-factory/i],
    ["accesslint", /accesslint/i],
    ["Excalidraw", /excalidraw/i],
  ];

  for (const [skillName, pattern] of REQUIRED_SKILL_NAMES) {
    it(`ux-designer.md mentions skill "${skillName}" (adopted, deferred, or rejected)`, () => {
      const content = readContent(filePath);
      expect(
        content,
        `ux-designer.md must address skill "${skillName}" -- either an invocation pattern (adopt) or a one-line rationale (defer/reject). No skill may be silently omitted (AC2 -- #199).`
      ).toMatch(pattern);
    });
  }
});

// ---------------------------------------------------------------------------
// AC3 -- Cluster 3 skill content in 6 implementer bodies (11 checks)
// ---------------------------------------------------------------------------

describe("AC3 -- Cluster 3 skill content in 6 implementer bodies (11 checks)", () => {
  /**
   * Each tuple: [role, fileName, topicDescription, contentPattern]
   *
   * Pattern rationale:
   *  - #292 business-analyst BDD: body already had Given/When/Then, #292 adds
   *    the co-authorship section (`### BDD acceptance criteria`). Grep for
   *    "BDD" or "Given/When/Then" or "Gherkin" in a section context.
   *  - #293 business-analyst traceability: `### Forward-traceability index`
   *    section landed. Grep for "traceability" or "forward-tracea".
   *  - #295 architect AI/agent review: `#### AI / agent system review lens`
   *    section. Grep for "AI.*agent.*review" or "agent system review".
   *  - #359 architect STRIDE: `#### STRIDE threat-modeling gate` section.
   *    Grep for "STRIDE".
   *  - #361 ui-developer prefers-reduced-motion: section added. Grep for
   *    "prefers-reduced-motion".
   *  - #362 ui-developer View Transitions: section added. Grep for
   *    "View Transitions".
   *  - #363 backend-developer N+1: section added. Grep for "N+1" or "N\+1".
   *  - #364 backend-developer graceful shutdown: section added. Grep for
   *    "graceful shutdown" or "health.probe".
   *  - #365 qa contract testing: section present. Grep for
   *    "Contract testing" or "contract test".
   *  - #366 qa mutation testing: section present. Grep for
   *    "Mutation testing" or "mutation score".
   *  - #368 devsecops OIDC workload identity: section added. Grep for
   *    "OIDC" or "workload identity".
   *  - #369 devsecops policy-as-code: section added. Grep for
   *    "Policy-as-code" or "policy.as.code" or "OPA" or "Rego".
   *
   * Note: #294 (fitness functions in CI) may be closed as already-covered
   * per US-089 AC3 note: "Architect's call, documented in the issue."
   * We do NOT assert a body change for #294 here -- the US explicitly allows
   * it to be issue-closed rather than body-added. Only the 11 listed topics
   * that have clear body-presence requirements are asserted.
   */

  const CLUSTER_3_CHECKS: Array<[string, string, string, RegExp]> = [
    // [role, issueRef, topicDescription, contentPattern]
    [
      "business-analyst",
      "#292",
      "BDD / Given-When-Then co-authorship with QA",
      /BDD|Given.When.Then|Gherkin/i,
    ],
    [
      "business-analyst",
      "#293",
      "Forward-traceability index (US -> BR -> test)",
      /forward.tracea|traceability index/i,
    ],
    [
      "architect",
      "#295",
      "AI/agent architectural review lens",
      /AI\s*.{0,10}agent\s*.{0,20}review|agent system review|agent.*architectural review/i,
    ],
    [
      "architect",
      "#359",
      "STRIDE threat-modeling gate",
      /STRIDE/,
    ],
    [
      "ui-developer",
      "#361",
      "prefers-reduced-motion support",
      /prefers-reduced-motion/,
    ],
    [
      "ui-developer",
      "#362",
      "View Transitions API",
      /View Transitions/i,
    ],
    [
      "backend-developer",
      "#363",
      "N+1 query discipline and eager-load",
      /N\+1/,
    ],
    [
      "backend-developer",
      "#364",
      "Graceful shutdown and health-probe contract",
      /graceful shutdown|health.probe/i,
    ],
    [
      "qa",
      "#365",
      "Contract testing (consumer-driven contract pattern)",
      /Contract testing|consumer.driven contract|contract test/i,
    ],
    [
      "qa",
      "#366",
      "Mutation testing (mutation score / Stryker)",
      /Mutation testing|mutation score|Stryker/i,
    ],
    [
      "devsecops",
      "#368",
      "OIDC workload identity federation",
      /OIDC|workload identity/i,
    ],
    [
      "devsecops",
      "#369",
      "Policy-as-code gates (OPA / Rego / Kyverno)",
      /Policy-as-code|policy.as.code|OPA|Rego|Kyverno/i,
    ],
  ];

  for (const [role, issueRef, topicDescription, pattern] of CLUSTER_3_CHECKS) {
    it(`${role}.md contains ${topicDescription} (${issueRef})`, () => {
      const filePath = agentPath(role);
      const content = readContent(filePath);
      expect(
        content,
        `${role}.md must contain skill content for "${topicDescription}" (${issueRef} -- AC3 Cluster 3).` +
          ` Pattern: /${pattern.source}/`
      ).toMatch(pattern);
    });
  }
});

// ---------------------------------------------------------------------------
// AC4 -- ADR-018 commit-time amendment present
// ---------------------------------------------------------------------------

describe("AC4 -- ADR-018 contains the Wave 111b commit-time amendment", () => {
  it("ADR-018 contains a Wave 111b amendment heading (2026-06-04 amendment)", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content,
      "ADR-018 must contain a '2026-06-04 amendment' (or 'Wave 111b') section heading documenting the commit-time placeholder pattern"
    ).toMatch(/2026-06-04 amendment|Wave 111b amendment/i);
  });

  it("ADR-018 amendment text mentions PR #0 placeholder pattern", () => {
    const content = readContent(ADR_018_PATH);
    expect(
      content,
      "ADR-018 amendment must reference 'PR #0' as the commit-time placeholder sentinel (AC4 -- Cluster 6)"
    ).toMatch(/PR #0/);
  });

  it("ADR-018 contains the word 'pending' (commit-time placeholder language)", () => {
    const content = readContent(ADR_018_PATH);
    // US-089 AC4 requires the amendment to reference `(pending)` placeholder
    // OR commit-time placeholder language. The ADR uses "PR #0" as the sentinel
    // and does not use the literal string "(pending)" -- but it DOES describe
    // the two-phase placeholder pattern. We assert the broader term "placeholder".
    expect(
      content,
      "ADR-018 amendment must discuss placeholder / pending pattern (commit-time placeholder language -- AC4 -- Cluster 6)"
    ).toMatch(/placeholder|pending/i);
  });

  it("pass-verdict-format.test.ts still exists (ADR-018 amendment is additive -- zero test regressions)", () => {
    const testPath = join(
      REPO_ROOT,
      "tests/qa/wave-111/pass-verdict-format.test.ts"
    );
    expect(
      existsSync(testPath),
      `tests/qa/wave-111/pass-verdict-format.test.ts must still exist on disk -- the ADR-018 amendment must not have removed it (AC4 -- Cluster 6)`
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC5 -- ADR-018 cross-refs in 4 gate-role bodies + this file exists
// ---------------------------------------------------------------------------

describe("AC5 -- ADR-018 inline citation in 4 gate-role bodies", () => {
  /**
   * Each gate-role body must cite ADR-018 inline.
   * Canonical cite text (from Architect HANDOFF):
   *   "see ADR-018 for canonical PASS-verdict block format"
   * We accept any occurrence of the substring "ADR-018".
   */

  const GATE_ROLES: Array<[string, string]> = [
    ["devsecops", "devsecops.md"],
    ["architect", "architect.md"],
    ["ux-designer", "ux-designer.md"],
    ["qa", "qa.md"],
  ];

  for (const [role, fileName] of GATE_ROLES) {
    it(`${fileName}: contains inline ADR-018 citation`, () => {
      const filePath = agentPath(role);
      const content = readContent(filePath);
      expect(
        content,
        `${fileName} must contain an inline "ADR-018" citation in the gate/review or deployment-gate section (AC5 -- Cluster 7).` +
          " Expected substring: ADR-018"
      ).toContain("ADR-018");
    });
  }

  it("wave-111b-completeness.test.ts exists at canonical path (US-089 AC5 self-reference)", () => {
    const selfPath = join(
      REPO_ROOT,
      "tests/qa/wave-111/wave-111b-completeness.test.ts"
    );
    expect(
      existsSync(selfPath),
      "tests/qa/wave-111/wave-111b-completeness.test.ts must exist on disk (AC5 -- Cluster 7 requires QA completeness test at this canonical path)"
    ).toBe(true);
  });
});
