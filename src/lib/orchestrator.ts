import type { TeamRoleId } from "@/types";

const TEAM_ROLE_PATTERN =
  "business-analyst|architect|ui-developer|backend-developer|qa|devsecops";

const HANDOFF_RE = new RegExp(
  `\\[\\[HANDOFF:\\s*(${TEAM_ROLE_PATTERN}|product-owner)\\s*\\]\\]([\\s\\S]*?)\\[\\[/HANDOFF\\]\\]`,
  "gi",
);
const DISPATCH_RE = new RegExp(
  `\\[\\[DISPATCH:\\s*(${TEAM_ROLE_PATTERN})\\s*\\]\\]([\\s\\S]*?)\\[\\[/DISPATCH\\]\\]`,
  "gi",
);
const NOTES_RE = /\[\[NOTES\]\]([\s\S]*?)\[\[\/NOTES\]\]/i;

export interface ParsedReply {
  /** Text shown to the user (all blocks stripped). */
  visibleText: string;
  /** Full new content for the agent's HANDOFF doc, or null if unchanged. */
  newHandoffDoc: string | null;
  /** Peer handoffs (BA/Arch/UI/BE/QA/DevSecOps or escalations to PO) — async, no auto-trigger. */
  handoffs: Array<{ to: TeamRoleId | "product-owner"; message: string }>;
  /** Product Owner dispatches — auto-trigger the target peer's turn. */
  dispatches: Array<{ to: TeamRoleId; message: string }>;
}

export function parseAgentReply(raw: string): ParsedReply {
  let working = raw;

  const notesMatch = working.match(NOTES_RE);
  const newHandoffDoc = notesMatch ? notesMatch[1].trim() : null;
  if (notesMatch) working = working.replace(NOTES_RE, "");

  const handoffs: Array<{ to: TeamRoleId | "product-owner"; message: string }> = [];
  working = working.replace(HANDOFF_RE, (_full, role: string, message: string) => {
    handoffs.push({
      to: role.toLowerCase() as TeamRoleId | "product-owner",
      message: message.trim(),
    });
    return "";
  });

  const dispatches: Array<{ to: TeamRoleId; message: string }> = [];
  working = working.replace(DISPATCH_RE, (_full, role: string, message: string) => {
    dispatches.push({
      to: role.toLowerCase() as TeamRoleId,
      message: message.trim(),
    });
    return "";
  });

  return {
    visibleText: working.trim(),
    newHandoffDoc,
    handoffs,
    dispatches,
  };
}
