import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Each test gets an isolated temp dir so flag-file state never bleeds between cases.
let tmpDir: string;
let dbPath: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "apex-db-crash-safety-"));
  dbPath = join(tmpDir, "test.db");
  process.env.APEX_TEAM_DB_PATH = dbPath;
  vi.resetModules();
});

afterEach(() => {
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  delete process.env.APEX_TEAM_DB_PATH;
  vi.resetModules();
});

describe("db migration crash-safety (#319)", () => {
  describe("AC-3: _schema_version table — normal path", () => {
    it("records all migrations as success=1 on a clean DB", async () => {
      const mod = await import("@/lib/db");
      // Trigger db() by calling any exported function
      mod.getMostRecentThreadId();

      // Read _schema_version directly via a fresh better-sqlite3 connection
      const Database = (await import("better-sqlite3")).default;
      const conn = new Database(dbPath, { readonly: true });
      const rows = conn
        .prepare(`SELECT version, success FROM _schema_version ORDER BY version ASC`)
        .all() as Array<{ version: number; success: number }>;
      conn.close();

      // All 4 known migrations applied with success=1
      expect(rows.length).toBeGreaterThanOrEqual(4);
      for (const row of rows) {
        expect(row.success).toBe(1);
      }
      const versions = rows.map((r) => r.version);
      expect(versions).toContain(1);
      expect(versions).toContain(2);
      expect(versions).toContain(3);
      expect(versions).toContain(4);
    });

    it("skips already-applied migrations on second boot (no flag file created)", async () => {
      // First boot — applies all migrations
      const mod1 = await import("@/lib/db");
      mod1.getMostRecentThreadId();

      // Second boot with same DB file
      vi.resetModules();
      process.env.APEX_TEAM_DB_PATH = dbPath;
      const mod2 = await import("@/lib/db");
      // Should not throw — no flag file written when nothing is pending
      expect(() => mod2.getMostRecentThreadId()).not.toThrow();

      // Flag file must NOT exist (nothing was pending)
      expect(existsSync(join(tmpDir, ".migration-in-flight"))).toBe(false);
    });

    it("WAL journal mode is active after db() initialisation", async () => {
      const mod = await import("@/lib/db");
      mod.getMostRecentThreadId();

      const Database = (await import("better-sqlite3")).default;
      const conn = new Database(dbPath, { readonly: true });
      const result = conn.pragma("journal_mode") as Array<{ journal_mode: string }>;
      conn.close();
      expect(result[0]?.journal_mode).toBe("wal");
    });
  });

  describe("AC-2: in-flight flag guard — simulated crash", () => {
    it("refuses to boot when .migration-in-flight flag file exists", async () => {
      // Simulate a crash: write the flag file before db() runs
      writeFileSync(join(tmpDir, ".migration-in-flight"), String(Date.now()));

      const mod = await import("@/lib/db");
      expect(() => mod.getMostRecentThreadId()).toThrowError(
        /MIGRATION CRASH DETECTED/,
      );
    });

    it("error message includes the flag file path", async () => {
      const flagPath = join(tmpDir, ".migration-in-flight");
      writeFileSync(flagPath, String(Date.now()));

      const mod = await import("@/lib/db");
      let caughtMessage = "";
      try {
        mod.getMostRecentThreadId();
      } catch (err) {
        caughtMessage = (err as Error).message;
      }
      expect(caughtMessage).toContain(flagPath);
      expect(caughtMessage).toContain("db-recovery.md");
    });
  });

  describe("AC-4 resume: boot succeeds after manual flag removal", () => {
    it("applies pending migrations cleanly once flag is removed", async () => {
      // Simulate prior crash: flag exists, DB has no migrations yet
      const flagPath = join(tmpDir, ".migration-in-flight");
      writeFileSync(flagPath, String(Date.now()));

      // First import attempt — should throw
      const mod1 = await import("@/lib/db");
      expect(() => mod1.getMostRecentThreadId()).toThrowError(/MIGRATION CRASH DETECTED/);

      // Operator removes the flag (manual repair)
      rmSync(flagPath);

      // Second boot — fresh module, same DB path, flag gone
      vi.resetModules();
      process.env.APEX_TEAM_DB_PATH = dbPath;
      const mod2 = await import("@/lib/db");

      // Should succeed and complete migrations
      expect(() => mod2.getMostRecentThreadId()).not.toThrow();

      // Flag must be gone (removed on success)
      expect(existsSync(flagPath)).toBe(false);

      // _schema_version records successful migrations
      const Database = (await import("better-sqlite3")).default;
      const conn = new Database(dbPath, { readonly: true });
      const rows = conn
        .prepare(`SELECT version, success FROM _schema_version WHERE success = 1`)
        .all() as Array<{ version: number; success: number }>;
      conn.close();
      expect(rows.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("AC-1: migration atomicity — idempotency on existing columns", () => {
    it("does not crash when columns already exist (existing-DB transition)", async () => {
      // Boot once — applies all migrations, records in _schema_version
      const mod1 = await import("@/lib/db");
      mod1.getMostRecentThreadId();

      // Simulate an upgrade where _schema_version is wiped but columns already exist
      const Database = (await import("better-sqlite3")).default;
      const conn = new Database(dbPath);
      conn.exec(`DELETE FROM _schema_version`);
      conn.close();

      vi.resetModules();
      process.env.APEX_TEAM_DB_PATH = dbPath;
      const mod2 = await import("@/lib/db");

      // tableColumns() guards prevent duplicate ALTER TABLE — must not throw
      expect(() => mod2.getMostRecentThreadId()).not.toThrow();

      // All versions re-recorded
      const conn2 = new Database(dbPath, { readonly: true });
      const rows = conn2
        .prepare(`SELECT version, success FROM _schema_version WHERE success = 1 ORDER BY version`)
        .all() as Array<{ version: number; success: number }>;
      conn2.close();
      expect(rows.length).toBeGreaterThanOrEqual(4);
    });
  });
});
