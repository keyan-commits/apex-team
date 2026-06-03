import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ── US-038: listActiveTickThreads try/catch ───────────────────────────────────
//
// Tests the real src/lib/db.ts against a temp SQLite database (mirroring
// the db.test.ts pattern). No @/lib/db mock here — we test the real function.

const tmpDir = mkdtempSync(join(tmpdir(), "apex-db-84-test-"));

describe.sequential("US-038 — listActiveTickThreads try/catch (AC1–AC4)", () => {
  let listActiveTickThreads: (windowMs: number) => string[];
  let logTick: (...args: unknown[]) => void;

  beforeAll(async () => {
    process.env.APEX_TEAM_DB_PATH = join(tmpDir, "test.db");
    vi.resetModules();
    const mod = await import("@/lib/db");
    listActiveTickThreads = mod.listActiveTickThreads;
    // cast to avoid TS overload noise in tests — we only care about the first 7 args
    logTick = mod.logTick as unknown as (...args: unknown[]) => void;
  });

  afterAll(() => {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  });

  it("AC4 normal path: returns [] when no ticks have been logged", async () => {
    // Fresh module + DB to guarantee clean state (previous tests may have polluted the shared DB)
    const freshDir = mkdtempSync(join(tmpdir(), "apex-db-84-empty-"));
    process.env.APEX_TEAM_DB_PATH = join(freshDir, "empty.db");
    vi.resetModules();
    const freshMod = await import("@/lib/db");
    const result = freshMod.listActiveTickThreads(7_200_000);
    expect(result).toEqual([]);
    try { rmSync(freshDir, { recursive: true, force: true }); } catch {}
    // Restore shared DB for remaining tests
    process.env.APEX_TEAM_DB_PATH = join(tmpDir, "test.db");
    vi.resetModules();
    const mod = await import("@/lib/db");
    listActiveTickThreads = mod.listActiveTickThreads;
    logTick = mod.logTick as unknown as (...args: unknown[]) => void;
  });

  it("AC4 normal path: returns thread id after a tick is logged in the window", () => {
    const now = new Date().toISOString();
    logTick("thread-x", 1, 100, 1, false, now, now, 0, 0);

    const result = listActiveTickThreads(7_200_000);
    expect(result).toContain("thread-x");
  });

  it("AC4 normal path: does NOT return a thread outside the window", () => {
    // tick logged 3 hours ago — outside the 2-hour window
    const oldTs = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    logTick("thread-old", 1, 0, 0, true, oldTs, oldTs, 0, 0);

    const result = listActiveTickThreads(7_200_000);
    expect(result).not.toContain("thread-old");
  });

  it("AC1+AC3: returns [] and emits warn when the DB query fails (table dropped)", async () => {
    // Load db.ts fresh so the singleton _db is null, but point it to a fresh
    // temp path. Then directly execute a DROP so the query fails.
    const freshDir = mkdtempSync(join(tmpdir(), "apex-db-84-err-"));
    process.env.APEX_TEAM_DB_PATH = join(freshDir, "err.db");
    vi.resetModules();

    // Import and initialize db by calling a trivial function that opens the DB
    const freshMod = await import("@/lib/db");
    // Open the DB (forces schema creation)
    freshMod.getMostRecentThreadId();

    // Now drop tick_log to make listActiveTickThreads fail
    // We use the DB constructor directly via better-sqlite3
    const Database = (await import("better-sqlite3")).default;
    const rawDb = new Database(join(freshDir, "err.db"));
    rawDb.exec("DROP TABLE tick_log");
    rawDb.close();

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = freshMod.listActiveTickThreads(7_200_000);

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toBe("[db] listActiveTickThreads error: ");
    expect(warnSpy.mock.calls[0][1]).toBeInstanceOf(Error);

    warnSpy.mockRestore();
    try { rmSync(freshDir, { recursive: true, force: true }); } catch {}

    // Restore original path for any subsequent tests
    process.env.APEX_TEAM_DB_PATH = join(tmpDir, "test.db");
  });

  it("AC2: rearmActiveThreads does not throw when listActiveTickThreads returns []", async () => {
    // Fresh module context — listActiveTickThreads returns [] (no ticks in a new DB)
    const freshDir2 = mkdtempSync(join(tmpdir(), "apex-db-84-rearm-"));
    process.env.APEX_TEAM_DB_PATH = join(freshDir2, "rearm.db");
    vi.resetModules();

    vi.doMock("@/lib/stall-detector", () => ({
      evaluateStall: vi.fn(() => null),
      recordStallEvent: vi.fn(() => false),
      ackStallEvent: vi.fn(),
    }));
    vi.doMock("@/lib/run-turn-with-dispatches", () => ({
      runTurnWithDispatches: vi.fn().mockResolvedValue({
        dispatches: [], visibleText: "", rawBuffer: "",
        newHandoffDoc: null, handoffs: [], agentModels: null, peerReplies: [],
      }),
    }));
    vi.doMock("@/lib/roles", () => ({
      ALL_ROLES: ["product-owner"],
      TEAM_ROLES: [],
      DEFAULT_ROLE_MODELS: { "product-owner": "claude-opus-4-8" },
    }));
    vi.doMock("node:child_process", () => ({
      execSync: vi.fn(() => { throw new Error("not in tests"); }),
    }));

    const { rearmActiveThreads } = await import("@/lib/tick-scheduler");

    expect(() => rearmActiveThreads()).not.toThrow();

    try { rmSync(freshDir2, { recursive: true, force: true }); } catch {}
    process.env.APEX_TEAM_DB_PATH = join(tmpDir, "test.db");
  });
});
