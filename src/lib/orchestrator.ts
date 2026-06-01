import type { TeamRoleId } from "@/types";

const TEAM_ROLE_PATTERN =
  "business-analyst|architect|ui-developer|backend-developer|qa|devsecops";

const HANDOFF_RE = new RegExp(
  `(?:^|\\n)\\[\\[HANDOFF:\\s*(${TEAM_ROLE_PATTERN}|product-owner)\\s*\\]\\]\\n([\\s\\S]*?)\\n\\[\\[/HANDOFF\\]\\]`,
  "gi",
);
const DISPATCH_RE = new RegExp(
  `(?:^|\\n)\\[\\[DISPATCH:\\s*(${TEAM_ROLE_PATTERN})(?:\\s+model:([\\w.-]+))?\\s*\\]\\]\\n([\\s\\S]*?)\\n\\[\\[/DISPATCH\\]\\]`,
  "gi",
);
const NOTES_RE = /(?:^|\n)\[\[NOTES\]\]\n([\s\S]*?)\n\[\[\/NOTES\]\]/i;
const AGENT_MODELS_RE = /(?:^|\n)\[\[AGENT-MODELS\]\]\n([\s\S]*?)\n\[\[\/AGENT-MODELS\]\]/i;

export interface ParsedReply {
  /** Text shown to the user (all blocks stripped). */
  visibleText: string;
  /** Full new content for the agent's HANDOFF doc, or null if unchanged. */
  newHandoffDoc: string | null;
  /** Peer handoffs (BA/Arch/UI/BE/QA/DevSecOps or escalations to PO) — async, no auto-trigger. */
  handoffs: Array<{ to: TeamRoleId | "product-owner"; message: string }>;
  /** Product Owner dispatches — auto-trigger the target peer's turn. */
  dispatches: Array<{ to: TeamRoleId; message: string; model?: string }>;
  /** Per-role model overrides emitted by PO on thread init; null if block absent. */
  agentModels: Record<string, string> | null;
}

export function parseAgentReply(raw: string): ParsedReply {
  let working = raw;

  const notesMatch = working.match(NOTES_RE);
  const newHandoffDoc = notesMatch ? notesMatch[1].trim() : null;
  if (notesMatch) working = working.replace(NOTES_RE, "");

  const agentModelsMatch = working.match(AGENT_MODELS_RE);
  let agentModels: Record<string, string> | null = null;
  if (agentModelsMatch) {
    agentModels = {};
    for (const line of agentModelsMatch[1].trim().split("\n")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const role = line.slice(0, colonIdx).trim();
      const model = line.slice(colonIdx + 1).trim();
      if (role && model) agentModels[role] = model;
    }
    working = working.replace(AGENT_MODELS_RE, "");
  }

  const handoffs: Array<{ to: TeamRoleId | "product-owner"; message: string }> = [];
  working = working.replace(HANDOFF_RE, (_full, role: string, message: string) => {
    handoffs.push({
      to: role.toLowerCase() as TeamRoleId | "product-owner",
      message: message.trim(),
    });
    return "";
  });

  const dispatches: Array<{ to: TeamRoleId; message: string; model?: string }> = [];
  working = working.replace(DISPATCH_RE, (_full, role: string, model: string | undefined, message: string) => {
    dispatches.push({
      to: role.toLowerCase() as TeamRoleId,
      message: message.trim(),
      ...(model ? { model } : {}),
    });
    return "";
  });

  return {
    visibleText: working.trim(),
    newHandoffDoc,
    handoffs,
    dispatches,
    agentModels,
  };
}
