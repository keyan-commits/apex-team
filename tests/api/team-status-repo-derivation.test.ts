import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
  execSync: vi.fn(),
}));

import { execFileSync } from "node:child_process";
import { deriveGithubRepo } from "../../src/app/api/team-status/route";

const mockExec = execFileSync as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("deriveGithubRepo", () => {
  it("parses SSH remote", () => {
    mockExec.mockReturnValue("git@github.com:acme/my-app.git\n");
    expect(deriveGithubRepo("/some/workspace")).toBe("acme/my-app");
  });

  it("parses HTTPS remote", () => {
    mockExec.mockReturnValue("https://github.com/acme/my-app\n");
    expect(deriveGithubRepo("/some/workspace")).toBe("acme/my-app");
  });

  it("parses HTTPS remote with .git suffix", () => {
    mockExec.mockReturnValue("https://github.com/acme/my-app.git\n");
    expect(deriveGithubRepo("/some/workspace")).toBe("acme/my-app");
  });

  it("returns null for non-GitHub remote (GitLab)", () => {
    mockExec.mockReturnValue("https://gitlab.com/acme/my-app.git\n");
    expect(deriveGithubRepo("/some/workspace")).toBeNull();
  });

  it("returns null when git throws (no remote configured)", () => {
    mockExec.mockImplementation(() => { throw new Error("fatal: No such remote 'origin'"); });
    expect(deriveGithubRepo("/some/workspace")).toBeNull();
  });

  it("returns null for empty workspace string", () => {
    expect(deriveGithubRepo("")).toBeNull();
    expect(mockExec).not.toHaveBeenCalled();
  });

  it("returns null for null workspace", () => {
    expect(deriveGithubRepo(null)).toBeNull();
    expect(mockExec).not.toHaveBeenCalled();
  });
});
