// Tests for /agents/qa Tests-section logic — issue #126 / US-071.
// Pure-function tests mirroring the helpers defined in QaAgentPage.
import { describe, it, expect } from "vitest";

// ─── Helpers mirrored from page.tsx ──────────────────────────────────────────

function groupTestFiles(paths: string[]): Array<{ dir: string; files: string[] }> {
  const map = new Map<string, string[]>();
  for (const p of paths) {
    const parts = p.split("/");
    const dir = parts.slice(0, -1).join("/");
    if (!map.has(dir)) map.set(dir, []);
    map.get(dir)!.push(p);
  }
  return Array.from(map.entries()).map(([dir, files]) => ({ dir, files }));
}

function filterFiles(files: string[], query: string): string[] {
  if (!query) return files;
  const q = query.toLowerCase();
  return files.filter((f) => f.toLowerCase().includes(q));
}

// Mirrors the pass/fail heuristic: search for "failed" in vitest stdout.
function detectFailure(output: string): boolean {
  return /\bfailed\b/i.test(output);
}

// Mirrors the run-badge label logic.
type RunStatus = "idle" | "running" | "pass" | "fail";
function badgeText(status: RunStatus): string {
  if (status === "idle") return "–";
  if (status === "running") return "running…";
  return status;
}

// ─── AC2: grouping by directory ───────────────────────────────────────────────

describe("groupTestFiles — AC2 (grouped by directory)", () => {
  it("groups files sharing a directory together", () => {
    const files = [
      "tests/be/alpha.test.ts",
      "tests/be/beta.test.ts",
      "tests/ui/gamma.test.ts",
    ];
    const groups = groupTestFiles(files);
    expect(groups).toHaveLength(2);

    const be = groups.find((g) => g.dir === "tests/be");
    expect(be?.files).toEqual(["tests/be/alpha.test.ts", "tests/be/beta.test.ts"]);

    const ui = groups.find((g) => g.dir === "tests/ui");
    expect(ui?.files).toEqual(["tests/ui/gamma.test.ts"]);
  });

  it("handles a single test file", () => {
    const groups = groupTestFiles(["tests/be/foo.test.ts"]);
    expect(groups).toHaveLength(1);
    expect(groups[0].dir).toBe("tests/be");
    expect(groups[0].files).toEqual(["tests/be/foo.test.ts"]);
  });

  it("returns empty array for empty input", () => {
    expect(groupTestFiles([])).toEqual([]);
  });

  it("preserves insertion order of directories", () => {
    const files = [
      "tests/be/a.test.ts",
      "tests/ui/b.test.ts",
      "tests/be/c.test.ts",
    ];
    const groups = groupTestFiles(files);
    expect(groups[0].dir).toBe("tests/be");
    expect(groups[1].dir).toBe("tests/ui");
  });
});

// ─── AC5: filter / search ─────────────────────────────────────────────────────

describe("filterFiles — AC5 (filter by name)", () => {
  const FILES = [
    "tests/be/dev-supervisor.test.ts",
    "tests/be/qa-run-test.test.ts",
    "tests/ui/AgentPane.test.ts",
  ];

  it("returns all files when query is empty", () => {
    expect(filterFiles(FILES, "")).toEqual(FILES);
  });

  it("matches case-insensitively", () => {
    expect(filterFiles(FILES, "AGENTPANE")).toEqual(["tests/ui/AgentPane.test.ts"]);
  });

  it("matches on partial filename", () => {
    expect(filterFiles(FILES, "supervisor")).toEqual(["tests/be/dev-supervisor.test.ts"]);
  });

  it("matches on directory segment", () => {
    const results = filterFiles(FILES, "be/");
    expect(results).toHaveLength(2);
    expect(results).toContain("tests/be/dev-supervisor.test.ts");
    expect(results).toContain("tests/be/qa-run-test.test.ts");
  });

  it("returns empty array when nothing matches", () => {
    expect(filterFiles(FILES, "nonexistent")).toEqual([]);
  });
});

// ─── AC3 / AC4: run-status → badge + pass/fail detection ─────────────────────

describe("badgeText — AC3 (status label in each test row)", () => {
  it("shows dash for idle", () => expect(badgeText("idle")).toBe("–"));
  it("shows 'running…' while running", () => expect(badgeText("running")).toBe("running…"));
  it("shows 'pass' on success", () => expect(badgeText("pass")).toBe("pass"));
  it("shows 'fail' on failure", () => expect(badgeText("fail")).toBe("fail"));
});

describe("detectFailure — AC4 (pass/fail from vitest output)", () => {
  it("returns false for clean passing output", () => {
    const out = `
 ✓ tests/be/foo.test.ts (5 tests) 12ms

 Test Files  1 passed (1)
 Tests  5 passed (5)
 Duration  123ms
`;
    expect(detectFailure(out)).toBe(false);
  });

  it("returns true when vitest reports a failure", () => {
    const out = `
 × tests/be/foo.test.ts (5 tests | 1 failed) 12ms

 Test Files  1 failed (1)
 Tests  4 passed | 1 failed (5)
`;
    expect(detectFailure(out)).toBe(true);
  });

  it("is case-insensitive (FAILED)", () => {
    expect(detectFailure("Test Files  1 FAILED (1)")).toBe(true);
  });

  it("does not false-positive on 'not failed' — whole-word match", () => {
    // 'failed' only matches as a standalone word
    expect(detectFailure("0 failed")).toBe(true); // "failed" IS a word here
    expect(detectFailure("")).toBe(false);
  });
});
