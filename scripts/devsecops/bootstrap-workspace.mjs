#!/usr/bin/env node
// Usage: pnpm devsecops:bootstrap-workspace [workspace-path]
//        node scripts/devsecops/bootstrap-workspace.mjs [workspace-path]
//
// Installs apex-team's enforcement recipe (hooks, CI template, branch protection)
// into any git workspace. Idempotent — safe to re-run.

import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APEX_ROOT = resolve(__dirname, "../..");
const ws = resolve(process.argv[2] ?? process.cwd());

const HOOKS_SRC = join(APEX_ROOT, "scripts/git-hooks");
const HOOKS = ["pre-commit", "pre-push"];

const BRANCH_PROTECTION_PAYLOAD = {
  required_status_checks: { strict: true, contexts: ["build"] },
  enforce_admins: true,
  required_pull_request_reviews: {
    dismiss_stale_reviews: true,
    require_code_owner_reviews: false,
    required_approving_review_count: 0,
  },
  restrictions: null,
  allow_force_pushes: false,
  allow_deletions: false,
  block_creations: false,
};

// ── helpers ──────────────────────────────────────────────────────────────────

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
}

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

function log(msg) { process.stdout.write(`[bootstrap] ${msg}\n`); }
function skip(msg) { process.stdout.write(`[bootstrap] skip: ${msg}\n`); }
function warn(msg) { process.stderr.write(`[bootstrap] warn: ${msg}\n`); }

// ── Step 0: validate workspace ───────────────────────────────────────────────

function validateWorkspace(ws) {
  try {
    run("git", ["-C", ws, "rev-parse", "--git-dir"]);
  } catch {
    throw new Error(`Not a git repository: ${ws}`);
  }
  // Only refuse tracked changes (modified, staged, deleted) — untracked files are fine.
  const dirty = spawnSync("git", ["-C", ws, "status", "--porcelain"], { encoding: "utf8" })
    .stdout
    .split("\n")
    .filter((l) => l.length >= 2 && l.slice(0, 2) !== "??" && l.trim())
    .join("\n");
  if (dirty.trim()) {
    throw new Error(
      `Working tree has uncommitted changes in ${ws}.\nCommit or stash changes before bootstrapping.\n${dirty.trim()}`
    );
  }
}

// ── Step 1: derive GitHub repo ───────────────────────────────────────────────

