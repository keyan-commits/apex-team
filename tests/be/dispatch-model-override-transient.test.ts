/**
 * Verifies MODEL_FIT_POLICY: per-dispatch model override is applied transiently
 * to dispatched peer agents in-memory, not persisted to thread_config.
 *
 * Uses a single hoisted vi.mock with per-test mockImplementation to avoid
 * vi.doMock + vi.resetModules resolver races on the fork-pool CI runner.
 * vi.resetModules clears module cache but NOT doMock registrations;
 * one registration + behavior control via mockImplementation is deterministic.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tmpDir = mkdtempSync(join(tmpdir(), "apex-dispatch-model-transient-"));

vi.mock("@/lib/agents", () => ({
  runAgentTurn: vi.fn(async function* () { yield ""; }),
}));

vi.mock("@/lib/event-bus", () => ({
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("@/lib/run-turn", () => ({
  runTurn: vi.fn(),
}));

import { runTurn } from "@/lib/run-turn";
const mockRunTurn = vi.mocked(runTurn);

function makeAgents(overrides: Record<string, { model: string }> = {}) {
  const base = ["product-owner","architect","business-analyst","ui-developer",
    "backend-developer","qa","devsecops","ux-designer"] as const;
  return Object.fromEntries(
    base.map((r) => [r, { role: r, provider: "claude" as const,
      model: overrides[r]?.model ?? "claude-sonnet-4-6" }])
  ) as Record<string, { role: string; provider: "claude"; model: string }>;
}

describe("runTurnWithDispatches — dispatch model: applied transiently to peer agents", () => {
  let capturedPeerAgents: Record<string, unknown> | null = null;

  beforeEach(() => {
    capturedPeerAgents = null;
    process.env.APEX_TEAM_DB_PATH = join(tmpDir, "test.db");
    mockRunTurn.mockReset();
  });

  it("dispatched peer turn receives the model: override in its agents map (in-memory only)", async () => {
    let callCount = 0;
    mockRunTurn.mockImplementation(async (input: { target: string; agents: Record<string, unknown> }) => {
      callCount++;
      if (callCount === 1) {
        // PO turn: return a dispatch with model override
        return {
          visibleText: "",
          rawBuffer: "",
          newHandoffDoc: null,
          handoffs: [],
          dispatches: [{ to: "qa", message: "Do a QA check.", model: "claude-opus-4-8" }],
          agentModels: null,
        };
      }
      // Peer (QA) turn: capture what agents map it received
      capturedPeerAgents = input.agents as Record<string, unknown>;
      return {
        visibleText: "",
        rawBuffer: "",
        newHandoffDoc: null,
        handoffs: [],
        dispatches: [],
        agentModels: null,
      };
    });

    const { runTurnWithDispatches } = await import("@/lib/run-turn-with-dispatches");
    const agents = makeAgents() as never; // qa.model = "claude-sonnet-4-6" by default

    await runTurnWithDispatches({
      threadId: "t-transient",
      target: "product-owner",
      agents,
      signal: new AbortController().signal,
    });

    // The dispatched QA turn must have received claude-opus-4-8 transiently.
    expect(capturedPeerAgents).not.toBeNull();
    const qaCfg = capturedPeerAgents!.qa as { model: string };
    expect(qaCfg.model).toBe("claude-opus-4-8");
  });

  it("dispatched peer without model: gets the default from agents map unchanged", async () => {
    let callCount = 0;
    mockRunTurn.mockImplementation(async (input: { target: string; agents: Record<string, unknown> }) => {
      callCount++;
      if (callCount === 1) {
        return {
          visibleText: "",
          rawBuffer: "",
          newHandoffDoc: null,
          handoffs: [],
          dispatches: [{ to: "qa", message: "Do a QA check." }],
          agentModels: null,
        };
      }
      capturedPeerAgents = input.agents as Record<string, unknown>;
      return { visibleText: "", rawBuffer: "", newHandoffDoc: null,
        handoffs: [], dispatches: [], agentModels: null };
    });

    const { runTurnWithDispatches } = await import("@/lib/run-turn-with-dispatches");
    const agents = makeAgents() as never;

    await runTurnWithDispatches({
      threadId: "t-no-override",
      target: "product-owner",
      agents,
      signal: new AbortController().signal,
    });

    expect(capturedPeerAgents).not.toBeNull();
    const qaCfg = capturedPeerAgents!.qa as { model: string };
    // No override → uses default from the input agents map
    expect(qaCfg.model).toBe("claude-sonnet-4-6");
  });
});
