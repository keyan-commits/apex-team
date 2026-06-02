import { describe, it, expect } from "vitest";
import { groupDone } from "@/lib/group-done";

describe("groupDone", () => {
  it("3 items sharing wave:100 produce 1 group with 3 rows", () => {
    const done = [
      { role: "devsecops", taskSummary: "a", completedAt: 1000, waves: [100] },
      { role: "qa", taskSummary: "b", completedAt: 2000, waves: [100] },
      { role: "architect", taskSummary: "c", completedAt: 3000, waves: [100] },
    ];
    const result = groupDone(done);
    expect(result).toHaveLength(1);
    expect(result[0].rows).toHaveLength(3);
    expect(result[0].waves).toEqual([100]);
    expect(result[0].key).toBe("wave-100");
  });

  it("2 items with no waves/tickets in the same UTC hour produce 1 hour-bucket group", () => {
    const hourMs = 3_600_000;
    const done = [
      { role: "ux-designer", taskSummary: "x", completedAt: hourMs * 10 + 100 },
      { role: "business-analyst", taskSummary: "y", completedAt: hourMs * 10 + 200 },
    ];
    const result = groupDone(done);
    expect(result).toHaveLength(1);
    expect(result[0].key).toMatch(/^hour-/);
    expect(result[0].rows).toHaveLength(2);
    expect(result[0].waves).toHaveLength(0);
    expect(result[0].tickets).toHaveLength(0);
  });

  it("adjacent items with different waves produce 2 separate groups (no cross-wave bleed)", () => {
    const done = [
      { role: "qa", taskSummary: "a", completedAt: 1000, waves: [100] },
      { role: "architect", taskSummary: "b", completedAt: 2000, waves: [99] },
    ];
    const result = groupDone(done);
    expect(result).toHaveLength(2);
    expect(result[0].waves).toEqual([100]);
    expect(result[1].waves).toEqual([99]);
  });
});
