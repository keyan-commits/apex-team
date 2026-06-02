// Wave 72 — tests for the 4 new state tables: wave_queue, pr_status, peer_idle, pipeline_state.
import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tmpDir = mkdtempSync(join(tmpdir(), "apex-wave-state-test-"));

type DbModule = typeof import("@/lib/db");
let db: DbModule;

beforeAll(async () => {
  process.env.APEX_TEAM_DB_PATH = join(tmpDir, "test.db");
  vi.resetModules();
  db = await import("@/lib/db");
});

afterAll(() => {
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
});

describe("wave_queue", () => {
  it("upserts a new wave and lists it", () => {
    db.upsertWaveQueue("t1", 72, { title: "State externalization", status: "active", priority: 1 });
    const rows = db.listWaveQueue("t1");
    expect(rows).toHaveLength(1);
    expect(rows[0].wave).toBe(72);
    expect(rows[0].status).toBe("active");
    expect(rows[0].title).toBe("State externalization");
  });

  it("updates an existing wave via upsert (idempotent)", () => {
    db.upsertWaveQueue("t1", 72, { status: "done" });
    const rows = db.listWaveQueue("t1");
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("done");
  });

  it("orders by priority then wave number", () => {
    db.upsertWaveQueue("t2", 73, { title: "Wave 73", priority: 2 });
    db.upsertWaveQueue("t2", 71, { title: "Wave 71", priority: 1 });
    db.upsertWaveQueue("t2", 74, { title: "Wave 74", priority: 1 });
    const rows = db.listWaveQueue("t2");
    expect(rows.map((r) => r.wave)).toEqual([71, 74, 73]);
  });

  it("is scoped per thread_id", () => {
    db.upsertWaveQueue("threadA", 1, { title: "A" });
    db.upsertWaveQueue("threadB", 1, { title: "B" });
    expect(db.listWaveQueue("threadA")[0].title).toBe("A");
    expect(db.listWaveQueue("threadB")[0].title).toBe("B");
  });
});

describe("pr_status", () => {
  it("upserts a PR and lists it", () => {
    db.upsertPrStatus("t1", 162, { title: "feat(latency)", status: "merged", sha: "abc123" });
    const rows = db.listPrStatus("t1", true);
    expect(rows).toHaveLength(1);
    expect(rows[0].prNumber).toBe(162);
    expect(rows[0].status).toBe("merged");
    expect(rows[0].sha).toBe("abc123");
  });

  it("open-only filter returns only open PRs", () => {
    db.upsertPrStatus("t3", 200, { title: "open pr", status: "open" });
    db.upsertPrStatus("t3", 201, { title: "merged pr", status: "merged" });
    const open = db.listPrStatus("t3");
    expect(open).toHaveLength(1);
    expect(open[0].prNumber).toBe(200);
  });

  it("updates existing PR via upsert", () => {
    db.upsertPrStatus("t3", 200, { status: "merged", sha: "deadbeef" });
    const open = db.listPrStatus("t3");
    expect(open).toHaveLength(0);
    const all = db.listPrStatus("t3", true);
    const pr = all.find((r) => r.prNumber === 200);
    expect(pr?.status).toBe("merged");
    expect(pr?.sha).toBe("deadbeef");
  });
});

describe("peer_idle", () => {
  it("markRoleActive sets is_idle=false and records last_active_at", () => {
    db.markRoleActive("t1", "backend-developer");
    const rows = db.listPeerIdle("t1", "backend-developer");
    expect(rows).toHaveLength(1);
    expect(rows[0].isIdle).toBe(false);
    expect(rows[0].lastActiveAt).toBeTypeOf("number");
  });

  it("markRoleIdle sets is_idle=true", () => {
    db.markRoleActive("t4", "qa");
    db.markRoleIdle("t4", "qa");
    const rows = db.listPeerIdle("t4", "qa");
    expect(rows[0].isIdle).toBe(true);
  });

  it("listPeerIdle without role returns all roles for thread", () => {
    db.markRoleActive("t5", "architect");
    db.markRoleActive("t5", "qa");
    const all = db.listPeerIdle("t5");
    expect(all.length).toBe(2);
    expect(all.map((r) => r.role).sort()).toEqual(["architect", "qa"]);
  });

  it("is scoped per thread_id", () => {
    db.markRoleActive("threadX", "qa");
    db.markRoleActive("threadY", "qa");
    const x = db.listPeerIdle("threadX", "qa");
    const y = db.listPeerIdle("threadY", "qa");
    expect(x[0].isIdle).toBe(false);
    expect(y[0].isIdle).toBe(false);
    // Marking idle in X doesn't affect Y.
    db.markRoleIdle("threadX", "qa");
    expect(db.listPeerIdle("threadX", "qa")[0].isIdle).toBe(true);
    expect(db.listPeerIdle("threadY", "qa")[0].isIdle).toBe(false);
  });
});

describe("pipeline_state (KV)", () => {
  it("sets and gets a value", () => {
    db.setPipelineState("t1", "open_issue_count", "42");
    const row = db.getPipelineState("t1", "open_issue_count");
    expect(row?.value).toBe("42");
  });

  it("overwrites on second set (idempotent)", () => {
    db.setPipelineState("t1", "current_wave", "72");
    db.setPipelineState("t1", "current_wave", "73");
    expect(db.getPipelineState("t1", "current_wave")?.value).toBe("73");
  });

  it("returns null for unknown key", () => {
    expect(db.getPipelineState("t1", "no_such_key")).toBeNull();
  });

  it("listPipelineState returns all KV rows for a thread", () => {
    db.setPipelineState("t6", "k1", "v1");
    db.setPipelineState("t6", "k2", "v2");
    const rows = db.listPipelineState("t6");
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.key).sort()).toEqual(["k1", "k2"]);
  });

  it("is scoped per thread_id", () => {
    db.setPipelineState("scope1", "key", "alpha");
    db.setPipelineState("scope2", "key", "beta");
    expect(db.getPipelineState("scope1", "key")?.value).toBe("alpha");
    expect(db.getPipelineState("scope2", "key")?.value).toBe("beta");
  });
});
