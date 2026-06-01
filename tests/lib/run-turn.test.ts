/**
 * Wave 51 — run-turn.ts: DISPATCH model override merges into thread agent models.
 * Verifies that when PO emits a DISPATCH with model: field, runTurn calls
 * setThreadAgentModels with the override so the next resolvedAgents() call
 * picks up the right model for the dispatched peer.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSetThreadAgentModels = vi.fn();
const mockGetThreadAgentModels = vi.fn(() => null);

vi.mock("@/lib/db", () => ({
  appendMessage: vi.fn(),
  getThreadAgentModels: mockGetThreadAgentModels,
  setAgentHandoffDoc: vi.fn(),
  setThreadAgentModels: mockSetThreadAgentModels,
  recordTurnUsage: vi.fn(),
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

describe("runTurn — DISPATCH model override propagation (Wave 51 #112)", () => {
  beforeEach(() => {
    mockSetThreadAgentModels.mockClear();
    mockGetThreadAgentModels.mockReturnValue(null);
  });

  it("merges dispatch model override into thread agent models", async () => {
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

    expect(result.dispatches[0].to).toBe("backend-developer");
    expect(result.dispatches[0].model).toBe("claude-haiku-4-5-20251001");
    expect(mockSetThreadAgentModels).toHaveBeenCalledWith(
      "test-thread-model",
      expect.objectContaining({ "backend-developer": "claude-haiku-4-5-20251001" }),
    );
  });
});