function deriveRepo(ws) {
  try {
    const url = run("git", ["-C", ws, "remote", "get-url", "origin"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const ssh = url.match(/^git@github\.com:([^/]+\/[^.]+?)(?:\.git)?$/);
    if (ssh) return { repo: ssh[1], repoStatus: "ok" };
    const https = url.match(/^https?:\/\/github\.com\/([^/]+\/[^.]+?)(?:\.git)?(?:[?#].*)?$/);
    if (https) return { repo: https[1], repoStatus: "ok" };
    return { repo: null, repoStatus: "non-github" };
  } catch (err) {
    const stderr = (err?.stderr ?? "").toString();
    if (stderr.includes("not a git repository")) return { repo: null, repoStatus: "not-git" };
    if (stderr.includes("No such remote")) return { repo: null, repoStatus: "none" };
    return { repo: null, repoStatus: "bad-path" };
  }
}

// ── Step 2: install hooks ────────────────────────────────────────────────────

async function installHooks(ws) {
  const dst = join(ws, "scripts/git-hooks");
  mkdirSync(dst, { recursive: true });

  for (const hook of HOOKS) {
    const srcFile = join(HOOKS_SRC, hook);
    const dstFile = join(dst, hook);

    if (!existsSync(srcFile)) {
      warn(`Source hook not found: ${srcFile} — skipping ${hook}`);
      continue;
    }

    const srcContent = readFileSync(srcFile, "utf8");

    if (existsSync(dstFile)) {
      const existing = readFileSync(dstFile, "utf8");
      if (existing === srcContent) {
        skip(`hook ${hook} already up to date`);
        continue;
      }
      process.stdout.write(`\n[bootstrap] Hook ${hook} differs from source. Diff:\n`);
      const diff = spawnSync("diff", ["-u", dstFile, srcFile], { encoding: "utf8" });
      process.stdout.write(diff.stdout || "(no diff output)\n");
      const answer = await prompt(`  Overwrite ${hook}? [y/N] `);
      if (answer.trim().toLowerCase() !== "y") {
        skip(`hook ${hook} (user chose not to overwrite)`);
        continue;
      }
    }

    writeFileSync(dstFile, srcContent, { mode: 0o755 });
    chmodSync(dstFile, 0o755);
    log(`installed hook: ${hook}`);
  }

  // Set core.hooksPath
  try {
    const current = run("git", ["-C", ws, "config", "--get", "core.hooksPath"]).trim();
    if (current === "scripts/git-hooks") {
      skip("core.hooksPath already set to scripts/git-hooks");
    } else {
      run("git", ["-C", ws, "config", "core.hooksPath", "scripts/git-hooks"]);
      log("set core.hooksPath = scripts/git-hooks");
    }
  } catch {
    // config --get exits 1 when key not set
    run("git", ["-C", ws, "config", "core.hooksPath", "scripts/git-hooks"]);
    log("set core.hooksPath = scripts/git-hooks");
  }
}

// ── Step 3: install CI workflow stub ─────────────────────────────────────────

function installCIWorkflow(ws) {
  const pkgPath = join(ws, "package.json");
  if (!existsSync(pkgPath)) {
    skip("CI workflow — no package.json found (non-Node workspace)");
    return;
  }

  const destDir = join(ws, ".github/workflows");
  const destFile = join(destDir, "ci.yml");

  if (existsSync(destFile)) {
    skip("CI workflow already exists (.github/workflows/ci.yml)");
    return;
  }

  let pkg = {};
  try { pkg = JSON.parse(readFileSync(pkgPath, "utf8")); } catch { /* ignore */ }

  const scripts = pkg.scripts ?? {};
  const testCmd = scripts.test ? "pnpm test:run" : "echo 'no test script defined'";
  const lintCmd = scripts.lint ? "pnpm lint" : "echo 'no lint script defined'";

  const ciYml = `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Tests
        run: ${testCmd}
      - name: Lint
        run: ${lintCmd}
        continue-on-error: true
`;

  mkdirSync(destDir, { recursive: true });
  writeFileSync(destFile, ciYml);
  log("installed .github/workflows/ci.yml (stub — review and adjust for your project)");
}

// ── Step 4: apply branch protection ──────────────────────────────────────────

async function applyBranchProtection(ws, repo) {
  const payloadStr = JSON.stringify(BRANCH_PROTECTION_PAYLOAD, null, 2);

  process.stdout.write("\n[bootstrap] Branch protection payload:\n");
  process.stdout.write(payloadStr + "\n\n");
  process.stdout.write(`  This will apply to: github.com/${repo}/branches/main\n`);
  process.stdout.write("  enforce_admins: true — no direct push, even for repo owner.\n\n");

  const answer = await prompt(`[bootstrap] Apply branch protection to ${repo}/main? [y/N] `);
  if (answer.trim().toLowerCase() !== "y") {
    printManualBranchProtection(repo, payloadStr);
    return;
  }

  // Write payload to a temp file so we can pass --input
  const tmpFile = join(tmpdir(), `bootstrap-protection-${Date.now()}.json`);
  writeFileSync(tmpFile, payloadStr);

  const result = spawnSync(
    "gh",
    ["api", "-X", "PUT", `/repos/${repo}/branches/main/protection`, "--input", tmpFile],
    { encoding: "utf8" }
  );

  if (result.status === 0) {
    log(`branch protection applied to ${repo}/main`);
  } else {
    warn("gh api call failed — printing manual fallback:");
    process.stderr.write((result.stderr ?? "") + "\n");
    printManualBranchProtection(repo, payloadStr);
  }
}

function printManualBranchProtection(repo, payloadStr) {
  process.stdout.write("\n[bootstrap] Run this manually to apply branch protection:\n\n");
  process.stdout.write(
    `  gh api -X PUT /repos/${repo}/branches/main/protection \\\n` +
    `    --input <(echo '${payloadStr.replace(/'/g, "'\\''")}') \n\n`
  );
  process.stdout.write("  Or with curl:\n");
  process.stdout.write(
    `  curl -X PUT \\\n` +
    `    -H "Authorization: Bearer <YOUR_TOKEN>" \\\n` +
    `    -H "Accept: application/vnd.github+json" \\\n` +
    `    https://api.github.com/repos/${repo}/branches/main/protection \\\n` +
    `    -d '${payloadStr.replace(/'/g, "'\\''")}'\n\n`
  );
}

// ── Step 5: drop ops/README.md if absent ─────────────────────────────────────

function dropOpsReadme(ws) {
  const opsDir = join(ws, "ops");
  const readmePath = join(opsDir, "README.md");

  if (existsSync(readmePath)) {
    skip("ops/README.md already exists");
    return;
  }

  mkdirSync(opsDir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  writeFileSync(
    readmePath,
    `# ops\n\nBootstrapped from [apex-team](https://github.com/keyan-commits/apex-team) on ${date}.\n\nDevSecOps lane: CI config, deployment manifests, secrets documentation, and runtime security.\n`
  );
  log("created ops/README.md");
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (process.argv[2] === "--help" || process.argv[2] === "-h") {
    process.stdout.write(
      "Usage: pnpm devsecops:bootstrap-workspace [workspace-path]\n\n" +
      "Installs apex-team enforcement recipe into a workspace:\n" +
      "  1. Validates workspace is a clean git repo\n" +
      "  2. Installs pre-commit + pre-push hooks → scripts/git-hooks/\n" +
      "  3. Sets git core.hooksPath = scripts/git-hooks\n" +
      "  4. Installs .github/workflows/ci.yml (Node workspaces only)\n" +
      "  5. Applies GitHub branch protection (interactive confirmation required)\n" +
      "  6. Creates ops/README.md if absent\n\n" +
      "Idempotent — safe to re-run on the same workspace.\n"
    );
    process.exit(0);
  }

  log(`target workspace: ${ws}`);

  validateWorkspace(ws);
  log("workspace validated (git repo, clean tree)");

  const { repo, repoStatus } = deriveRepo(ws);
  if (repo) {
    log(`GitHub repo: ${repo}`);
  } else {
    warn(`could not derive GitHub repo (status: ${repoStatus}) — branch protection step will be skipped`);
  }

  await installHooks(ws);
  installCIWorkflow(ws);
  if (repo) {
    await applyBranchProtection(ws, repo);
  }
  dropOpsReadme(ws);

  log("Done.");
}

main().catch((e) => { process.stderr.write(`[bootstrap] error: ${e.message}\n`); process.exit(1); });
