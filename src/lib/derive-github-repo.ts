import { execFileSync } from "node:child_process";
import type { RepoStatus } from "@/types";

export interface RepoInfo {
  repo: string | null;
  repoStatus: RepoStatus;
}

/**
 * Derive "owner/repo" from the git remote of a workspace path.
 * Returns a RepoInfo with repo + repoStatus discriminating 4 failure
 * causes so the UI can show accurate per-case copy.
 *
 * Lives outside the Next.js route file because route files restrict
 * exports to the handler shape (GET/POST/etc.) — any other export
 * triggers a type error against `.next/types/...` generated routing
 * validators.
 */
export function deriveGithubRepo(workspace: string | null): RepoInfo {
  if (!workspace?.trim()) return { repo: null, repoStatus: "bad-path" };
  try {
    const url = execFileSync("git", ["-C", workspace, "remote", "get-url", "origin"], {
      timeout: 3000,
      stdio: ["ignore", "pipe", "pipe"],  // capture stderr for error discrimination
      encoding: "utf8",
    }).trim();
    // SSH: git@github.com:owner/repo[.git]
    const ssh = url.match(/^git@github\.com:([^/]+\/[^.]+?)(?:\.git)?$/);
    if (ssh) return { repo: ssh[1], repoStatus: "ok" };
    // HTTPS: https://github.com/owner/repo[.git][?#...]
    const https = url.match(/^https?:\/\/github\.com\/([^/]+\/[^.]+?)(?:\.git)?(?:[?#].*)?$/);
    if (https) return { repo: https[1], repoStatus: "ok" };
    return { repo: null, repoStatus: "non-github" };
  } catch (err: unknown) {
    const stderr = (err as { stderr?: string }).stderr ?? "";
    if (stderr.includes("not a git repository")) return { repo: null, repoStatus: "not-git" };
    if (stderr.includes("No such remote")) return { repo: null, repoStatus: "none" };
    return { repo: null, repoStatus: "bad-path" };
  }
}
