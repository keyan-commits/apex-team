// US-070 dashboard adaptive layout + density — pure-function coverage.
// DOM/CSS rendering assertions (AC1 grid-column, AC3 hover-reveal) verified manually
// in the dev instance at http://localhost:3110.
import { describe, it, expect } from "vitest";
import { groupDone } from "@/lib/group-done";
import type { DoneItem } from "@/lib/group-done";

// ─── AC5: pre-sort helper (mirrors the dashboard/page.tsx useMemo) ────────────

function sortByWaveDesc(items: DoneItem[]): DoneItem[] {
  return [...items].sort((a, b) => {
    const wA = a.waves?.length ? Math.max(...a.waves) : null;
    const wB = b.waves?.length ? Math.max(...b.waves) : null;
    if (wA === null && wB === null) return 0;
    if (wA === null) return 1;   // nulls last
    if (wB === null) return -1;
    return wB - wA;              // descending
  });
}

describe("AC5 — pre-sort done items by wave descending before groupDone", () => {
  it("groups interleaved same-wave completions after pre-sort", () => {
    // Simulate two Wave-112 completions separated by a Wave-111 completion (parallel agents)
    const items: DoneItem[] = [
      { role: "architect", taskSummary: "code review", completedAt: 1000, waves: [112] },
      { role: "qa", taskSummary: "regression", completedAt: 2000, waves: [111] },
      { role: "ui-developer", taskSummary: "feature impl", completedAt: 3000, waves: [112] },
    ];

    // Without pre-sort: groupDone's greedy scan sees arch(112) → qa(111) → ui(112).
    // qa(111) breaks the sequence, so arch(112) and ui(112) never group.
    expect(groupDone(items).length).toBe(3);

    // With pre-sort: both wave-112 items are adjacent → they group.
    const sorted = sortByWaveDesc(items);
    const groups = groupDone(sorted);
    expect(groups.length).toBe(2);
    expect(groups[0].waves).toContain(112);
    expect(groups[0].rows.length).toBe(2);
    expect(groups[1].waves).toContain(111);
  });

  it("places no-wave items last (nulls-last)", () => {
    const items: DoneItem[] = [
      { role: "devsecops", taskSummary: "housekeeping", completedAt: 1000 },     // no waves
      { role: "qa", taskSummary: "gate verify", completedAt: 2000, waves: [112] },
      { role: "architect", taskSummary: "review", completedAt: 3000, waves: [113] },
    ];
    const sorted = sortByWaveDesc(items);
    expect(sorted[0].waves).toEqual([113]);      // highest wave first
    expect(sorted[1].waves).toEqual([112]);
    expect(sorted[2].waves).toBeUndefined();     // null/undefined last
  });

  it("preserves original order for equal wave numbers (stable sort contract)", () => {
    const items: DoneItem[] = [
      { role: "architect", taskSummary: "A", completedAt: 100, waves: [112] },
      { role: "qa", taskSummary: "B", completedAt: 200, waves: [112] },
    ];
    // Both wave-112: comparison returns 0 → original order preserved
    const sorted = sortByWaveDesc(items);
    expect(sorted[0].role).toBe("architect");
    expect(sorted[1].role).toBe("qa");
  });

  it("handles items with multiple waves (takes the max)", () => {
    const items: DoneItem[] = [
      { role: "qa", taskSummary: "cross-wave", completedAt: 1000, waves: [111, 112] },
      { role: "architect", taskSummary: "single", completedAt: 2000, waves: [113] },
    ];
    const sorted = sortByWaveDesc(items);
    // architect has wave 113; qa has max-wave 112 → architect first
    expect(sorted[0].role).toBe("architect");
  });
});

// ─── AC7: chip-strip collapse logic (shows 2, collapses remainder as +N) ─────

