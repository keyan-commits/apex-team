import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
  execSync: vi.fn(),
}));

import { execFileSync } from "node:child_process";
import { deriveGithubRepo } from "../../src/lib/derive-github-repo";

const mockExec = execFileSync as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("deriveGithubRepo", () => {
  it("parses SSH remote → ok", () => {
    mockExec.mockReturnValue("git@github.com:acme/my-app.git\n");
    expect(deriveGithubRepo("/some/workspace")).toEqual({ repo: "acme/my-app", repoStatus: "ok" });
  });

  it("parses HTTPS remote → ok", () => {
    mockExec.mockReturnValue("https://github.com/acme/my-app\n");
    expect(deriveGithubRepo("/some/workspace")).toEqual({ repo: "acme/my-app", repoStatus: "ok" });
  });

  it("parses HTTPS remote with .git suffix → ok", () => {
    mockExec.mockReturnValue("https://github.com/acme/my-app.git\n");
    expect(deriveGithubRepo("/some/workspace")).toEqual({ repo: "acme/my-app", repoStatus: "ok" });
  });

  it("non-GitHub remote (GitLab) → non-github", () => {
    mockExec.mockReturnValue("https://gitlab.com/acme/my-app.git\n");
    expect(deriveGithubRepo("/some/workspace")).toEqual({ repo: null, repoStatus: "non-github" });
  });

  it("git throws 'No such remote' → none", () => {
    const err = Object.assign(new Error("fatal: No such remote 'origin'"), {
      stderr: "fatal: No such remote 'origin'",
    });
    mockExec.mockImplementation(() => { throw err; });
    expect(deriveGithubRepo("/some/workspace")).toEqual({ repo: null, repoStatus: "none" });
  });

  it("git throws 'not a git repository' → not-git", () => {
    const err = Object.assign(new Error("fatal: not a git repository"), {
      stderr: "fatal: not a git repository (or any of the parent directories): .git",
    });
    mockExec.mockImplementation(() => { throw err; });
    expect(deriveGithubRepo("/some/workspace")).toEqual({ repo: null, repoStatus: "not-git" });
  });

  it("git throws unrecognized error → bad-path", () => {
    const err = Object.assign(new Error("fatal: cannot change to '/no/such/path'"), {
      stderr: "fatal: cannot change to '/no/such/path': No such file or directory",
    });
    mockExec.mockImplementation(() => { throw err; });
    expect(deriveGithubRepo("/no/such/path")).toEqual({ repo: null, repoStatus: "bad-path" });
  });

  it("empty workspace string → bad-path (no git call)", () => {
    expect(deriveGithubRepo("")).toEqual({ repo: null, repoStatus: "bad-path" });
    expect(mockExec).not.toHaveBeenCalled();
  });

  it("null workspace → bad-path (no git call)", () => {
    expect(deriveGithubRepo(null)).toEqual({ repo: null, repoStatus: "bad-path" });
    expect(mockExec).not.toHaveBeenCalled();
  });
});
