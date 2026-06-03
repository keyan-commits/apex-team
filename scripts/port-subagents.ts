#!/usr/bin/env tsx
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ROLES, DEFAULT_ROLE_MODELS, ALL_ROLES } from "../src/lib/roles";
import type { RoleId } from "../src/types";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, ".claude", "agents");

const MODEL_ALIAS: Record<string, string> = {
  "claude-opus-4-8": "opus",
  "claude-opus-4-7": "opus",
  "claude-sonnet-4-6": "sonnet",
  "claude-haiku-4-5-20251001": "haiku",
};

const PLAN_C_ADAPTER = `## Plan C runtime adapter

You are running as a **Claude Code subagent**, not inside apex-team's monolithic Next.js server. The role definition below references legacy apex-team mechanisms (\`[[DISPATCH: role]]\`, \`[[HANDOFF: role]]\`, \`talk_to_*\` MCP tools, SQLite \`agent_state\`). Translate as follows when you act:

- **DISPATCH/HANDOFF blocks become advisory text.** Emit them in your output if useful — but they NO LONGER auto-fire peer turns. The outer Claude Code orchestrator reads your output and decides whether to invoke another subagent.
- **Your HANDOFF doc lives as a file** at \`coordination/handoffs/<your-role>.md\` (relative to the workspace). Read it at the start of every turn; update it before you finish. The apex-team SQLite \`agent_state\` table is gone.
- **Peer HANDOFF docs** live at the same path for each peer: \`coordination/handoffs/<peer-role>.md\`. Read them with the Read tool when you need peer context.
- **No inbox / message bus.** Cross-role communication is via files only — HANDOFF doc edits, US/ADR/test/etc. files in the workspace.
- **MCP tools**: apex-team's MCP server (\`mcp__apex-team__*\`) is gone. apex-engine MCP tools (\`mcp__apex-engine__*\`) remain available if configured in Claude Code settings.
- **Deliverables are files.** Anything you "produce" that isn't a file on disk does not count. Use Write/Edit to land artifacts in their canonical home (BA → \`requirements/\`, Architect → \`architecture/\`, UX → \`design/\`, QA → \`tests/\`, DevSecOps → \`ops/\` + \`.github/workflows/\`, Devs → \`src/\`).
- **Single-turn invocation.** Your input is one prompt; you return one response. No multi-turn dialogue within a single invocation.

Everything else in the role definition below applies unchanged.

---
`;

const QA_DISK_DISCIPLINE = `

---

## US-085 baked-in: tests are files, not chat artifacts

(Originally drafted as US-085 against apex-team; baked into this subagent definition during the Plan C port so the discipline ships with the subagent itself, no apex-team PR needed.)

**Hard rule:** every test you produce in a wave is a real file on disk at \`tests/qa/wave-NNN/<descriptive>.test.ts\` (or whichever existing \`tests/<area>/\` placement is most appropriate — \`tests/lib/\`, \`tests/be/\`, \`tests/ui/\`, \`__tests__/incidents/\` are all valid). Test code shown only in chat output does NOT count as a deliverable — the wave is incomplete by definition.

**At the end of every wave, your HANDOFF doc must contain a \`## Wave-NNN tests\` section** listing each test file path you wrote + a one-line purpose. The orchestrator (or any human) must be able to run your tests with one command without copy-pasting from chat:

\`\`\`
pnpm vitest run <path>
\`\`\`

If a test needs fixtures or helpers, those also land as files next to the test, never inline.
`;

function frontmatter(role: RoleId, model: string, description: string): string {
  // Description must be one line, no embedded newlines.
  const desc = description.replace(/\s+/g, " ").trim().slice(0, 200);
  return [
    "---",
    `name: ${role}`,
    `description: ${JSON.stringify(desc)}`,
    `model: ${MODEL_ALIAS[model] ?? "sonnet"}`,
    "---",
    "",
  ].join("\n");
}

function describe(role: RoleId): string {
  const def = ROLES[role];
  const firstSentence = def.systemPrompt
    .replace(/\*+/g, "")
    .replace(/^#+\s.*$/gm, "")
    .trim()
    .split(/[.!]\s+/)[0]
    .replace(/\s+/g, " ")
    .slice(0, 160);
  return `${def.label} for apex-team. ${firstSentence}.`;
}

function buildBody(role: RoleId): string {
  const def = ROLES[role];
  const parts: string[] = [PLAN_C_ADAPTER, def.systemPrompt];
  if (def.skills) parts.push(def.skills);
  if (role === "qa") parts.push(QA_DISK_DISCIPLINE);
  return parts.join("\n\n");
}

mkdirSync(OUT_DIR, { recursive: true });

for (const role of ALL_ROLES) {
  const model = DEFAULT_ROLE_MODELS[role];
  const content = frontmatter(role, model, describe(role)) + buildBody(role);
  const path = join(OUT_DIR, `${role}.md`);
  writeFileSync(path, content);
  console.log(`wrote ${path}  (${content.length} chars, model=${MODEL_ALIAS[model] ?? "sonnet"})`);
}

console.log(`\ndone — ${ALL_ROLES.length} subagent files in ${OUT_DIR}`);
