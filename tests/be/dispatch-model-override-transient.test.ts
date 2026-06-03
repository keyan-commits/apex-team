/**
 * Verifies MODEL_FIT_POLICY: per-dispatch model override is applied transiently
 * to dispatched peer agents in-memory, not persisted to thread_config.
 *
 * ISOLATED IN SEPARATE FILE: This test suite registers conflicting doMock factories
 * (opus vs no-model) in a beforeEach + test combination. Vitest's fork-pool resolver
 * caused the opus factory to bleed into the no-model test on CI. Per-file isolation
 * (this file) guarantees clean module state for each test.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
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

function makeAgents(overrides: Record<string, { model: string }> = {}) {
  const base = ["product-owner","architect","business-analyst","ui-developer",
    "backend-developer","qa","devsecops","ux-designer"] as const;
  return Object.fromEntries(
    base.map((r) => [r, { role: r, provider: "claude" as const,
      model: overrides[r]?.model ?? "claude-sonnet-4-6" }])
  ) as Record<string, { role: string; provider: "claude"; model: string }>;
}

afterEach(() => {
  vi.resetModules();
});

describe("runTurnWithDispatches — dispatch model: applied transiently to peer agents", () => {
  let capturedPeerAgents: Record<string, unknown> | null = null;

  beforeEach(async () => {
    capturedPeerAgents = null;
    process.env.APEX_TEAM_DB_PATH = join(tmpDir, "test.db");
    vi.resetModules();

    // Mock run-turn so the PO turn returns a controlled dispatch result,
    // and the peer turn captures what agents it received.
    vi.doMock("@/lib/run-turn", () => {
      let callCount = 0;
      return {
        runTurn: vi.fn(async (input: { target: string; agents: Record<string, unknown> }) => {
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
        }),
      };
    });
  });

  it("dispatched peer turn receives the model: override in its agents map (in-memory only)", async () => {
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
    vi.resetModules();
    vi.doMock("@/lib/run-turn", () => {
      let callCount = 0;
      return {
        runTurn: vi.fn(async (input: { target: string; agents: Record<string, unknown> }) => {
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
        }),
      };
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
