#!/usr/bin/env node
/**
 * Daily skill scout — researches latest best practices per role via the
 * Claude Agent SDK (OAuth) + apex-engine apex_web_search MCP tool, then
 * files GitHub skill-proposal issues. Idempotent by title.
 *
 * Usage: pnpm scout
 * Requires: Claude Code logged in (`claude login`). No ANTHROPIC_API_KEY needed.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import Database from "better-sqlite3";
import { query } from "@anthropic-ai/claude-agent-sdk";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Load .env.local for APEX_MCP_URL and other non-secret config (skip keys already set)
const envFile = resolve(ROOT, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["'](.*)["']$/, "$1");
  }
}

const APEX_MCP_URL = process.env.APEX_MCP_URL?.trim() || "http://127.0.0.1:31001/mcp";
const REPO = "keyan-commits/apex-team";
const LABEL = "skill-proposal";
const MODEL = "claude-sonnet-4-6";
const ROLES = ["business-analyst", "architect", "ui-developer", "backend-developer", "qa", "devsecops"];

// apex_web_search is the load-bearing web search tool; web_search is an alias
// in some apex-engine versions — include both for compatibility.
const SCOUT_ALLOWED_TOOLS = [
  "mcp__apex-engine__apex_web_search",
  "mcp__apex-engine__web_search",
];

// --- SQLite (best-effort — app may not be running) ---
const DB_PATH = process.env.APEX_TEAM_DB_PATH
  ? resolve(ROOT, process.env.APEX_TEAM_DB_PATH)
  : resolve(ROOT, "data", "apex-team.db");

function openDb() {
  if (!existsSync(DB_PATH)) return null;
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS scout_runs (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      ran_at            INTEGER NOT NULL,
      proposals_filed   INTEGER NOT NULL DEFAULT 0,
      roles_scanned     INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS issue_cache (
      label             TEXT    PRIMARY KEY,
      count             INTEGER NOT NULL DEFAULT 0,
      updated_at        INTEGER NOT NULL
    );
  `);
  return db;
}

function parseProposals(text) {
  const m = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) ?? text.match(/(\[[\s\S]*?\])/s);
  if (!m) return [];
  try { return JSON.parse(m[1]); } catch { return []; }
}

async function scoutRole(roleId, existingTitles) {
  const skillFile = resolve(ROOT, `src/lib/skills/${roleId}.ts`);
  const skills = existsSync(skillFile) ? readFileSync(skillFile, "utf8").slice(0, 2500) : "(none)";

  const prompt = `You are a skills researcher for the ${roleId} role in a software engineering team.

Current skills file:
\`\`\`
${skills}
\`\`\`

Use web_search to find 1–2 specific, current (2025/2026) best practices or techniques that are MISSING from the above skills and would materially improve this role.

Respond with ONLY a JSON array (0–2 items, empty array [] if skills are already comprehensive):
[
  {
    "title": "[skill:${roleId}] <concise title under 70 chars>",
    "body": "**Current gap:** <1 sentence>\\n\\n**Proposed addition:** <2-3 sentences>\\n\\n**Why:** <1 sentence>\\n\\n**Source:** <URL from your search>"
  }
]`;

  let responseText = "";
  try {
    for await (const msg of query({
      prompt,
      options: {
        model: MODEL,
        systemPrompt: {
          type: "preset",
          preset: "claude_code",
          append: "You are a skills research assistant. Use web_search to research current best practices.",
        },
        mcpServers: { "apex-engine": { type: "http", url: APEX_MCP_URL } },
        allowedTools: SCOUT_ALLOWED_TOOLS,
      },
    })) {
      if (msg.type === "assistant") {
        const content = msg.message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "text" && typeof block.text === "string") {
              responseText += block.text;
            }
          }
        }
      }
    }
  } catch (e) {
    // If apex_web_search is unavailable, degrade gracefully — log and return 0
    console.warn(`[WARN] ${roleId}: query error — ${e.message}`);
    return 0;
  }

  const proposals = parseProposals(responseText);
  let filed = 0;
  for (const p of proposals.slice(0, 2)) {
    if (!p?.title || existingTitles.has(p.title)) continue;
    const r = spawnSync("gh", [
      "issue", "create", "--repo", REPO,
      "--title", p.title, "--body", p.body ?? "", "--label", LABEL,
    ], { encoding: "utf8" });
    if (r.status === 0) {
      existingTitles.add(p.title);
      console.log(`[OK] Filed: ${p.title}`);
      filed++;
    } else {
      console.warn(`[WARN] gh issue create failed for ${roleId}: ${r.stderr?.trim()}`);
    }
  }
  return filed;
}

async function main() {
  console.log(`[INFO] Skill scout starting — ${ROLES.length} roles`);
  const db = openDb();

  const listResult = spawnSync("gh", [
    "issue", "list", "--repo", REPO, "--label", LABEL,
    "--state", "open", "--json", "title", "--limit", "200",
  ], { encoding: "utf8" });
  const existingTitles = new Set(
    listResult.status === 0
      ? JSON.parse(listResult.stdout).map(i => i.title)
      : [],
  );

  let totalFiled = 0;
  for (const role of ROLES) {
    console.log(`[INFO] Scouting ${role}...`);
    try {
      totalFiled += await scoutRole(role, existingTitles);
    } catch (e) {
      console.warn(`[WARN] ${role} scout error: ${e.message}`);
    }
  }

  if (db) {
    db.prepare(
      "INSERT INTO scout_runs (ran_at, proposals_filed, roles_scanned) VALUES (?, ?, ?)"
    ).run(Date.now(), totalFiled, ROLES.length);

    for (const label of ["skill-proposal", "mcp-proposal", "self-improvement"]) {
      try {
        const r = spawnSync("gh", [
          "issue", "list", "--repo", REPO, "--label", label,
          "--state", "open", "--json", "number", "--limit", "500",
        ], { encoding: "utf8" });
        if (r.status === 0) {
          const count = JSON.parse(r.stdout).length;
          db.prepare(
            `INSERT INTO issue_cache (label, count, updated_at) VALUES (?, ?, ?)
             ON CONFLICT(label) DO UPDATE SET count=excluded.count, updated_at=excluded.updated_at`
          ).run(label, count, Date.now());
        }
      } catch { /* best-effort */ }
    }
    db.close();
  }

  console.log(`[INFO] Scout complete — ${totalFiled} proposals filed`);
}

main().catch(e => { console.error("[FAIL]", e.message); process.exit(1); });
