import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tmpDir = mkdtempSync(join(tmpdir(), "apex-opus47-test-"));

describe("migrateRetiredModels — opus-4-7 → opus-4-8", () => {
  let setThreadAgentModels: (threadId: string, models: Record<string, string>) => void;
  let getThreadAgentModels: (threadId: string) => Record<string, string> | null;
  let migrateRetiredModels: () => void;

  beforeAll(async () => {
    process.env.APEX_TEAM_DB_PATH = join(tmpDir, "test.db");
    vi.resetModules();
    const mod = await import("@/lib/db");
    setThreadAgentModels = mod.setThreadAgentModels;
    getThreadAgentModels = mod.getThreadAgentModels;
    migrateRetiredModels = mod.migrateRetiredModels;
  });

  afterAll(() => {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  });

  it("migrates claude-opus-4-7 → claude-opus-4-8 in agent_models", () => {
    setThreadAgentModels("t-migrate-1", { "business-analyst": "claude-opus-4-7", "architect": "claude-opus-4-8" });
    migrateRetiredModels();
    const result = getThreadAgentModels("t-migrate-1");
    expect(result?.["business-analyst"]).toBe("claude-opus-4-8");
    expect(result?.["architect"]).toBe("claude-opus-4-8");
  });

  it("is idempotent — running twice causes no error and no duplicate updates", () => {
    setThreadAgentModels("t-migrate-2", { "qa": "claude-opus-4-7" });
    migrateRetiredModels();
    migrateRetiredModels();
    const result = getThreadAgentModels("t-migrate-2");
    expect(result?.["qa"]).toBe("claude-opus-4-8");
  });

  it("leaves opus-4-8 and other models untouched", () => {
    setThreadAgentModels("t-migrate-3", { "architect": "claude-opus-4-8", "ui-developer": "gemini-2.5-flash" });
    migrateRetiredModels();
    const result = getThreadAgentModels("t-migrate-3");
    expect(result?.["architect"]).toBe("claude-opus-4-8");
    expect(result?.["ui-developer"]).toBe("gemini-2.5-flash");
  });

  it("no-ops on empty thread_config (no error)", () => {
    expect(() => migrateRetiredModels()).not.toThrow();
  });
});
