/**
 * Verifies MODEL_FIT_POLICY: per-dispatch model: override is transient.
 * It must NOT leak into the sticky thread_config (getThreadAgentModels),
 * and it MUST be applied to the dispatched peer's runTurn call in-memory.
 */
import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tmpDir = mkdtempSync(join(tmpdir(), "apex-dispatch-model-"));

// Controlled PO output — replaced per test.
let agentYield = "";

vi.mock("@/lib/agents", () => ({
  runAgentTurn: vi.fn(async function* () { yield agentYield; }),
}));

vi.mock("@/lib/event-bus", () => ({
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

// markRoleActive/markRoleIdle are DB helpers — let them run on the temp DB.

afterAll(() => {
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
});

function makeAgents(overrides: Record<string, { model: string }> = {}) {
  const base = ["product-owner","architect","business-analyst","ui-developer",
    "backend-developer","qa","devsecops","ux-designer"] as const;
  return Object.fromEntries(
    base.map((r) => [r, { role: r, provider: "claude" as const,
      model: overrides[r]?.model ?? "claude-sonnet-4-6" }])
  ) as Record<string, { role: string; provider: "claude"; model: string }>;
}

describe("per-dispatch model: override — transient, does not leak to thread_config", () => {
  let db: typeof import("@/lib/db");
  let runTurn: typeof import("@/lib/run-turn").runTurn;

  beforeEach(async () => {
    process.env.APEX_TEAM_DB_PATH = join(tmpDir, "test.db");
    vi.resetModules();
    db = await import("@/lib/db");
    ({ runTurn } = await import("@/lib/run-turn"));
  });

  it("dispatch with model: does NOT write the model to getThreadAgentModels", async () => {
    agentYield = [
      "[[DISPATCH: qa model:claude-opus-4-8]]",
      "Do a QA check.",
      "[[/DISPATCH]]",
    ].join("\n");

    await runTurn({
      threadId: "t-no-leak",
      target: "product-owner",
      agents: makeAgents() as never,
      signal: new AbortController().signal,
    });

    // Sticky thread_config must NOT contain the dispatch model override.
    const stored = db.getThreadAgentModels("t-no-leak");
    expect(stored?.qa).toBeUndefined();
  });

  it("dispatch without model: leaves thread_config untouched", async () => {
    agentYield = [
      "[[DISPATCH: qa]]",
      "Do a QA check.",
      "[[/DISPATCH]]",
    ].join("\n");

    await runTurn({
      threadId: "t-no-model-no-write",
      target: "product-owner",
      agents: makeAgents() as never,
      signal: new AbortController().signal,
    });

    const stored = db.getThreadAgentModels("t-no-model-no-write");
    expect(stored?.qa).toBeUndefined();
  });

  it("AGENT-MODELS block still persists the sticky thread assignment", async () => {
    agentYield = [
      "[[AGENT-MODELS]]",
      "qa: claude-opus-4-8",
      "[[/AGENT-MODELS]]",
    ].join("\n");

    await runTurn({
      threadId: "t-agent-models-sticky",
      target: "product-owner",
      agents: makeAgents() as never,
      signal: new AbortController().signal,
    });

    const stored = db.getThreadAgentModels("t-agent-models-sticky");
    expect(stored?.qa).toBe("claude-opus-4-8");
  });
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

  afterEach(() => {
    vi.resetModules();
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
    // Reset BEFORE re-mocking so the beforeEach opus-factory is fully cleared
    // before we register the no-model factory. Doing doMock→resetModules in the
    // old order let CI's module resolver pick up the opus factory instead.
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
