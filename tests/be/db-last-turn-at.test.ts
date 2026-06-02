import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Use a temp DB so tests are isolated from each other and from production data.
const tmpDir = mkdtempSync(join(tmpdir(), "apex-db-last-turn-at-"));

describe("last_turn_at / stampTurnAt (US-052)", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mod: any;

  beforeAll(async () => {
    process.env.APEX_TEAM_DB_PATH = join(tmpDir, "test.db");
    vi.resetModules();
    mod = await import("@/lib/db");
  });

  afterAll(() => {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  });

  it("IDLE_THRESHOLD_MS is 15 minutes", () => {
    expect(mod.IDLE_THRESHOLD_MS).toBe(15 * 60 * 1000);
  });

  it("fresh row returns lastTurnAt: null", () => {
    const state = mod.getAgentState("t-fresh", "qa");
    expect(state.lastTurnAt).toBeNull();
  });

  it("stampTurnAt sets lastTurnAt without touching handoff_doc or updatedAt on a new row", () => {
    const before = Date.now();
    mod.stampTurnAt("t-stamp", "backend-developer");
    const state = mod.getAgentState("t-stamp", "backend-developer");
    expect(state.lastTurnAt).not.toBeNull();
    expect(state.lastTurnAt).toBeGreaterThanOrEqual(before);
    // stampTurnAt inserts a placeholder row — handoff_doc stays empty
    expect(state.handoffDoc).toBe("");
    // updated_at stays at 0 (placeholder row, no NOTES written)
    expect(state.updatedAt).toBe(0);
  });

  it("stampTurnAt preserves existing handoff_doc and updatedAt when row already exists", () => {
    mod.setAgentHandoffDoc("t-existing", "architect", "## My notes");
    const before = mod.getAgentState("t-existing", "architect");
    expect(before.handoffDoc).toBe("## My notes");

    mod.stampTurnAt("t-existing", "architect");
    const after = mod.getAgentState("t-existing", "architect");
    expect(after.handoffDoc).toBe("## My notes");
    expect(after.updatedAt).toBe(before.updatedAt);
    expect(after.lastTurnAt).not.toBeNull();
  });

  it("idempotent migration: second db() init with existing column does not crash", async () => {
    // Re-init the module with the SAME DB file (column already exists).
    // The try/catch in the migration block must absorb the duplicate-column error.
    vi.resetModules();
    const mod2 = await import("@/lib/db");
    expect(typeof mod2.stampTurnAt).toBe("function");
    expect(typeof mod2.IDLE_THRESHOLD_MS).toBe("number");
    const state = mod2.getAgentState("t-reimport", "qa");
    expect(state.lastTurnAt).toBeNull();
  });
});