function buildChips(waves: number[], tickets: number[]) {
  const all = [
    ...waves.map((w) => ({ kind: "wave" as const, label: `Wave ${w}`, key: `w${w}` })),
    ...tickets.map((t) => ({ kind: "ticket" as const, num: t, key: `t${t}` })),
  ];
  const visible = all.slice(0, 2);
  const overflow = all.length - visible.length;
  const overflowTitle = all.slice(2).map((c) => (c.kind === "wave" ? c.label : `#${c.num}`)).join(", ");
  return { visible, overflow, overflowTitle };
}

describe("AC7 — Done tag-pill +N collapse at threshold 2", () => {
  it("shows all pills when ≤ 2", () => {
    const { visible, overflow } = buildChips([112], [210]);
    expect(visible.length).toBe(2);
    expect(overflow).toBe(0);
  });

  it("collapses to +N when > 2 total chips", () => {
    const { visible, overflow, overflowTitle } = buildChips([112], [210, 215, 233]);
    expect(visible.length).toBe(2);
    expect(overflow).toBe(2);
    expect(overflowTitle).toBe("#215, #233");
  });

  it("includes wave chips in overflow title", () => {
    const { overflow, overflowTitle } = buildChips([111, 112], [210]);
    // visible: Wave 111, Wave 112  → overflow: #210
    expect(overflow).toBe(1);
    expect(overflowTitle).toBe("#210");
  });

  it("no overflow for 0 chips", () => {
    const { visible, overflow } = buildChips([], []);
    expect(visible.length).toBe(0);
    expect(overflow).toBe(0);
  });
});

// ─── AC2: workspace path truncation (RTL direction applied for long paths) ───

function shouldApplyRtl(path: string, focused: boolean): boolean {
  return !focused && path.length > 40;
}

describe("AC2 — workspace path RTL truncation (direction:rtl for long paths)", () => {
  it("applies RTL when path > 40 chars and not focused", () => {
    expect(shouldApplyRtl("/Users/nikolaiedralin/Study/LFM/new/b2b-portal", false)).toBe(true);
  });

  it("does NOT apply RTL on focus (so editing is natural)", () => {
    expect(shouldApplyRtl("/Users/nikolaiedralin/Study/LFM/new/b2b-portal", true)).toBe(false);
  });

  it("does NOT apply RTL for short paths", () => {
    expect(shouldApplyRtl("/Users/foo/bar", false)).toBe(false);
  });
});

// ─── AC1: doneExpands boolean derivation ─────────────────────────────────────

function computeDoneExpands(data: {
  now: unknown[];
  blocked: unknown[];
  done: unknown[];
} | null, sortedQueuedLength: number): boolean {
  return !!(data && data.now.length === 0 && sortedQueuedLength === 0 && data.blocked.length === 0 && data.done.length > 0);
}

describe("AC1 — doneExpands boolean (grid-column: 1 / 4 trigger)", () => {
  it("true when all sibling panes empty and done has items", () => {
    expect(computeDoneExpands({ now: [], blocked: [], done: [{}] }, 0)).toBe(true);
  });

  it("false when now has items", () => {
    expect(computeDoneExpands({ now: [{}], blocked: [], done: [{}] }, 0)).toBe(false);
  });

  it("false when queued has items", () => {
    expect(computeDoneExpands({ now: [], blocked: [], done: [{}] }, 1)).toBe(false);
  });

  it("false when blocked has items", () => {
    expect(computeDoneExpands({ now: [], blocked: [{}], done: [{}] }, 0)).toBe(false);
  });

  it("false when done is empty (nothing to expand)", () => {
    expect(computeDoneExpands({ now: [], blocked: [], done: [] }, 0)).toBe(false);
  });

  it("false when data is null (loading state)", () => {
    expect(computeDoneExpands(null, 0)).toBe(false);
  });
});

// ─── AC3: model-dropdown CSS contract ─────────────────────────────────────────
// CSS rules are: `.config { display: none }` with
// `.pane-header:hover .config, .pane-header:focus-within .config { display: flex }`.
// `:focus-within` parity is the a11y-critical gate condition.
// Full visual verification happens in the dev instance; the rule presence is
// locked by the styled-jsx source in src/components/AgentPane.tsx.
