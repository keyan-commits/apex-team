/**
 * run-turn.ts: DISPATCH model: override is returned in result.dispatches
 * but must NOT be written to the sticky thread_config (MODEL_FIT_POLICY:
 * transient per-dispatch — only [[AGENT-MODELS]] block is sticky).
 * The transient application to the peer's runTurn is tested in
 * run-turn-with-dispatches via tests/be/dispatch-model-override.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSetThreadAgentModels = vi.fn();

vi.mock("@/lib/db", () => ({
  appendMessage: vi.fn(),
  setAgentHandoffDoc: vi.fn(),
  setThreadAgentModels: mockSetThreadAgentModels,
  recordTurnUsage: vi.fn(),
  stampTurnAt: vi.fn(),
}));

vi.mock("@/lib/agents", () => ({
  runAgentTurn: vi.fn(async function* () {
    yield "[[DISPATCH: backend-developer model:claude-haiku-4-5-20251001]]\nDo the thing.\n[[/DISPATCH]]";
  }),
}));

vi.mock("@/lib/event-bus", () => ({ publish: vi.fn() }));

vi.mock("@/lib/roles", () => ({
  ALL_ROLES: ["product-owner", "backend-developer"],
}));

vi.mock("@/lib/providers", () => ({
  DEFAULT_MODELS: { claude: "claude-sonnet-4-6" },
}));

describe("runTurn — DISPATCH model override propagation (closes #241)", () => {
  beforeEach(() => {
    mockSetThreadAgentModels.mockClear();
  });

  it("dispatch model: is returned in result.dispatches but NOT written to thread_config", async () => {
    const { runTurn } = await import("@/lib/run-turn");

    const result = await runTurn({
      threadId: "test-thread-model",
      target: "product-owner",
      agents: {
        "product-owner": { role: "product-owner", provider: "claude", model: "claude-opus-4-8" },
        "backend-developer": { role: "backend-developer", provider: "claude", model: "claude-sonnet-4-6" },
      } as never,
      signal: new AbortController().signal,
    });

    // Model override is preserved in the dispatch result for runTurnWithDispatches
    // to apply transiently — it is NOT the sticky thread assignment.
    expect(result.dispatches[0].to).toBe("backend-developer");
    expect(result.dispatches[0].model).toBe("claude-haiku-4-5-20251001");

    // setThreadAgentModels must NOT have been called (dispatch overrides are transient).
    expect(mockSetThreadAgentModels).not.toHaveBeenCalled();
  });
});
