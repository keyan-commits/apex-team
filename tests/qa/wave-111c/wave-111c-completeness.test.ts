/**
 * Wave 111c -- Completeness regression test (US-090 AC1-AC5)
 *
 * Spec: requirements/user-stories/US-090-wave-111c-ci-process-discipline.md
 * US: US-090 -- Wave 111c CI/Process Discipline
 *               (#240 gh-pr-checks gate, #246 UX-gate-bypass CI,
 *                #301 anomalous-closure playbook, #324 deps verification,
 *                AC5 ADR-018 CI wiring + Wave 111a/111b verdict backfills)
 *
 * Asserts:
 *  AC1 (#240) -- .claude/agents/devsecops.md contains `gh pr checks` in the
 *                merge-protocol section.
 *
 *  AC2 (#246) -- .github/workflows/ux-gate-check.yml exists, contains a
 *                UI-relevant path glob (src/**, design/**), references
 *                coordination/handoffs/ux-designer.md, and contains ADR-018
 *                canonical regex (or equivalent verdict-matching logic).
 *
 *  AC3 (#301) -- .claude/agents/devsecops.md contains the anomalous-closure
 *                playbook section (`anomalous-closure` or
 *                `gh pr merge --delete-branch` playbook); LESSONS.md contains
 *                a matching entry (#301, "anomalous", or
 *                "gh pr merge --delete-branch").
 *
 *  AC4 (#324) -- pnpm-lock.yaml exists and is non-empty (current lockfile
 *                verifies deps are pinned; AC4 closes #324 as clean).
 *
 *  AC5 (ADR-018 CI wiring + backfills) --
 *    a) .github/workflows/pass-verdict-format-check.yml exists.
 *    b) Workflow contains a regex enforcement step.
 *    c) Workflow contains `PR #0` placeholder TTL check with time-based logic.
 *    d) coordination/handoffs/qa.md Wave 111a verdict has been backfilled:
 *       contains `### Wave-111 PASS verdict — PR #386 — SHA <40hex>`
 *       (NOT a PR #0 placeholder for the Wave 111a entry).
 *    e) coordination/handoffs/qa.md Wave 111b verdict has been backfilled:
 *       contains `### Wave-111 PASS verdict — PR #387 — SHA <40hex>`
 *       (NOT a PR #0 placeholder for the Wave 111b entry).
 *    f) Both backfilled verdicts match the ADR-018 canonical regex
 *       (no alpha-suffix per DevSecOps normalization decision; Wave-111
 *       + PR# distinguishes the two entries).
 *
 * Model: tests/qa/wave-111/wave-111b-completeness.test.ts (harness shape).
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
const HANDOFFS_DIR = join(REPO_ROOT, "coordination/handoffs");

// ADR-018 canonical regex (string form for grep-in-JS assertions).
// Heading: ^### Wave-(\d{1,4}) (PASS|REVISE|FAIL) verdict — PR #(\d{1,6}) — SHA ([0-9a-f]{40})$
// Em-dash is U+2014.
const ADR018_CANONICAL_RE =
  /^### Wave-(\d{1,4}) (PASS|REVISE|FAIL) verdict — PR #(\d{1,6}) — SHA ([0-9a-f]{40})$/m;

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

function handoffPath(role: string): string {
  return join(HANDOFFS_DIR, `${role}.md`);
}

// ---------------------------------------------------------------------------
// AC1 (#240) -- `gh pr checks` step in devsecops.md merge protocol
// ---------------------------------------------------------------------------

describe("AC1 (#240) -- gh pr checks step in devsecops.md merge protocol", () => {
  const filePath = agentPath("devsecops");

  it("devsecops.md exists", () => {
    expect(
      existsSync(filePath),
      `devsecops.md not found at ${filePath}`
    ).toBe(true);
  });

  it("devsecops.md contains `gh pr checks` command", () => {
    const content = readContent(filePath);
    expect(
      content,
      "devsecops.md must contain `gh pr checks` in the merge-protocol section (AC1 / #240)"
    ).toMatch(/gh pr checks/);
  });

  it("devsecops.md `gh pr checks` includes --watch flag", () => {
    const content = readContent(filePath);
    expect(
      content,
      "devsecops.md: `gh pr checks` step should include the --watch flag for CI polling (AC1 / #240)"
    ).toMatch(/gh pr checks.*--watch/);
  });

  it("devsecops.md `gh pr checks` is a hard blocker (pending/failing = no merge)", () => {
    const content = readContent(filePath);
    // The step must communicate the blocker semantics — grep for block/blocker language
    // near the gh pr checks command.
    const hasBlocker =
      /gh pr checks[\s\S]{0,400}(block|hard block|do NOT merge|must not merge)/i.test(
        content
      );
    expect(
      hasBlocker,
      "devsecops.md: `gh pr checks` step must include language that pending/failing checks are a hard blocker (AC1 / #240)"
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC2 (#246) -- UX-gate-bypass CI check workflow
// ---------------------------------------------------------------------------

describe("AC2 (#246) -- .github/workflows/ux-gate-check.yml", () => {
  const wfPath = workflowPath("ux-gate-check.yml");

  it("ux-gate-check.yml exists", () => {
    expect(
      existsSync(wfPath),
      `.github/workflows/ux-gate-check.yml not found -- AC2 (#246) requires a UX-gate-bypass CI workflow`
    ).toBe(true);
  });

  it("ux-gate-check.yml contains a UI-relevant path glob (src/**)", () => {
    const content = readContent(wfPath);
    expect(
      content,
      "ux-gate-check.yml must contain a `src/**` path trigger glob (AC2 / #246)"
    ).toMatch(/src\/\*\*/);
  });

  it("ux-gate-check.yml contains a design/** path glob", () => {
    const content = readContent(wfPath);
    expect(
      content,
      "ux-gate-check.yml must contain a `design/**` path trigger glob (AC2 / #246)"
    ).toMatch(/design\/\*\*/);
  });

  it("ux-gate-check.yml references coordination/handoffs/ux-designer.md", () => {
    const content = readContent(wfPath);
    expect(
      content,
      "ux-gate-check.yml must reference `coordination/handoffs/ux-designer.md` as the verdicts file (AC2 / #246)"
    ).toMatch(/coordination\/handoffs\/ux-designer\.md/);
  });

  it("ux-gate-check.yml contains ADR-018 canonical regex or verdict-matching logic", () => {
    const content = readContent(wfPath);
    // The workflow should grep for the canonical Wave-NNN pattern
    const hasCanonicalPattern =
      /Wave-\[0-9\].*PASS.*verdict/.test(content) ||
      /Wave-\[0-9\].*REVISE.*FAIL/.test(content) ||
      /PASS\|REVISE\|FAIL/.test(content);
    expect(
      hasCanonicalPattern,
      "ux-gate-check.yml must contain ADR-018 canonical verdict regex (PASS|REVISE|FAIL pattern, Wave-NNN shape) (AC2 / #246)"
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC3 (#301) -- Anomalous-closure playbook in devsecops.md + LESSONS.md
// ---------------------------------------------------------------------------

describe("AC3 (#301) -- anomalous-closure playbook", () => {
  const dsPath = agentPath("devsecops");
  const lessonsPath = join(REPO_ROOT, "LESSONS.md");

  it("devsecops.md contains anomalous-closure section or `gh pr merge --delete-branch` playbook", () => {
    const content = readContent(dsPath);
    const hasPlaybook =
      content.includes("anomalous-closure") ||
      content.includes("gh pr merge --delete-branch");
    expect(
      hasPlaybook,
      "devsecops.md must contain an anomalous-closure playbook section (AC3 / #301)"
    ).toBe(true);
  });

  it("devsecops.md anomalous-closure section includes detection step (gh pr view ... mergeCommit)", () => {
    const content = readContent(dsPath);
    // The playbook should describe how to detect the anomaly
    const hasDetection =
      /mergeCommit|merge_commit|gh pr view/.test(content) &&
      /anomalous|closed.*null|null.*closed/.test(content);
    expect(
      hasDetection,
      "devsecops.md anomalous-closure playbook must include detection steps (gh pr view mergeCommit null check) (AC3 / #301)"
    ).toBe(true);
  });

  it("devsecops.md anomalous-closure section includes recovery step (reopen or reflog)", () => {
    const content = readContent(dsPath);
    const hasRecovery =
      /gh pr reopen|reflog|reopen/.test(content);
    expect(
      hasRecovery,
      "devsecops.md anomalous-closure playbook must include a recovery step (gh pr reopen / reflog) (AC3 / #301)"
    ).toBe(true);
  });

  it("LESSONS.md exists", () => {
    expect(
      existsSync(lessonsPath),
      `LESSONS.md not found at ${lessonsPath}`
    ).toBe(true);
  });

  it("LESSONS.md contains an anomalous-closure / #301 entry", () => {
    const content = readContent(lessonsPath);
    const hasEntry =
      content.includes("#301") ||
      content.includes("anomalous") ||
      content.includes("gh pr merge --delete-branch");
    expect(
      hasEntry,
      "LESSONS.md must contain a matching entry for the anomalous-closure finding (#301) (AC3)"
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC4 (#324) -- Deps verification (lockfile present + non-empty)
// ---------------------------------------------------------------------------

describe("AC4 (#324) -- deps verification (lockfile clean)", () => {
  const lockfilePath = join(REPO_ROOT, "pnpm-lock.yaml");

  it("pnpm-lock.yaml exists", () => {
    expect(
      existsSync(lockfilePath),
      `pnpm-lock.yaml not found at ${lockfilePath} -- lockfile must be committed (AC4 / #324)`
    ).toBe(true);
  });

  it("pnpm-lock.yaml is non-empty (deps are pinned)", () => {
    const content = readContent(lockfilePath);
    expect(
      content.trim().length,
      "pnpm-lock.yaml is empty -- lockfile must contain pinned dependency entries (AC4 / #324)"
    ).toBeGreaterThan(100);
  });

  it("pnpm-lock.yaml contains lockfileVersion header", () => {
    const content = readContent(lockfilePath);
    expect(
      content,
      "pnpm-lock.yaml must start with a lockfileVersion header (AC4 / #324)"
    ).toMatch(/lockfileVersion/);
  });
});

// ---------------------------------------------------------------------------
// AC5 -- ADR-018 CI wiring + Wave 111a/111b verdict backfills
// ---------------------------------------------------------------------------

describe("AC5 -- .github/workflows/pass-verdict-format-check.yml existence and content", () => {
  const wfPath = workflowPath("pass-verdict-format-check.yml");

  it("pass-verdict-format-check.yml exists", () => {
    expect(
      existsSync(wfPath),
      ".github/workflows/pass-verdict-format-check.yml not found -- AC5 requires an ADR-018 CI wiring workflow"
    ).toBe(true);
  });

  it("pass-verdict-format-check.yml contains a regex enforcement step", () => {
    const content = readContent(wfPath);
    // The workflow must include the ADR-018 canonical regex pattern
    const hasRegex =
      /CANONICAL_PATTERN|Wave-\[0-9\].*PASS\|REVISE\|FAIL|verdict.*format.*check/i.test(
        content
      );
    expect(
      hasRegex,
      "pass-verdict-format-check.yml must contain a regex enforcement step for ADR-018 canonical format (AC5)"
    ).toBe(true);
  });

  it("pass-verdict-format-check.yml contains PR #0 placeholder TTL check", () => {
    const content = readContent(wfPath);
    expect(
      content,
      "pass-verdict-format-check.yml must contain `PR #0` placeholder handling (AC5)"
    ).toMatch(/PR #0/);
  });

  it("pass-verdict-format-check.yml TTL check uses time-based logic (grace seconds / 1h)", () => {
    const content = readContent(wfPath);
    const hasTimeBased =
      /3600|GRACE|1h|1 hour|TTL/.test(content);
    expect(
      hasTimeBased,
      "pass-verdict-format-check.yml TTL check must use time-based logic (grace period ~1h = 3600s) (AC5)"
    ).toBe(true);
  });
});

describe("AC5 -- coordination/handoffs/qa.md Wave 111a verdict backfilled (PR #386)", () => {
  const qaHandoffPath = handoffPath("qa");

  // ADR-018 canonical pattern for a specific PR number and partial SHA prefix
  // Wave 111a: PR #386, merge SHA starts a16c924739eddf928f63a257abdd77fbfa6fb1f8

  it("qa.md contains a Wave-111 PASS verdict heading for PR #386", () => {
    const content = readContent(qaHandoffPath);
    expect(
      content,
      "qa.md must contain a backfilled Wave-111 PASS verdict for PR #386 (Wave 111a) (AC5)"
    ).toMatch(
      /^### Wave-111 PASS verdict — PR #386 — SHA [0-9a-f]{40}$/m
    );
  });

  it("qa.md Wave 111a verdict is NOT a PR #0 placeholder (backfill confirmed)", () => {
    const content = readContent(qaHandoffPath);
    // The Wave 111a entry MUST use PR #386 (real PR number after backfill).
    // Approach: confirm PR #386 is present — already asserted above.
    // Secondary check: the two PREV blocks (Wave 111a and 111b) do not
    // contain PR #0 verdicts. We scope this to PREV sections only, since
    // the NOW block may legitimately hold a PR #0 placeholder for the
    // current wave per ADR-018 Wave 111b amendment.
    //
    // Heuristic: split on "## PREV" markers and verify that no PREV block
    // heading contains "Wave-111 PASS verdict — PR #0 —".
    const prevBlocks = content.split(/^## PREV/m).slice(1);
    for (const block of prevBlocks) {
      const hasPr0InPrev = /^### Wave-111 PASS verdict — PR #0 — SHA [0-9a-f]{40}$/m.test(
        block
      );
      expect(
        hasPr0InPrev,
        "qa.md PREV blocks must NOT contain Wave-111 PASS verdicts with PR #0 placeholder -- DevSecOps should have backfilled Wave 111a (PR #386) and Wave 111b (PR #387) (AC5)"
      ).toBe(false);
    }
  });

  it("qa.md Wave 111a verdict SHA is the correct full 40-char hex (PR #386 merge SHA)", () => {
    const content = readContent(qaHandoffPath);
    // The Wave 111a merge SHA is a16c924739eddf928f63a257abdd77fbfa6fb1f8
    expect(
      content,
      "qa.md Wave 111a (PR #386) verdict must contain the correct merge SHA a16c924739eddf928f63a257abdd77fbfa6fb1f8 (AC5)"
    ).toMatch(
      /^### Wave-111 PASS verdict — PR #386 — SHA a16c924739eddf928f63a257abdd77fbfa6fb1f8$/m
    );
  });

  it("qa.md Wave 111a verdict heading matches ADR-018 canonical regex", () => {
    const content = readContent(qaHandoffPath);
    const lines = content.split("\n");
    const wave111aLine = lines.find(
      (l) =>
        l.includes("Wave-111") &&
        l.includes("PR #386") &&
        l.includes("PASS verdict")
    );
    expect(
      wave111aLine,
      "qa.md must have a Wave-111 PASS verdict line referencing PR #386 (AC5)"
    ).toBeDefined();
    expect(
      ADR018_CANONICAL_RE.test((wave111aLine ?? "") + "\n"),
      `qa.md Wave 111a verdict line does NOT match ADR-018 canonical regex:\n  "${wave111aLine}"\nExpected: ^### Wave-NNN (PASS|REVISE|FAIL) verdict — PR #NNN — SHA <40hex>$ (AC5)`
    ).toBe(true);
  });
});

describe("AC5 -- coordination/handoffs/qa.md Wave 111b verdict backfilled (PR #387)", () => {
  const qaHandoffPath = handoffPath("qa");

  // Wave 111b: PR #387, merge SHA ba0905fc75ca9788cef538e0eab078040336384a

  it("qa.md contains a Wave-111 PASS verdict heading for PR #387", () => {
    const content = readContent(qaHandoffPath);
    expect(
      content,
      "qa.md must contain a backfilled Wave-111 PASS verdict for PR #387 (Wave 111b) (AC5)"
    ).toMatch(
      /^### Wave-111 PASS verdict — PR #387 — SHA [0-9a-f]{40}$/m
    );
  });

  it("qa.md Wave 111b verdict SHA is the correct full 40-char hex (PR #387 merge SHA)", () => {
    const content = readContent(qaHandoffPath);
    // The Wave 111b merge SHA is ba0905fc75ca9788cef538e0eab078040336384a
    expect(
      content,
      "qa.md Wave 111b (PR #387) verdict must contain the correct merge SHA ba0905fc75ca9788cef538e0eab078040336384a (AC5)"
    ).toMatch(
      /^### Wave-111 PASS verdict — PR #387 — SHA ba0905fc75ca9788cef538e0eab078040336384a$/m
    );
  });

  it("qa.md Wave 111b verdict heading uses Wave-111 (not Wave 111b alpha-suffix)", () => {
    const content = readContent(qaHandoffPath);
    // DevSecOps normalized: no alpha-suffix allowed per normalization decision
    const alphaLine = content.match(
      /^### Wave[-\s]111b\s+(PASS|REVISE|FAIL)\s+verdict/m
    );
    expect(
      alphaLine,
      "qa.md Wave 111b verdict must use canonical `Wave-111` form (no alpha-suffix) per DevSecOps normalization (AC5)"
    ).toBeNull();
  });

  it("qa.md Wave 111b verdict heading matches ADR-018 canonical regex", () => {
    const content = readContent(qaHandoffPath);
    const lines = content.split("\n");
    const wave111bLine = lines.find(
      (l) =>
        l.includes("Wave-111") &&
        l.includes("PR #387") &&
        l.includes("PASS verdict")
    );
    expect(
      wave111bLine,
      "qa.md must have a Wave-111 PASS verdict line referencing PR #387 (AC5)"
    ).toBeDefined();
    expect(
      ADR018_CANONICAL_RE.test((wave111bLine ?? "") + "\n"),
      `qa.md Wave 111b verdict line does NOT match ADR-018 canonical regex:\n  "${wave111bLine}"\nExpected: ^### Wave-NNN (PASS|REVISE|FAIL) verdict — PR #NNN — SHA <40hex>$ (AC5)`
    ).toBe(true);
  });
});
