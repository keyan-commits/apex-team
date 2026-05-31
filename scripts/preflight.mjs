#!/usr/bin/env node
// Verifies all apex-team prerequisites are met before starting the server.
// Usage: pnpm preflight  (or: node scripts/preflight.mjs)
// Exit 0 = all checks pass; exit 1 = one or more checks failed.

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

// Load .env.local into process.env so checks can see configured values.
const envLocal = resolve(ROOT, ".env.local");
if (existsSync(envLocal)) {
  for (const line of readFileSync(envLocal, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

let allPassed = true;

function pass(msg) {
  console.log(`[PASS] ${msg}`);
}

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  allPassed = false;
}

// 1. Node version >= 20
const [major] = process.versions.node.split(".").map(Number);
if (major >= 20) {
  pass(`Node.js version: ${process.versions.node} (>= 20 required)`);
} else {
  fail(`Node.js version: ${process.versions.node} — need >= 20 (22+ recommended)`);
}

// 2. Required env vars
const APEX_MCP_URL = process.env.APEX_MCP_URL ?? "http://127.0.0.1:31001/mcp";
pass(`APEX_MCP_URL: ${APEX_MCP_URL}`);

// Gemini/Groq keys are optional; warn if absent (won't fail — Claude works without them)
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  console.log("[INFO] GOOGLE_GENERATIVE_AI_API_KEY not set — Gemini agents unavailable");
}
if (!process.env.GROQ_API_KEY) {
  console.log("[INFO] GROQ_API_KEY not set — Groq/Llama agents unavailable");
}

// 3. apex-engine MCP reachable
try {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  const res = await fetch(APEX_MCP_URL, { signal: controller.signal });
  clearTimeout(timer);
  pass(`apex-engine MCP reachable at ${APEX_MCP_URL} (HTTP ${res.status})`);
} catch {
  fail(`apex-engine MCP unreachable at ${APEX_MCP_URL} — run: cd ../apex-engine && pnpm setup`);
}

// 4. gh CLI authenticated
try {
  execSync("gh auth status", { stdio: "ignore" });
  pass("gh CLI authenticated");
} catch {
  fail("gh CLI not authenticated — run: gh auth login");
}

process.exit(allPassed ? 0 : 1);
