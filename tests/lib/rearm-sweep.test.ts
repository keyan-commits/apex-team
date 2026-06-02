import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockListActiveTickThreads = vi.fn<() => string[]>(() => []);
const mockGetThreadSpendSince = vi.fn(() => 0);
const mockLogTick = vi.fn();
const mockListPendingInbox = vi.fn(() => []);
const mockGetThreadWorkspace = vi.fn(() => null);
const mockGetThreadAgentModels = vi.fn(() => null);
const mockGetPipelineState = vi.fn(() => null);

vi.mock("@/lib/db", () => ({
  listActiveTickThreads: mockListActiveTickThreads,
  getThreadSpendSince: mockGetThreadSpendSince,
  logTick: mockLogTick,
  listPendingInbox: mockListPendingInbox,
  getThreadWorkspace: mockGetThreadWorkspace,
  getThreadAgentModels: mockGetThreadAgentModels,
  getPipelineState: mockGetPipelineState,
  upsertPrStatus: vi.fn(),
  setPipelineState: vi.fn(),
}));

vi.mock("@/lib/run-turn-with-dispatches", () => ({
  runTurnWithDispatches: vi.fn().mockResolvedValue({
    dispatches: [],
    visibleText: "",
    rawBuffer: "",
    newHandoffDoc: null,
    handoffs: [],
    agentModels: null,
    peerReplies: [],
  }),
}));

vi.mock("node:child_process", () => ({
  execSync: vi.fn(() => { throw new Error("not available in tests"); }),
}));

vi.mock("@/lib/stall-detector", () => ({
  evaluateStall: vi.fn(() => null),
  recordStallEvent: vi.fn(),
  ackStallEvent: vi.fn(),
}));

vi.mock("@/lib/roles", () => ({
  ALL_ROLES: [
    "product-owner",
    "business-analyst",
    "architect",
    "ui-developer",
    "backend-developer",
    "qa",
    "devsecops",
    "ux-designer",
  ],
  TEAM_ROLES: [
    "business-analyst",
    "architect",
    "ui-developer",
    "backend-developer",
    "qa",
    "devsecops",
    "ux-designer",
  ],
  DEFAULT_ROLE_MODELS: {
    "product-owner": "claude-opus-4-8",
    "architect": "claude-opus-4-8",
    "business-analyst": "claude-sonnet-4-6",
    "ui-developer": "claude-sonnet-4-6",
    "backend-developer": "claude-sonnet-4-6",
    "qa": "claude-sonnet-4-6",
    "devsecops": "claude-sonnet-4-6",
    "ux-designer": "claude-sonnet-4-6",
  },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("rearmActiveThreads (Wave 83 / US-037)", () => {
  let armScheduler: typeof import("@/lib/tick-scheduler").armScheduler;
  let stopAllSchedulers: typeof import("@/lib/tick-scheduler").stopAllSchedulers;
  let rearmActiveThreads: typeof import("@/lib/tick-scheduler").rearmActiveThreads;
  let getSchedulerState: typeof import("@/lib/tick-scheduler").getSchedulerState;
  let REARM_WINDOW_MS: typeof import("@/lib/tick-scheduler").REARM_WINDOW_MS;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockListActiveTickThreads.mockReturnValue([]);
    mockGetThreadSpendSince.mockReturnValue(0);
    mockListPendingInbox.mockReturnValue([]);
    mockGetPipelineState.mockReturnValue(null);

    const mod = await import("@/lib/tick-scheduler");
    armScheduler = mod.armScheduler;
    stopAllSchedulers = mod.stopAllSchedulers;
    rearmActiveThreads = mod.rearmActiveThreads;
    getSchedulerState = mod.getSchedulerState;
    REARM_WINDOW_MS = mod.REARM_WINDOW_MS;
  });

  it("REARM_WINDOW_MS is exported and equals 7_200_000", () => {
    expect(REARM_WINDOW_MS).toBe(7_200_000);
  });

  it("AC5 case 1: no recent ticks → arms 0 threads, no crash", () => {
    mockListActiveTickThreads.mockReturnValue([]);

    expect(() => rearmActiveThreads()).not.toThrow();

    expect(mockListActiveTickThreads).toHaveBeenCalledWith(REARM_WINDOW_MS);
    // Nothing was armed
    expect(getSchedulerState("any-thread")).toBeNull();

    stopAllSchedulers();
  });

  it("AC5 case 2: one qualifying thread → armScheduler called, thread in schedulers Map", () => {
    mockListActiveTickThreads.mockReturnValue(["thread-alpha"]);

    rearmActiveThreads();

    const state = getSchedulerState("thread-alpha");
    expect(state).not.toBeNull();
    expect(state?.active).toBe(true);

    stopAllSchedulers();
  });

  it("AC5 case 3: idempotency — calling rearmActiveThreads twice arms the thread exactly once", () => {
    mockListActiveTickThreads.mockReturnValue(["thread-idem"]);

    const scheduleSpy = vi.fn((_fn: () => void, _ms: number) =>
      setTimeout(() => {}, 9_999_999) as ReturnType<typeof setTimeout>,
    );
    const fakeDeps = { schedule: scheduleSpy, now: () => 0 };

    // First call: arms the thread
    rearmActiveThreads({ deps: fakeDeps });
    const countAfterFirst = scheduleSpy.mock.calls.length;
    expect(countAfterFirst).toBe(1);

    // Second call: thread already in Map → armScheduler guard returns early
    rearmActiveThreads({ deps: fakeDeps });
    expect(scheduleSpy.mock.calls.length).toBe(countAfterFirst);

    stopAllSchedulers();
  });

  it("AC5 case 4: thread outside 2h window → not re-armed (listActiveTickThreads returns empty)", () => {
    // The window filter is DB-side; listActiveTickThreads returns [] for stale threads
    mockListActiveTickThreads.mockReturnValue([]);

    rearmActiveThreads();

    // No thread was armed
    expect(getSchedulerState("stale-thread")).toBeNull();

    stopAllSchedulers();
  });

  it("AC5 case 5: MAX_THREADS limit — threads beyond the cap are warned and skipped", () => {
    // MAX_THREADS = 5, so pre-arm 5 threads then verify the 6th is skipped
    const existingThreads = ["t1", "t2", "t3", "t4", "t5"];
    for (const t of existingThreads) {
      armScheduler(t);
    }

    // Now try to re-arm a 6th via rearmActiveThreads
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockListActiveTickThreads.mockReturnValue(["t-overflow"]);

    rearmActiveThreads();

    // t-overflow must NOT be armed (MAX_THREADS reached)
    expect(getSchedulerState("t-overflow")).toBeNull();
    // armScheduler's own warn fires for the overflow
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("max"),
    );

    warnSpy.mockRestore();
    stopAllSchedulers();
  });

  it("AC4: logs [tick-scheduler] boot: re-armed message when threads > 0", () => {
    mockListActiveTickThreads.mockReturnValue(["thread-log-a", "thread-log-b"]);
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    rearmActiveThreads();

    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /\[tick-scheduler\] boot: re-armed 2 thread\(s\): thread-log-a, thread-log-b/,
      ),
    );

    infoSpy.mockRestore();
    stopAllSchedulers();
  });

  it("AC4: no log emitted when 0 threads qualify", () => {
    mockListActiveTickThreads.mockReturnValue([]);
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    rearmActiveThreads();

    expect(infoSpy).not.toHaveBeenCalled();

    infoSpy.mockRestore();
    stopAllSchedulers();
  });
});
