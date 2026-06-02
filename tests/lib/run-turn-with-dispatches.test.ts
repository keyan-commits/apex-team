// #156 regression: runTurnWithDispatches must fan PO dispatches out to peers,
// and a single failing peer must NOT silently drop the rest of the fan-out —
// it must be logged AND surfaced into the thread so the PO sees it next turn.
//
// Wave 72: also verifies peer_idle auto-update (markRoleActive/markRoleIdle).

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RunTurnInput, RunTurnResult } from "@/lib/run-turn";

const mockRunTurn = vi.fn();
const mockAppendMessage = vi.fn();
const mockMarkRoleActive = vi.fn();
const mockMarkRoleIdle = vi.fn();

vi.mock("@/lib/run-turn", () => ({
  runTurn: (input: RunTurnInput) => mockRunTurn(input),
}));

vi.mock("@/lib/db", () => ({
  appendMessage: (...args: unknown[]) => mockAppendMessage(...args),
  markRoleActive: (...args: unknown[]) => mockMarkRoleActive(...args),
  markRoleIdle: (...args: unknown[]) => mockMarkRoleIdle(...args),
}));

import { runTurnWithDispatches } from "@/lib/run-turn-with-dispatches";

const base: RunTurnResult = {
  visibleText: "",
  rawBuffer: "",
  newHandoffDoc: null,
  handoffs: [],
  dispatches: [],
  agentModels: null,
};

const poInput: RunTurnInput = {
  threadId: "t1",
  target: "product-owner",
  userMessage: "go",
  agents: {} as RunTurnInput["agents"],
  workspace: "/tmp",
  signal: new AbortController().signal,
};

beforeEach(() => {
  mockRunTurn.mockReset();
  mockAppendMessage.mockReset();
  mockMarkRoleActive.mockReset();
  mockMarkRoleIdle.mockReset();
});

describe("runTurnWithDispatches", () => {
  it("fans PO dispatches out to each peer in parallel", async () => {
    mockRunTurn.mockImplementation(async (input: RunTurnInput) => {
      if (input.target === "product-owner") {
        return {
          ...base,
          visibleText: "po decision",
          dispatches: [
            { to: "qa", message: "gate it" },
            { to: "architect", message: "design it" },
          ],
        } satisfies RunTurnResult;
      }
      return { ...base, visibleText: `${input.target} done` } satisfies RunTurnResult;
    });

    const result = await runTurnWithDispatches(poInput);

    expect(result.peerReplies).toHaveLength(2);
    expect(result.peerReplies.map((p) => p.role).sort()).toEqual(["architect", "qa"]);
    // 1 PO turn + 2 peer turns.
    expect(mockRunTurn).toHaveBeenCalledTimes(3);
    // Peers are triggered with the dispatch body as their userMessage.
    expect(mockRunTurn).toHaveBeenCalledWith(
      expect.objectContaining({ target: "qa", userMessage: "gate it" }),
    );
  });

  it("isolates a failing peer — others still complete, failure logged + surfaced to PO", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunTurn.mockImplementation(async (input: RunTurnInput) => {
      if (input.target === "product-owner") {
        return {
          ...base,
          dispatches: [
            { to: "qa", message: "gate it" },
            { to: "architect", message: "design it" },
          ],
        } satisfies RunTurnResult;
      }
      if (input.target === "architect") {
        throw new Error("boom");
      }
      return { ...base, visibleText: `${input.target} done` } satisfies RunTurnResult;
    });

    const result = await runTurnWithDispatches(poInput);

    // The healthy peer still completed.
    expect(result.peerReplies).toHaveLength(1);
    expect(result.peerReplies[0].role).toBe("qa");
    // The failure was logged.
    expect(errSpy).toHaveBeenCalled();
    // The failure was surfaced into the thread as a synthetic PO-visible message.
    expect(mockAppendMessage).toHaveBeenCalledWith(
      "t1",
      { kind: "user", to: "product-owner" },
      expect.stringContaining("architect"),
    );
    expect(mockAppendMessage).toHaveBeenCalledWith(
      "t1",
      expect.anything(),
      expect.stringContaining("boom"),
    );
    errSpy.mockRestore();
  });

  it("does not fan out when the target is not the product-owner", async () => {
    mockRunTurn.mockResolvedValueOnce({
      ...base,
      visibleText: "ba reply",
      // even if dispatch rows somehow appear, the guard is on target.
      dispatches: [{ to: "qa", message: "x" }],
    } satisfies RunTurnResult);

    const result = await runTurnWithDispatches({ ...poInput, target: "business-analyst" });

    expect(result.peerReplies).toEqual([]);
    expect(mockRunTurn).toHaveBeenCalledTimes(1);
    expect(mockAppendMessage).not.toHaveBeenCalled();
  });

  it("does not fan out when the PO emits zero dispatches", async () => {
    mockRunTurn.mockResolvedValueOnce({ ...base, visibleText: "po, no dispatch" } satisfies RunTurnResult);

    const result = await runTurnWithDispatches(poInput);

    expect(result.peerReplies).toEqual([]);
    expect(mockRunTurn).toHaveBeenCalledTimes(1);
  });

  it("marks the primary target active before its turn and idle after", async () => {
    mockRunTurn.mockResolvedValueOnce({ ...base, visibleText: "ba reply" } satisfies RunTurnResult);
    const input = { ...poInput, target: "business-analyst" as const };

    await runTurnWithDispatches(input);

    expect(mockMarkRoleActive).toHaveBeenCalledWith("t1", "business-analyst");
    expect(mockMarkRoleIdle).toHaveBeenCalledWith("t1", "business-analyst");
    // active must be called before the turn; idle after.
    const activeOrder = mockMarkRoleActive.mock.invocationCallOrder[0];
    const idleOrder = mockMarkRoleIdle.mock.invocationCallOrder[0];
    expect(activeOrder).toBeLessThan(idleOrder);
  });

  it("marks dispatched peers active before and idle after their turns", async () => {
    mockRunTurn.mockImplementation(async (input: RunTurnInput) => {
      if (input.target === "product-owner") {
        return {
          ...base,
          dispatches: [{ to: "qa" as const, message: "gate it" }],
        } satisfies RunTurnResult;
      }
      return { ...base, visibleText: `${input.target} done` } satisfies RunTurnResult;
    });

    await runTurnWithDispatches(poInput);

    // qa should be marked active and then idle
    expect(mockMarkRoleActive).toHaveBeenCalledWith("t1", "qa");
    expect(mockMarkRoleIdle).toHaveBeenCalledWith("t1", "qa");
  });

  it("marks peer idle even when the peer turn throws", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunTurn.mockImplementation(async (input: RunTurnInput) => {
      if (input.target === "product-owner") {
        return {
          ...base,
          dispatches: [{ to: "architect" as const, message: "review it" }],
        } satisfies RunTurnResult;
      }
      throw new Error("peer boom");
    });

    await runTurnWithDispatches(poInput);

    // markRoleIdle must still fire despite the throw (finally block)
    expect(mockMarkRoleIdle).toHaveBeenCalledWith("t1", "architect");
    errSpy.mockRestore();
  });
});
