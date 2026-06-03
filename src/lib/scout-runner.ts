import { query } from "@anthropic-ai/claude-agent-sdk";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { apexMcpServers } from "./mcp-config";
import { recordScoutRun } from "./db";

const REPO = "keyan-commits/apex-team";
const LABEL = "skill-proposal";
const MODEL = "claude-sonnet-4-6";

export const SCOUT_ROLES = [
  "business-analyst",
  "architect",
  "ui-developer",
  "backend-developer",
  "qa",
  "devsecops",
] as const;

// apex_web_search is the apex-engine MCP tool for web search.
// web_search is listed as an alias in mcp-config's ALLOWED_APEX_TOOLS — include both
// so the agent can pick whichever the connected apex-engine exposes.
const SCOUT_ALLOWED_TOOLS = [
  "mcp__apex-engine__apex_web_search",
  "mcp__apex-engine__web_search",
];

function buildScoutPrompt(roleId: string, skills: string): string {
  return `You are a skills researcher for the ${roleId} role in a software engineering team.

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
}

function parseProposals(text: string): Array<{ title?: string; body?: string }> {
  const m =
    text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) ??
    text.match(/(\[[\s\S]*?\])/s);
  if (!m) return [];
  try {
    return JSON.parse(m[1]);
  } catch {
    return [];
  }
}

async function scoutRole(roleId: string, existingTitles: Set<string>): Promise<number> {
  const skillFile = resolve(process.cwd(), `src/lib/skills/${roleId}.ts`);
  const skills = existsSync(skillFile)
    ? readFileSync(skillFile, "utf8").slice(0, 2500)
    : "(none)";
  const prompt = buildScoutPrompt(roleId, skills);

  let responseText = "";
  for await (const msg of query({
    prompt,
    options: {
      model: MODEL,
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: "You are a skills research assistant. Use web_search to research current best practices.",
      },
      mcpServers: apexMcpServers(),
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

  const proposals = parseProposals(responseText);
  let filed = 0;
  for (const p of proposals.slice(0, 2)) {
    if (!p?.title || existingTitles.has(p.title)) continue;
    const r = spawnSync(
      "gh",
      ["issue", "create", "--repo", REPO, "--title", p.title, "--body", p.body ?? "", "--label", LABEL],
      { encoding: "utf8" },
    );
    if (r.status === 0) {
      existingTitles.add(p.title);
      console.log(`[scout] Filed: ${p.title}`);
      filed++;
    } else {
      console.warn(`[scout] gh issue create failed for ${roleId}: ${r.stderr?.trim()}`);
    }
  }
  return filed;
}

export async function runScout(): Promise<void> {
  console.log(`[scout] Starting — ${SCOUT_ROLES.length} roles`);

  const listResult = spawnSync(
    "gh",
    ["issue", "list", "--repo", REPO, "--label", LABEL, "--state", "open", "--json", "title", "--limit", "200"],
    { encoding: "utf8" },
  );
  const existingTitles = new Set<string>(
    listResult.status === 0
      ? JSON.parse(listResult.stdout).map((i: { title: string }) => i.title)
      : [],
  );

  let totalFiled = 0;
  for (const role of SCOUT_ROLES) {
    console.log(`[scout] Scouting ${role}...`);
    try {
      totalFiled += await scoutRole(role, existingTitles);
    } catch (e) {
      // Degrade gracefully per role — log and continue. Auth errors from the
      // first role propagate because the trigger route probes auth before calling runScout().
      console.warn(`[scout] ${role} error: ${e instanceof Error ? e.message : e}`);
    }
  }

  recordScoutRun(totalFiled, SCOUT_ROLES.length);
  console.log(`[scout] Complete — ${totalFiled} proposals filed`);
}
