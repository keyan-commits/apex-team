#!/usr/bin/env node
// branch-start.mjs — create a feature branch from main with safety checks.
// Usage: pnpm branch:start <wave>-<short>
//   e.g. pnpm branch:start 10a-workflow-ui

import { execFileSync } from "node:child_process";

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", ...opts }).trim();
}

const slug = process.argv[2];

if (!slug) {
  console.error("Usage: pnpm branch:start <wave>-<short>");
  console.error("  e.g. pnpm branch:start 10a-workflow-ui");
  process.exit(1);
}

if (!SLUG_RE.test(slug)) {
  console.error(`Invalid slug: "${slug}"`);
  console.error("Must be lowercase alphanumeric + hyphens (no leading/trailing hyphens).");
  process.exit(1);
}

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
  console.error(`You must be on main to start a feature branch (currently on: ${currentBranch}).`);
  process.exit(1);
}

const branchName = `feature/${slug}`;

// Check branch doesn't already exist
try {
  run("git", ["rev-parse", "--verify", branchName], { stdio: "pipe" });
  // If we reach here, the branch exists
  console.error(`Branch "${branchName}" already exists. Choose a different slug.`);
  process.exit(1);
} catch {
  // Branch doesn't exist — good.
}

// Pull latest main
console.log("Pulling latest main...");
run("git", ["pull", "origin", "main"]);

// Create the feature branch
run("git", ["checkout", "-b", branchName]);
console.log(`\n✓ Created and switched to branch: ${branchName}\n`);

console.log("Next steps:");
console.log("  UI Developer  → pnpm dev:test:ui   (port 3110, isolated DB)");
console.log("  BE Developer  → pnpm dev:test:be   (port 3120, isolated DB)");
console.log("  UX Designer   → pnpm dev:test:ux   (port 3130, isolated DB)");
console.log("");
console.log("When your work is done + unit tests pass:");
console.log("  HANDOFF to QA (and UX Designer if UI changes).");
console.log("  Do NOT push directly — HANDOFF to DevSecOps with QA PASS + UX PASS evidence.");
console.log("  DevSecOps will merge feature/" + slug + " to main and push.");
