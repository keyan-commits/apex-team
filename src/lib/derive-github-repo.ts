import { execFileSync } from "node:child_process";

/**
 * Derive "owner/repo" from the git remote of a workspace path.
 * Returns null for non-GitHub remotes, missing remotes, non-git
 * directories, or empty input.
 *
 * Lives outside the Next.js route file because route files restrict
 * exports to the handler shape (GET/POST/etc.) — any other export
 * triggers a type error against `.next/types/...` generated routing
 * validators.
 */
export function deriveGithubRepo(workspace: string | null): string | null {
  if (!workspace?.trim()) return null;
  try {
    const url = execFileSync("git", ["-C", workspace, "remote", "get-url", "origin"], {
      timeout: 3000,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
    // SSH: git@github.com:owner/repo[.git]
    const ssh = url.match(/^git@github\.com:([^/]+\/[^.]+?)(?:\.git)?$/);
    if (ssh) return ssh[1];
    // HTTPS: https://github.com/owner/repo[.git][?#...]
    const https = url.match(/^https?:\/\/github\.com\/([^/]+\/[^.]+?)(?:\.git)?(?:[?#].*)?$/);
    if (https) return https[1];
    return null; // non-GitHub remote (GitLab, self-hosted, etc.)
  } catch {
    return null; // no remote, not a git repo, path missing
  }
}
