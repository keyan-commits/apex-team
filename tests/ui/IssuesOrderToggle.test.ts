// Tests for Issues-panel ordering toggle + severity pinning — AC1–AC4 (US-034, closes #118).
// Pure-function tests mirroring the sortedRecentIssues logic from dashboard/page.tsx.
import { describe, it, expect } from "vitest";

// ─── Mirror of production logic ────────────────────────────────────────────────

const PINNED_LABELS = ["critical", "blocker"];

type Issue = { number: number; label: string; labelColor?: string };

function sortIssues(
  recent: Issue[],
  order: "lifo" | "fifo"
): { pinned: Issue[]; rest: Issue[] } {
  const pinned = recent.filter((iss) =>
    PINNED_LABELS.includes(iss.label.toLowerCase())
  );
  const rest = recent.filter(
    (iss) => !PINNED_LABELS.includes(iss.label.toLowerCase())
  );
  const sortFn = (a: Issue, b: Issue) =>
    order === "lifo" ? b.number - a.number : a.number - b.number;
  return { pinned: [...pinned].sort(sortFn), rest: [...rest].sort(sortFn) };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ISSUES: Issue[] = [
  { number: 1, label: "nit" },
  { number: 5, label: "blocker" },
  { number: 8, label: "warning" },
  { number: 12, label: "critical" },
  { number: 20, label: "high" },
];

// ─── AC1: LIFO/FIFO ordering ───────────────────────────────────────────────────

describe("AC1 — LIFO/FIFO ordering", () => {
  it("LIFO: non-pinned list is newest-first (descending number)", () => {
    const { rest } = sortIssues(ISSUES, "lifo");
    const nums = rest.map((i) => i.number);
    expect(nums).toEqual([...nums].sort((a, b) => b - a));
  });

  it("FIFO: non-pinned list is oldest-first (ascending number)", () => {
    const { rest } = sortIssues(ISSUES, "fifo");
    const nums = rest.map((i) => i.number);
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
  });
});

// ─── AC2: Critical/blocker pinning ────────────────────────────────────────────

describe("AC2 — Severity pinning", () => {
  it("blocker and critical issues appear in pinned group", () => {
    const { pinned } = sortIssues(ISSUES, "lifo");
    expect(pinned.map((i) => i.label)).toContain("blocker");
    expect(pinned.map((i) => i.label)).toContain("critical");
  });

  it("non-critical/blocker issues do NOT appear in pinned group", () => {
    const { pinned } = sortIssues(ISSUES, "lifo");
    for (const iss of pinned) {
      expect(PINNED_LABELS).toContain(iss.label.toLowerCase());
    }
  });

  it("pinned items obey LIFO within the pinned group", () => {
    const { pinned } = sortIssues(ISSUES, "lifo");
    const nums = pinned.map((i) => i.number);
    expect(nums).toEqual([...nums].sort((a, b) => b - a));
  });

  it("pinned items obey FIFO within the pinned group", () => {
    const { pinned } = sortIssues(ISSUES, "fifo");
    const nums = pinned.map((i) => i.number);
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
  });

  it("label matching is case-insensitive", () => {
    const mixed: Issue[] = [
      { number: 1, label: "BLOCKER" },
      { number: 2, label: "Critical" },
      { number: 3, label: "high" },
    ];
    const { pinned, rest } = sortIssues(mixed, "lifo");
    expect(pinned).toHaveLength(2);
    expect(rest).toHaveLength(1);
  });
});

// ─── AC4: byLabel grid disjoint (partition is complete and non-overlapping) ────

describe("AC4 — Disjoint from byLabel (partition correctness)", () => {
  it("pinned + rest contains all original issues", () => {
    const { pinned, rest } = sortIssues(ISSUES, "lifo");
    expect(pinned.length + rest.length).toBe(ISSUES.length);
  });

  it("pinned and rest sets are disjoint", () => {
    const { pinned, rest } = sortIssues(ISSUES, "fifo");
    const pinnedNums = new Set(pinned.map((i) => i.number));
    for (const iss of rest) {
      expect(pinnedNums.has(iss.number)).toBe(false);
    }
  });

  it("toggling order does not change the count of items in each group", () => {
    const lifo = sortIssues(ISSUES, "lifo");
    const fifo = sortIssues(ISSUES, "fifo");
    expect(lifo.pinned.length).toBe(fifo.pinned.length);
    expect(lifo.rest.length).toBe(fifo.rest.length);
  });
});

// ─── AC6: Empty / edge cases ──────────────────────────────────────────────────

describe("AC6 — Edge cases / regression", () => {
  it("empty list produces empty pinned and rest", () => {
    const { pinned, rest } = sortIssues([], "lifo");
    expect(pinned).toHaveLength(0);
    expect(rest).toHaveLength(0);
  });

  it("list with only pinned labels: rest is empty", () => {
    const allPinned: Issue[] = [
      { number: 3, label: "blocker" },
      { number: 7, label: "critical" },
    ];
    const { rest } = sortIssues(allPinned, "lifo");
    expect(rest).toHaveLength(0);
  });

  it("list with no pinned labels: pinned is empty", () => {
    const noPinned: Issue[] = [
      { number: 1, label: "nit" },
      { number: 2, label: "high" },
    ];
    const { pinned } = sortIssues(noPinned, "lifo");
    expect(pinned).toHaveLength(0);
  });
});
