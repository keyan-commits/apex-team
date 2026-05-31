#!/usr/bin/env node
// branch-start.mjs — create a feature branch + git worktree for a role.
// Usage: pnpm branch:start <role> <wave>-<short>
//   e.g. pnpm branch:start ui-developer 10a-workflow-ui

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const VALID_ROLES = ["ui-developer", "backend-developer", "qa", "ux-designer", "devsecops"];
const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
const ROLE_SCRIPT = {
  "ui-developer": "dev:test:ui",
  "backend-developer": "dev:test:be",
  qa: "dev:test:qa",
  "ux-designer": "dev:test:ux",
  devsecops: "dev:test",
};

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", ...opts }).trim();
}

const [role, slug] = process.argv.slice(2);

if (!role || !slug) {
  console.error("Usage: pnpm branch:start <role> <wave>-<short>");
  console.error("  e.g. pnpm branch:start ui-developer 10a-workflow-ui");
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
  console.error("Must be lowercase alphanumeric + hyphens (no leading/trailing hyphens).");
  process.exit(1);
}

const branchName = `feature/${slug}`;
const worktreePath = resolve(process.cwd(), `../apex-team-${role}-${slug}`);

// Check working tree is clean
const dirty = run("git", ["status", "--porcelain"]);
if (dirty) {
  console.error("Working tree is not clean. Commit or stash your changes first.");
  console.error(dirty);
  process.exit(1);
}

// Check current branch is main
const currentBranch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
if (currentBranch !== "main") {
  console.error(
    `You must be on main to start a feature branch (currently on: ${currentBranch}).`
  );
  process.exit(1);
}

// Check worktree path doesn't already exist
if (existsSync(worktreePath)) {
  console.error(`Worktree path already exists: ${worktreePath}`);
  console.error(`Remove it first with: pnpm branch:cleanup ${role} ${slug}`);
  process.exit(1);
}

// Check branch doesn't already exist locally
try {
  run("git", ["rev-parse", "--verify", branchName], { stdio: "pipe" });
  console.error(`Branch "${branchName}" already exists locally. Choose a different slug.`);
  process.exit(1);
} catch {
  // Branch doesn't exist — good.
}

// Fetch latest main
console.log("Fetching latest origin/main...");
run("git", ["fetch", "origin", "main"]);

// Create worktree + branch from origin/main
console.log(`Creating worktree at: ${worktreePath}`);
run("git", ["worktree", "add", worktreePath, "-b", branchName, "origin/main"]);

const devScript = ROLE_SCRIPT[role];
const needsUX = role === "ui-developer";

console.log(`
✓ Worktree created: ${worktreePath}

Next steps:
  Switch to it:    cd ${worktreePath}
  Install deps:    pnpm install
  Run your inst:   pnpm ${devScript}

When done (unit tests passing locally):
  Commit + push the branch (git push -u origin ${branchName}).
  HANDOFF to QA${needsUX ? " + UX Designer" : ""}.
  Do NOT push to main — HANDOFF to DevSecOps with QA PASS${needsUX ? " + UX PASS" : ""} evidence.
  DevSecOps will merge ${branchName} to main and push.
`);
