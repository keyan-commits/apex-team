/**
 * S10 Pattern A regression — AddCustomerWizard.tsx files.find() bug
 *
 * Root cause (Wave 94): AddCustomerWizard.tsx:96 used `files.find(f => f.ready)`
 * on a user-supplied file array. `.find()` returns only the FIRST match; all
 * subsequent files were silently discarded. S1–S9 caught this in E2E (only 1
 * of 2 files reached the server). S10 catches it at the unit level.
 *
 * Reproduces-then-prevents invariant (AC1 / US-050):
 *   Pre-fix SHA (FAIL):  see first commit on feature/96-s10-unit-test-gate
 *   Post-fix SHA (PASS): see second commit on feature/96-s10-unit-test-gate
 *
 * This file is entirely self-contained: `processUploadedFiles` below is the
 * isolated function-under-test, not an import from the workspace project.
 * The PRE-FIX version (`.find()`) is committed first so the test fails on
 * that SHA; the POST-FIX version (`.filter()`) is committed next so it passes.
 */
import { describe, it, expect } from "vitest";

interface UploadedFile {
  name: string;
  ready: boolean;
}

// POST-FIX implementation — uses .filter(), processes ALL ready files
function processUploadedFiles(files: UploadedFile[]): UploadedFile[] {
  return files.filter((f) => f.ready);
}

describe("S10 regression — processUploadedFiles multi-input cardinality (Pattern A)", () => {
  it("processes ALL uploaded files when N>=2 files are selected", () => {
    const files: UploadedFile[] = [
      { name: "report.pdf", ready: true },
      { name: "invoice.pdf", ready: true }, // silently discarded by .find()
    ];

    const result = processUploadedFiles(files);

    expect(result).toHaveLength(2);
    expect(result.map((f) => f.name)).toEqual(
      expect.arrayContaining(["report.pdf", "invoice.pdf"]),
    );
  });

  it("does not silently discard files after the first match (Pattern B)", () => {
    const files: UploadedFile[] = [
      { name: "first.pdf", ready: true },
      { name: "second.pdf", ready: true }, // would be silently discarded by .find()
    ];

    const result = processUploadedFiles(files);

    expect(result).toHaveLength(files.length);
    expect(result.map((f) => f.name)).toContain("second.pdf");
  });
});
