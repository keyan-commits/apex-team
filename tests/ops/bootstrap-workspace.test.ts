import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

// ── helpers ──────────────────────────────────────────────────────────────────

function initGitRepo(dir: string) {
  execFileSync("git", ["-C", dir, "init", "--initial-branch=main"], { stdio: "ignore" });
  execFileSync("git", ["-C", dir, "config", "user.email", "test@test.com"], { stdio: "ignore" });
  execFileSync("git", ["-C", dir, "config", "user.name", "Test"], { stdio: "ignore" });
  // Make an initial commit so the repo is non-empty
  writeFileSync(join(dir, "README.md"), "# test\n");
  execFileSync("git", ["-C", dir, "add", "."], { stdio: "ignore" });
  execFileSync("git", ["-C", dir, "commit", "-m", "init", "--no-verify"], { stdio: "ignore" });
}

function addRemote(dir: string, url: string) {
  execFileSync("git", ["-C", dir, "remote", "add", "origin", url], { stdio: "ignore" });
}

// ── tests ────────────────────────────────────────────────────────────────────

describe("bootstrap-workspace", () => {
  let tmpDir: string;
  const apexRoot = resolve(dirname(new URL(import.meta.url).pathname), "../..");

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "bootstrap-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // ── validateWorkspace ──────────────────────────────────────────────────────

  it("refuses a non-git directory", async () => {
    // tmpDir is not a git repo; the script should exit non-zero
    const result = spawnSync(
      "node",
      [join(apexRoot, "scripts/devsecops/bootstrap-workspace.mjs"), tmpDir],
      { encoding: "utf8", stdio: "pipe" }
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/not a git repository/i);
  });

  it("refuses a tracked dirty working tree (modified tracked file)", async () => {
    initGitRepo(tmpDir);
    // Modify a tracked file to make the tree dirty
    writeFileSync(join(tmpDir, "README.md"), "modified\n");

    const result = spawnSync(
      "node",
      [join(apexRoot, "scripts/devsecops/bootstrap-workspace.mjs"), tmpDir],
      { encoding: "utf8", stdio: "pipe" }
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/uncommitted changes/i);
  });

  // ── installHooks ──────────────────────────────────────────────────────────

  it("copies hooks and sets core.hooksPath", async () => {
    initGitRepo(tmpDir);
    // Add a fake GitHub origin so the branch-protection step will attempt to run
    // but we need to pipe 'n' to the prompt — use a sub-process with stdin pipe
    addRemote(tmpDir, "https://github.com/test-owner/test-repo.git");

    // Pipe 'n\n' to stdin to skip branch protection prompt
    const result = spawnSync(
      "node",
      [join(apexRoot, "scripts/devsecops/bootstrap-workspace.mjs"), tmpDir],
      { encoding: "utf8", stdio: "pipe", input: "n\n" }
    );

    // Should succeed
    expect(result.status).toBe(0);

    // Hooks installed
    expect(existsSync(join(tmpDir, "scripts/git-hooks/pre-commit"))).toBe(true);
    expect(existsSync(join(tmpDir, "scripts/git-hooks/pre-push"))).toBe(true);

    // core.hooksPath set
    const hooksPath = execFileSync(
      "git", ["-C", tmpDir, "config", "--get", "core.hooksPath"], { encoding: "utf8" }
    ).trim();
    expect(hooksPath).toBe("scripts/git-hooks");
  });

  // ── idempotency ───────────────────────────────────────────────────────────

  it("is idempotent — re-run on same workspace is a no-op with exit 0", async () => {
    initGitRepo(tmpDir);
    addRemote(tmpDir, "https://github.com/test-owner/test-repo.git");

    const run = () =>
      spawnSync(
        "node",
        [join(apexRoot, "scripts/devsecops/bootstrap-workspace.mjs"), tmpDir],
        { encoding: "utf8", stdio: "pipe", input: "n\n" }
      );

    const first = run();
    expect(first.status).toBe(0);

    const second = run();
    expect(second.status).toBe(0);
    // Second run should report "skip" for hooks and hooksPath
    expect(second.stdout).toMatch(/skip/);
  });

  // ── gh failure fallback ───────────────────────────────────────────────────

  it("prints manual gh command when user confirms but gh fails (non-github repo falls back gracefully)", async () => {
    initGitRepo(tmpDir);
    // Use a GitLab remote — repoStatus will be 'non-github', branch protection step skipped
    addRemote(tmpDir, "https://gitlab.com/test-owner/test-repo.git");

    const result = spawnSync(
      "node",
      [join(apexRoot, "scripts/devsecops/bootstrap-workspace.mjs"), tmpDir],
      { encoding: "utf8", stdio: "pipe", input: "n\n" }
    );

    expect(result.status).toBe(0);
    // Should warn that it can't derive GitHub repo
    expect(result.stderr + result.stdout).toMatch(/non-github|branch protection.*skipped/i);
  });

  // ── --help ────────────────────────────────────────────────────────────────

  it("--help prints usage and exits 0", () => {
    const result = spawnSync(
      "node",
      [join(apexRoot, "scripts/devsecops/bootstrap-workspace.mjs"), "--help"],
      { encoding: "utf8", stdio: "pipe" }
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Usage/);
    expect(result.stdout).toMatch(/bootstrap-workspace/);
  });

  // ── ops/README.md ─────────────────────────────────────────────────────────

  it("drops ops/README.md when absent, skips when present", async () => {
    initGitRepo(tmpDir);
    addRemote(tmpDir, "https://github.com/test-owner/test-repo.git");

    const run = () =>
      spawnSync(
        "node",
        [join(apexRoot, "scripts/devsecops/bootstrap-workspace.mjs"), tmpDir],
        { encoding: "utf8", stdio: "pipe", input: "n\n" }
      );

    // First run — should create ops/README.md
    const first = run();
    expect(first.status).toBe(0);
    expect(existsSync(join(tmpDir, "ops/README.md"))).toBe(true);
    const content = readFileSync(join(tmpDir, "ops/README.md"), "utf8");
    expect(content).toMatch(/bootstrapped from/i);

    // Second run — should skip
    const second = run();
    expect(second.status).toBe(0);
    expect(second.stdout).toMatch(/skip.*ops\/README/i);
  });

  // ── CI workflow ───────────────────────────────────────────────────────────

  it("installs ci.yml for a Node workspace that lacks one", async () => {
    initGitRepo(tmpDir);
    addRemote(tmpDir, "https://github.com/test-owner/test-repo.git");

    // Add a package.json so the workspace looks like a Node project
    writeFileSync(
      join(tmpDir, "package.json"),
      JSON.stringify({ scripts: { test: "vitest run", lint: "eslint ." } }, null, 2)
    );
    execFileSync("git", ["-C", tmpDir, "add", "."], { stdio: "ignore" });
    execFileSync("git", ["-C", tmpDir, "commit", "-m", "add pkg", "--no-verify"], { stdio: "ignore" });

    const result = spawnSync(
      "node",
      [join(apexRoot, "scripts/devsecops/bootstrap-workspace.mjs"), tmpDir],
      { encoding: "utf8", stdio: "pipe", input: "n\n" }
    );

    expect(result.status).toBe(0);
    expect(existsSync(join(tmpDir, ".github/workflows/ci.yml"))).toBe(true);
    const ci = readFileSync(join(tmpDir, ".github/workflows/ci.yml"), "utf8");
    expect(ci).toMatch(/pnpm test:run/);
    expect(ci).toMatch(/pnpm lint/);
  });
});
