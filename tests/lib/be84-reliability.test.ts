import { describe, it, expect, vi, beforeEach } from "vitest";

// ── US-039: recordStallEvent returns boolean + warn fires only on onset ────────
//
// Mocks @/lib/db so we can control the DB responses.

const {
  mockInsertStallEventRow,
  mockGetLatestUnackedStallRow,
} = vi.hoisted(() => ({
  mockInsertStallEventRow: vi.fn(),
  mockGetLatestUnackedStallRow: vi.fn(() => null),
}));

vi.mock("@/lib/db", () => ({
  getPipelineState: vi.fn(() => null),
  insertStallEventRow: mockInsertStallEventRow,
  getLatestUnackedStallRow: mockGetLatestUnackedStallRow,
  markStallEventAcked: vi.fn(),
  listActiveTickThreads: vi.fn(() => []),
  getThreadSpendSince: vi.fn(() => 0),
  logTick: vi.fn(),
  listPendingInbox: vi.fn(() => []),
  getThreadWorkspace: vi.fn(() => null),
  getThreadAgentModels: vi.fn(() => null),
  upsertPrStatus: vi.fn(),
  setPipelineState: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execSync: vi.fn(() => { throw new Error("not available in tests"); }),
}));

vi.mock("@/lib/run-turn-with-dispatches", () => ({
  runTurnWithDispatches: vi.fn().mockResolvedValue({
    dispatches: [], visibleText: "", rawBuffer: "", newHandoffDoc: null,
    handoffs: [], agentModels: null, peerReplies: [],
  }),
}));

vi.mock("@/lib/roles", () => ({
  ALL_ROLES: ["product-owner", "business-analyst", "architect", "ui-developer",
    "backend-developer", "qa", "devsecops", "ux-designer"],
  TEAM_ROLES: ["business-analyst", "architect", "ui-developer",
    "backend-developer", "qa", "devsecops", "ux-designer"],
  DEFAULT_ROLE_MODELS: {
    "product-owner": "claude-opus-4-8", "architect": "claude-opus-4-8",
    "business-analyst": "claude-sonnet-4-6", "ui-developer": "claude-sonnet-4-6",
    "backend-developer": "claude-sonnet-4-6", "qa": "claude-sonnet-4-6",
    "devsecops": "claude-sonnet-4-6", "ux-designer": "claude-sonnet-4-6",
  },
}));

import {
  recordStallEvent,
  STALL_MERGE_THRESHOLD_MS,
} from "@/lib/stall-detector";

const BASE_TIME = 2_000_000_000_000;

function makeEvent() {
  return {
    threadId: "t-84",
    detectedAt: new Date(BASE_TIME).toISOString(),
    lastMergeAt: null,
    stallAgeMs: STALL_MERGE_THRESHOLD_MS + 1,
    backlogCount: 3,
    hourlyTokens: 10_000,
  };
}

// ── recordStallEvent return value ─────────────────────────────────────────────

describe("US-039 — recordStallEvent returns boolean (AC1–AC3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLatestUnackedStallRow.mockReturnValue(null);
  });

  it("AC1 onset: returns true and inserts when no prior unacked event", () => {
    const result = recordStallEvent(makeEvent());
    expect(result).toBe(true);
    expect(mockInsertStallEventRow).toHaveBeenCalledOnce();
  });

  it("AC2 dedup: returns false and skips insert during same stall window", () => {
    const recentTs = new Date(Date.now() - 60_000).toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockGetLatestUnackedStallRow as any).mockReturnValue({
      id: 1, threadId: "t-84", detectedAt: recentTs, lastMergeAt: null,
      stallAgeMs: STALL_MERGE_THRESHOLD_MS + 1, backlogCount: 3,
      hourlyTokens: 10_000, acknowledged: false,
    });

    const result = recordStallEvent(makeEvent());
    expect(result).toBe(false);
    expect(mockInsertStallEventRow).not.toHaveBeenCalled();
  });

  it("AC3 re-fire: returns true when prior unacked event is outside the merge window", () => {
    const oldTs = new Date(Date.now() - (STALL_MERGE_THRESHOLD_MS + 1)).toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockGetLatestUnackedStallRow as any).mockReturnValue({
      id: 2, threadId: "t-84", detectedAt: oldTs, lastMergeAt: null,
      stallAgeMs: STALL_MERGE_THRESHOLD_MS + 1, backlogCount: 3,
      hourlyTokens: 10_000, acknowledged: false,
    });

    const result = recordStallEvent(makeEvent());
    expect(result).toBe(true);
    expect(mockInsertStallEventRow).toHaveBeenCalledOnce();
  });
});

// ── warn fires only on onset ──────────────────────────────────────────────────

describe("US-039 — warn fires only on onset, not on dedup (tick-scheduler integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AC1: warn fires exactly once on insertion (onset)", () => {
    mockGetLatestUnackedStallRow.mockReturnValue(null);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const inserted = recordStallEvent(makeEvent());
    if (inserted) {
      console.warn(
        `[stall-detector] STALL thread=t-84` +
        ` stall_age_ms=${STALL_MERGE_THRESHOLD_MS + 1}` +
        ` backlog=3 hourly_tokens=10000 last_merge=never`,
      );
    }

    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });

  it("AC2: warn does NOT fire when dedup-skipped", () => {
    const recentTs = new Date(Date.now() - 60_000).toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockGetLatestUnackedStallRow as any).mockReturnValue({
      id: 1, threadId: "t-84", detectedAt: recentTs, lastMergeAt: null,
      stallAgeMs: STALL_MERGE_THRESHOLD_MS + 1, backlogCount: 3,
      hourlyTokens: 10_000, acknowledged: false,
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const inserted = recordStallEvent(makeEvent());
    if (inserted) {
      console.warn("[stall-detector] STALL should not fire");
    }

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
