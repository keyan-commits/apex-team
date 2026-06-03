/**
 * Verifies MODEL_FIT_POLICY: per-dispatch model: override is transient.
 * It must NOT leak into the sticky thread_config (getThreadAgentModels),
 * and it MUST be applied to the dispatched peer's runTurn call in-memory.
 */
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
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

