import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks (declared before imports that use them) ────────────────────────────

// vi.hoisted ensures these are available when vi.mock factories run (they're hoisted to top of file)
const mockExecSync = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({ execSync: mockExecSync }));

const {
  mockGetPipelineState,
  mockInsertStallEventRow,
  mockGetLatestUnackedStallRow,
  mockMarkStallEventAcked,
} = vi.hoisted(() => ({
  mockGetPipelineState: vi.fn(() => null),
  mockInsertStallEventRow: vi.fn(),
  mockGetLatestUnackedStallRow: vi.fn(() => null),
  mockMarkStallEventAcked: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  getPipelineState: mockGetPipelineState,
  insertStallEventRow: mockInsertStallEventRow,
  getLatestUnackedStallRow: mockGetLatestUnackedStallRow,
  markStallEventAcked: mockMarkStallEventAcked,
}));

import {
  evaluateStall,
  recordStallEvent,
  getLatestUnackedStall,
  ackStallEvent,
  STALL_MERGE_THRESHOLD_MS,
  STALL_BUDGET_FLOOR_TOKENS,
  type StallCheckParams,
} from "@/lib/stall-detector";

// ── Helpers ──────────────────────────────────────────────────────────────────

const BASE_TIME = 2_000_000_000_000; // a stable epoch ms value

/** Returns params for a stall scenario where all 4 conditions hold. */
function makeStallParams(overrides?: Partial<StallCheckParams>): StallCheckParams {
  return {
    threadId: "t-test",
    workspace: "/fake/workspace",
    hourlyOutputTokens: STALL_BUDGET_FLOOR_TOKENS + 1,
    tickArmed: true,
    now: () => BASE_TIME + STALL_MERGE_THRESHOLD_MS + 1,
    ...overrides,
  };
}

function setMergeAt(epochMs: number) {
  // execSync returns epoch seconds as a string
  mockExecSync.mockReturnValue(String(Math.floor(epochMs / 1000)));
}

function setMergeFailed() {
  mockExecSync.mockImplementation(() => { throw new Error("git not found"); });
}

function setBacklog(count: number) {
  (mockGetPipelineState as ReturnType<typeof vi.fn>).mockReturnValue(
    count > 0 ? { value: String(count) } : null,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("stall-detector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to a stale merge (epoch 0 → age is BASE_TIME + threshold + 1)
    mockExecSync.mockReturnValue("0");
    setBacklog(5);
  });

  // ── evaluateStall — all-four-conditions case ────────────────────────────────

  describe("evaluateStall", () => {
    it("returns non-null when all 4 predicates hold", () => {
      const params = makeStallParams();
      const result = evaluateStall(params);

      expect(result).not.toBeNull();
      expect(result?.threadId).toBe("t-test");
      expect(result?.backlogCount).toBe(5);
      expect(result?.hourlyTokens).toBe(STALL_BUDGET_FLOOR_TOKENS + 1);
      expect(result?.stallAgeMs).toBeGreaterThanOrEqual(STALL_MERGE_THRESHOLD_MS);
    });

    // ── 4 single-predicate-false cases ─────────────────────────────────────

    it("returns null when predicate 1 is false (merge was recent)", () => {
      const nowMs = BASE_TIME;
      // Merge was 30 min ago — within threshold
      setMergeAt(nowMs - 30 * 60_000);
      const params = makeStallParams({ now: () => nowMs });
      expect(evaluateStall(params)).toBeNull();
    });

    it("returns null when predicate 2 is false (backlog = 0)", () => {
      setBacklog(0);
      expect(evaluateStall(makeStallParams())).toBeNull();
    });

    it("returns null when predicate 3 is false (tick not armed)", () => {
      expect(evaluateStall(makeStallParams({ tickArmed: false }))).toBeNull();
    });

    it("returns null when predicate 4 is false (hourly tokens below floor)", () => {
      expect(evaluateStall(makeStallParams({ hourlyOutputTokens: STALL_BUDGET_FLOOR_TOKENS - 1 }))).toBeNull();
    });

    // ── Edge cases ──────────────────────────────────────────────────────────

    it("treats git failure as stalled (lastMergeAtMs=0, conservative)", () => {
      setMergeFailed();
      const params = makeStallParams();
      const result = evaluateStall(params);
      // git unavailable → condition 1 treated as true → stall fires if all others hold
      expect(result).not.toBeNull();
      expect(result?.lastMergeAt).toBeNull();
    });

    it("treats missing backlog key as 0 (condition 2 false → no stall)", () => {
      mockGetPipelineState.mockReturnValue(null);
      expect(evaluateStall(makeStallParams())).toBeNull();
    });
  });

  // ── recordStallEvent — deduplication ────────────────────────────────────────

  describe("recordStallEvent", () => {
    it("inserts a row when no existing unacked event", () => {
      mockGetLatestUnackedStallRow.mockReturnValue(null);
      const event = {
        threadId: "t-test",
        detectedAt: new Date(BASE_TIME).toISOString(),
        lastMergeAt: null,
        stallAgeMs: STALL_MERGE_THRESHOLD_MS + 1,
        backlogCount: 3,
        hourlyTokens: 10_000,
      };
      recordStallEvent(event);
      expect(mockInsertStallEventRow).toHaveBeenCalledOnce();
    });

    it("skips insert when unacked event exists within STALL_MERGE_THRESHOLD_MS (dedup)", () => {
      const recentTs = new Date(Date.now() - 60_000).toISOString(); // 1 min ago
      (mockGetLatestUnackedStallRow as ReturnType<typeof vi.fn>).mockReturnValue({
        id: 1,
        threadId: "t-test",
        detectedAt: recentTs,
        lastMergeAt: null,
        stallAgeMs: STALL_MERGE_THRESHOLD_MS + 1,
        backlogCount: 3,
        hourlyTokens: 10_000,
        acknowledged: false,
      });
      const event = {
        threadId: "t-test",
        detectedAt: new Date().toISOString(),
        lastMergeAt: null,
        stallAgeMs: STALL_MERGE_THRESHOLD_MS + 1,
        backlogCount: 3,
        hourlyTokens: 10_000,
      };
      recordStallEvent(event);
      expect(mockInsertStallEventRow).not.toHaveBeenCalled();
    });
  });

  // ── getLatestUnackedStall ────────────────────────────────────────────────────

  describe("getLatestUnackedStall", () => {
    it("returns null when no unacked event in DB", () => {
      mockGetLatestUnackedStallRow.mockReturnValue(null);
      expect(getLatestUnackedStall("t-test")).toBeNull();
    });

    it("returns the event when one exists", () => {
      const event = {
        id: 42,
        threadId: "t-test",
        detectedAt: new Date(BASE_TIME).toISOString(),
        lastMergeAt: null,
        stallAgeMs: STALL_MERGE_THRESHOLD_MS + 1,
        backlogCount: 7,
        hourlyTokens: 12_000,
        acknowledged: false,
      };
      (mockGetLatestUnackedStallRow as ReturnType<typeof vi.fn>).mockReturnValue(event);
      expect(getLatestUnackedStall("t-test")).toStrictEqual(event);
    });
  });

  // ── ackStallEvent ────────────────────────────────────────────────────────────

  describe("ackStallEvent", () => {
    it("calls markStallEventAcked for the thread", () => {
      ackStallEvent("t-test");
      expect(mockMarkStallEventAcked).toHaveBeenCalledWith("t-test");
    });
  });
});
