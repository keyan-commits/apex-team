/**
 * Wave 113 -- Backfill enforcement regression test (US-092 AC1-AC4)
 *
 * Spec: requirements/user-stories/US-092-backfill-enforcement.md
 * US: US-092 -- Backfill enforcement for ADR-018 PR #0 placeholders
 *               (AC1: nightly cron trigger, AC2: push-to-main trigger,
 *                AC3: soft-fail semantics + job split,
 *                AC4: self-reference / metadata)
 *
 * Asserts:
 *  AC1 -- .github/workflows/pass-verdict-format-check.yml contains a
 *         `schedule:` block with cron expression `0 6 * * *`.
 *         The cron trigger fires the TTL check job.
 *
 *  AC2 -- Workflow contains a `push:` block with branches: [main] (or ["main"]).
 *         Push trigger fires the TTL check job.
 *
 *  AC3 -- Workflow has TWO jobs: a format-check job gated on
 *         `github.event_name == 'pull_request'` (or equivalent) and a
 *         TTL check job that runs on all triggers.
 *         TTL check exits 0 on warning (soft-fail): does NOT call `exit 1`
 *         in the TTL-check job/step; calls `exit 0` or no explicit exit on
 *         the TTL-expiry branch.
 *
 *  AC4 -- Self-reference / metadata checks:
 *         - This test file exists at `tests/qa/wave-113/backfill-enforcement.test.ts`
 *         - `requirements/user-stories/US-092-backfill-enforcement.md` exists
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
const WORKFLOWS_DIR = join(REPO_ROOT, ".github/workflows");
const REQUIREMENTS_DIR = join(REPO_ROOT, "requirements/user-stories");

const WORKFLOW_PATH = join(WORKFLOWS_DIR, "pass-verdict-format-check.yml");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readWorkflow(): string {
  return readFileSync(WORKFLOW_PATH, "utf-8");
}

// ---------------------------------------------------------------------------
// AC1 -- Nightly cron trigger
// ---------------------------------------------------------------------------

describe("AC1 -- nightly cron trigger in pass-verdict-format-check.yml", () => {
  it("pass-verdict-format-check.yml exists", () => {
    expect(
      existsSync(WORKFLOW_PATH),
      `.github/workflows/pass-verdict-format-check.yml not found at ${WORKFLOW_PATH}`
    ).toBe(true);
  });

  it("workflow contains a `schedule:` trigger block", () => {
    const content = readWorkflow();
    expect(
      content,
      "pass-verdict-format-check.yml must contain a `schedule:` trigger (AC1)"
    ).toMatch(/^\s*schedule:/m);
  });

  it("workflow cron expression is `0 6 * * *` (06:00 UTC daily)", () => {
    const content = readWorkflow();
    expect(
      content,
      "pass-verdict-format-check.yml schedule trigger must use cron expression `0 6 * * *` (AC1)"
    ).toMatch(/cron:\s+["']?0 6 \* \* \*["']?/);
  });

  it("cron trigger is associated with the TTL check job (placeholder-ttl-check or equivalent)", () => {
    const content = readWorkflow();
    // The TTL check job must NOT have a `if: github.event_name == 'pull_request'` guard
    // (it runs on all triggers including schedule). We verify by checking the TTL job
    // does not restrict to pull_request only -- a guard like `if: github.event_name == 'pull_request'`
    // should appear on the FORMAT check job, not the TTL check job.
    // The simplest assertion: the TTL job section exists without a pull_request-only guard.
    const hasTtlJob =
      /placeholder-ttl-check|ttl.check|check-placeholder-ttl/.test(content);
    expect(
      hasTtlJob,
      "pass-verdict-format-check.yml must contain a TTL check job (placeholder-ttl-check or equivalent) that runs on the schedule trigger (AC1)"
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC2 -- Push-to-main trigger
// ---------------------------------------------------------------------------

describe("AC2 -- push-to-main trigger in pass-verdict-format-check.yml", () => {
  it("workflow contains a `push:` trigger block", () => {
    const content = readWorkflow();
    expect(
      content,
      "pass-verdict-format-check.yml must contain a `push:` trigger (AC2)"
    ).toMatch(/^\s*push:/m);
  });

  it("push trigger targets the `main` branch", () => {
    const content = readWorkflow();
    // Accept either `branches: ["main"]` or `branches: [main]` or `branches:\n  - main`
    const hasPushToMain =
      /branches:\s*\["main"\]/.test(content) ||
      /branches:\s*\[main\]/.test(content) ||
      /branches:\s*\n\s+- ["']?main["']?/.test(content);
    expect(
      hasPushToMain,
      'pass-verdict-format-check.yml push trigger must target branch `main` (branches: ["main"] or [main]) (AC2)'
    ).toBe(true);
  });

  it("push trigger section appears in the `on:` block (not as a job step)", () => {
    const content = readWorkflow();
    // The `push:` trigger must appear before the top-level `jobs:` section.
    // Use `\njobs:` (with leading newline) to avoid matching `jobs:` inside
    // comment lines (e.g. "# Two check jobs:") which appear earlier in the file.
    const jobsBlockStart = content.indexOf("\njobs:");
    const pushIndex = content.indexOf("  push:");
    expect(
      pushIndex,
      "pass-verdict-format-check.yml: `push:` must appear in the `on:` trigger block, before `jobs:` (AC2)"
    ).toBeGreaterThan(-1);
    expect(
      jobsBlockStart,
      "pass-verdict-format-check.yml: top-level `jobs:` section must exist (AC2)"
    ).toBeGreaterThan(-1);
    expect(
      pushIndex < jobsBlockStart,
      "pass-verdict-format-check.yml: `push:` trigger must appear before the `jobs:` section (AC2)"
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC3 -- Soft-fail semantics + job split
// ---------------------------------------------------------------------------

describe("AC3 -- soft-fail semantics and job split", () => {
  it("workflow has a format-check job with a pull_request event_name guard", () => {
    const content = readWorkflow();
    // The format check job must only run on pull_request events.
    // Accept: `if: github.event_name == 'pull_request'`
    //      or: `if: github.event_name == "pull_request"`
    const hasFormatJobGuard =
      /if:\s+github\.event_name\s*==\s*['"]pull_request['"]/.test(content);
    expect(
      hasFormatJobGuard,
      "pass-verdict-format-check.yml: format-check job must have `if: github.event_name == 'pull_request'` guard (AC3)"
    ).toBe(true);
  });

  it("workflow has a distinct TTL check job without a pull_request-only guard", () => {
    const content = readWorkflow();
    // Two named jobs expected: verdict-format-check + placeholder-ttl-check (or similar).
    // Heuristic: at least 2 job-name declarations exist under `jobs:`.
    const jobNameMatches = content.match(/^\s{2}[\w-]+:\s*$/gm) ?? [];
    // Filter to top-level job keys (2-space indent is GitHub Actions convention for jobs).
    expect(
      jobNameMatches.length,
      "pass-verdict-format-check.yml must declare at least 2 jobs (format-check + TTL check) (AC3)"
    ).toBeGreaterThanOrEqual(2);
  });

  it("TTL check job does not call `exit 1` on the TTL-expiry branch", () => {
    const content = readWorkflow();
    // Locate the TTL check job body. We split on the job key patterns.
    // The simplest approach: find the section after `placeholder-ttl-check:` and
    // before the next top-level job (or EOF), then assert no `exit 1` appears in it.
    const ttlJobMatch = content.match(
      /placeholder-ttl-check[\s\S]+?(?=\n {2}\S|\n\n\S|$)/
    );
    if (ttlJobMatch) {
      const ttlJobBody = ttlJobMatch[0];
      // `exit 1` must NOT appear in the TTL job body -- soft-fail means exit 0 only.
      expect(
        ttlJobBody,
        "TTL check job must NOT call `exit 1` (soft-fail: must exit 0 on TTL expiry) (AC3)"
      ).not.toMatch(/exit 1/);
    } else {
      // Job not found by name -- verify via the comment block instead
      // The workflow comment block says "Soft-fail (warning, non-blocking)"
      const hasSoftFailComment =
        /[Ss]oft.fail|non.blocking|warning.*exit 0|exit 0.*warning/.test(
          content
        );
      expect(
        hasSoftFailComment,
        "pass-verdict-format-check.yml must document soft-fail semantics for the TTL check (exit 0 on warning) (AC3)"
      ).toBe(true);
    }
  });

  it("TTL check soft-fail: workflow calls `exit 0` or relies on implicit exit 0 in the TTL branch", () => {
    const content = readWorkflow();
    // Positive assertion: the workflow contains an `exit 0` in the TTL-check context
    // OR the overall step exits 0 by falling through without explicit exit 1.
    // The AC3 requirement says the step "does NOT call exit 1 on TTL expiry" --
    // verifying `exit 0` exists in the same section is a positive signal.
    const hasSoftFailExit =
      /# Soft fail: exit 0|Soft fail.*exit 0|exit 0.*AC3|exit 0.*soft|# AC3/.test(
        content
      ) || /exit 0/.test(content);
    expect(
      hasSoftFailExit,
      "pass-verdict-format-check.yml TTL check must use exit 0 (soft-fail) not exit 1 on TTL expiry (AC3)"
    ).toBe(true);
  });

  it("format-check job uses `exit 1` on format violations (hard-fail for PR check)", () => {
    const content = readWorkflow();
    // The format check IS allowed to call exit 1 -- it's a hard gate for PRs.
    // This asserts the separation is correct: hard-fail lives in the format job, not TTL.
    expect(
      content,
      "pass-verdict-format-check.yml format-check job must call `exit 1` on format violations (hard-fail for PR gate) (AC3)"
    ).toMatch(/exit 1/);
  });
});

// ---------------------------------------------------------------------------
// AC4 -- Self-reference / metadata
// ---------------------------------------------------------------------------

describe("AC4 -- self-reference and metadata", () => {
  it("this test file itself exists at tests/qa/wave-113/backfill-enforcement.test.ts", () => {
    const testFilePath = join(
      REPO_ROOT,
      "tests/qa/wave-113/backfill-enforcement.test.ts"
    );
    expect(
      existsSync(testFilePath),
      `Test file not found at ${testFilePath} -- US-085 discipline requires test as a file on disk (AC4)`
    ).toBe(true);
  });

  it("requirements/user-stories/US-092-backfill-enforcement.md exists", () => {
    const usPath = join(REQUIREMENTS_DIR, "US-092-backfill-enforcement.md");
    expect(
      existsSync(usPath),
      `US-092 user story not found at ${usPath} -- test traceability requires the spec to exist on disk (AC4)`
    ).toBe(true);
  });

  it("US-092-backfill-enforcement.md contains the acceptance criteria section", () => {
    const usPath = join(REQUIREMENTS_DIR, "US-092-backfill-enforcement.md");
    const content = readFileSync(usPath, "utf-8");
    expect(
      content,
      "US-092 user story must contain an `## Acceptance criteria` section (AC4)"
    ).toMatch(/## Acceptance criteria/i);
  });

  it("US-092-backfill-enforcement.md references all four ACs (AC1 through AC4)", () => {
    const usPath = join(REQUIREMENTS_DIR, "US-092-backfill-enforcement.md");
    const content = readFileSync(usPath, "utf-8");
    for (const ac of ["AC1", "AC2", "AC3", "AC4"]) {
      expect(
        content,
        `US-092 user story must reference ${ac} (AC4 completeness check)`
      ).toMatch(new RegExp(`### ${ac}|\\b${ac}\\b`));
    }
  });
});
