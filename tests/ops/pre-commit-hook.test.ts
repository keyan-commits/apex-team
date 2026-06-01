import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const apexRoot = resolve(dirname(new URL(import.meta.url).pathname), "../..");
const hookPath = join(apexRoot, ".githooks/pre-commit");

function initRepo(dir: string) {
  execFileSync("git", ["-C", dir, "init", "--initial-branch=main"], { stdio: "ignore" });
  execFileSync("git", ["-C", dir, "config", "user.email", "test@test.com"], { stdio: "ignore" });
  execFileSync("git", ["-C", dir, "config", "user.name", "Test"], { stdio: "ignore" });
  // initial commit so the repo is valid
  writeFileSync(join(dir, "README.md"), "# test\n");
  execFileSync("git", ["-C", dir, "add", "."], { stdio: "ignore" });
  execFileSync("git", ["-C", dir, "commit", "-m", "init", "--no-verify"], { stdio: "ignore" });
}

function stageFile(dir: string, path: string, content = "content\n") {
  const full = join(dir, path);
  mkdirSync(join(dir, path, ".."), { recursive: true });
  writeFileSync(full, content);
  execFileSync("git", ["-C", dir, "add", path], { stdio: "ignore" });
}

function runHook(dir: string) {
  return spawnSync("sh", [hookPath], { encoding: "utf8", cwd: dir });
}

describe("pre-commit hook", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "hook-test-"));
    initRepo(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("exits 0 when code + HANDOFF.md are both staged", () => {
    stageFile(tmpDir, "src/lib/foo.ts", 'export const x = 1;\n');
    stageFile(tmpDir, "HANDOFF.md", "## NOW\nsome update\n");
    const result = runHook(tmpDir);
    expect(result.status).toBe(0);
  });

  it("exits 1 when code is staged but HANDOFF.md is not", () => {
    stageFile(tmpDir, "src/lib/foo.ts", 'export const x = 1;\n');
    const result = runHook(tmpDir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("HANDOFF.md is not");
    expect(result.stderr).toContain("--no-verify");
  });

  it("exits 0 when only a doc file (no code path) is staged without HANDOFF.md", () => {
    stageFile(tmpDir, "NOTES.md", "just notes\n");
    const result = runHook(tmpDir);
    expect(result.status).toBe(0);
  });

  it("exits 0 when handoff.requireOnCommit is set to false", () => {
    execFileSync("git", ["-C", tmpDir, "config", "handoff.requireOnCommit", "false"], { stdio: "ignore" });
    stageFile(tmpDir, "src/lib/foo.ts", 'export const x = 1;\n');
    const result = runHook(tmpDir);
    expect(result.status).toBe(0);
  });

  it("hook file is executable", () => {
    const mode = statSync(hookPath).mode;
    expect(mode & 0o111).not.toBe(0);
  });
});
