import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

// ── helpers ──────────────────────────────────────────────────────────────────

function initGitRepo(dir: string) {
  execFileSync("git", ["-C", dir, "init", "--initial-branch=main"], { stdio: "ignore" });
  execFileSync("git", ["-C", dir, "config", "user.email", "test@test.com"], { stdio: "ignore" });
  execFileSync("git", ["-C", dir, "config", "user.name", "Test"], { stdio: "ignore" });
  writeFileSync(join(dir, "README.md"), "# test\n");
  execFileSync("git", ["-C", dir, "add", "."], { stdio: "ignore" });
  execFileSync("git", ["-C", dir, "commit", "-m", "init", "--no-verify"], { stdio: "ignore" });
}

const apexRoot = resolve(dirname(new URL(import.meta.url).pathname), "../..");
const branchStartScript = join(apexRoot, "scripts/branch-start.mjs");
const branchCleanupScript = join(apexRoot, "scripts/branch-cleanup.mjs");

// ── tests ────────────────────────────────────────────────────────────────────

describe("branch-start hygiene check", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "hygiene-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("branch-start — does not refuse on dirty main checkout (worktree branches from origin/main, not cwd)", () => {
    // After the validateMainCleanliness() call was removed, branch-start must NOT exit
    // with dirty-state messaging. It may fail for other reasons (no remote), but not
    // because the working tree has uncommitted changes.
    initGitRepo(tmpDir);
    writeFileSync(join(tmpDir, "dirty.txt"), "untracked\n");

    const result = spawnSync("node", [branchStartScript, "devsecops", "test-wave"], {
      encoding: "utf8",
      cwd: tmpDir,
    });
    expect(result.stderr).not.toMatch(/uncommitted changes/);
    expect(result.stderr).not.toMatch(/git stash/);
  });
});

describe("branch-cleanup VALID_ROLES", () => {
  it("accepts devsecops as a valid role", () => {
    // Passes role validation, then fails on the missing worktree path
    const result = spawnSync("node", [branchCleanupScript, "devsecops", "test-slug"], {
      encoding: "utf8",
      cwd: apexRoot,
    });
    // Should exit 1 with "worktree not found" — not "invalid role"
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Worktree not found");
    expect(result.stderr).not.toContain("Invalid role");
  });

  it("refuses an invalid role with clear message", () => {
    const result = spawnSync("node", [branchCleanupScript, "product-owner", "test-slug"], {
      encoding: "utf8",
      cwd: apexRoot,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Invalid role");
  });
});
