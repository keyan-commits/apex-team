import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Use vi.resetModules + dynamic import so APEX_TEAM_DB_PATH is set
// before db.ts evaluates its module-level DB_PATH constant.
const tmpDir = mkdtempSync(join(tmpdir(), "apex-db-test-"));

describe("thread workspace helpers", () => {
  let getThreadWorkspace: (threadId: string) => string | null;
  let setThreadWorkspace: (threadId: string, workspace: string) => void;

  beforeAll(async () => {
    process.env.APEX_TEAM_DB_PATH = join(tmpDir, "test.db");
    vi.resetModules();
    const mod = await import("@/lib/db");
    getThreadWorkspace = mod.getThreadWorkspace;
    setThreadWorkspace = mod.setThreadWorkspace;
  });

  afterAll(() => {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  });

  it("returns null for unknown thread", () => {
    expect(getThreadWorkspace("nonexistent-thread")).toBeNull();
  });

  it("round-trips set → get", () => {
    setThreadWorkspace("t1", "/workspace/lfm");
    expect(getThreadWorkspace("t1")).toBe("/workspace/lfm");
  });

  it("overwrites on second set (idempotent)", () => {
    setThreadWorkspace("t2", "/workspace/a");
    setThreadWorkspace("t2", "/workspace/b");
    expect(getThreadWorkspace("t2")).toBe("/workspace/b");
  });
});
