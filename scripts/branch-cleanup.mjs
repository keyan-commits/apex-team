#!/usr/bin/env node
// branch-cleanup.mjs — remove a worktree + optionally delete the feature branch.
// Usage: pnpm branch:cleanup <role> <wave>-<short>
//   e.g. pnpm branch:cleanup ui-developer 10a-workflow-ui
// Invoked by DevSecOps after a successful deploy to main.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const VALID_ROLES = ["ui-developer", "backend-developer", "qa", "ux-designer"];
const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", ...opts }).trim();
}

const [role, slug] = process.argv.slice(2);

if (!role || !slug) {
  console.error("Usage: pnpm branch:cleanup <role> <wave>-<short>");
  console.error("  e.g. pnpm branch:cleanup ui-developer 10a-workflow-ui");
  console.error("");
  console.error(`Valid roles: ${VALID_ROLES.join(" | ")}`);
  process.exit(1);
}

if (!VALID_ROLES.includes(role)) {
  console.error(`Invalid role: "${role}"`);
  console.error(`Valid roles: ${VALID_ROLES.join(" | ")}`);
  process.exit(1);
}

if (!SLUG_RE.test(slug)) {
  console.error(`Invalid slug: "${slug}"`);
  process.exit(1);
}

const branchName = `feature/${slug}`;
const worktreePath = resolve(process.cwd(), `../apex-team-${role}-${slug}`);

if (!existsSync(worktreePath)) {
  console.error(`Worktree not found: ${worktreePath}`);
  process.exit(1);
}

// Refuse if the worktree has uncommitted changes
const dirty = run("git", ["-C", worktreePath, "status", "--porcelain"]);
if (dirty) {
  console.error(`Worktree has uncommitted changes: ${worktreePath}`);
  console.error("Commit or stash those changes before cleanup.");
  console.error(dirty);
  process.exit(1);
}

// Remove the worktree
console.log(`Removing worktree: ${worktreePath}`);
run("git", ["worktree", "remove", worktreePath]);
console.log("✓ Worktree removed.");

// Delete the branch if it has been merged into main (-d is safe; fails if unmerged)
try {
  run("git", ["branch", "-d", branchName]);
  console.log(`✓ Branch "${branchName}" deleted (merged into main).`);
} catch {
  console.log(`  Branch "${branchName}" not deleted — it does not appear merged into main.`);
  console.log(`  After the merge lands, run: git branch -D ${branchName}`);
}
