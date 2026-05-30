import type { TeamRoleId } from "@/types";

const HANDOFF_RE =
  /\[\[HANDOFF:\s*(business-analyst|developer)\s*\]\]([\s\S]*?)\[\[\/HANDOFF\]\]/gi;
const DISPATCH_RE =
  /\[\[DISPATCH:\s*(business-analyst|developer)\s*\]\]([\s\S]*?)\[\[\/DISPATCH\]\]/gi;
const NOTES_RE = /\[\[NOTES\]\]([\s\S]*?)\[\[\/NOTES\]\]/i;

export interface ParsedReply {
  /** Text shown to the user (all blocks stripped). */
  visibleText: string;
  /** Full new content for the agent's personal HANDOFF doc, or null if unchanged. */
  newHandoffDoc: string | null;
  /** Peer handoffs (BA↔Dev) — async, inbox-based, NOT auto-triggered. */
  handoffs: Array<{ to: TeamRoleId; message: string }>;
  /** Orchestrator dispatches — auto-trigger the target's turn. Only emitted by orchestrator role. */
  dispatches: Array<{ to: TeamRoleId; message: string }>;
}

export function parseAgentReply(raw: string): ParsedReply {
  let working = raw;

  const notesMatch = working.match(NOTES_RE);
  const newHandoffDoc = notesMatch ? notesMatch[1].trim() : null;
  if (notesMatch) working = working.replace(NOTES_RE, "");

  const handoffs: Array<{ to: TeamRoleId; message: string }> = [];
  working = working.replace(HANDOFF_RE, (_full, role: string, message: string) => {
    handoffs.push({ to: role.toLowerCase() as TeamRoleId, message: message.trim() });
    return "";
  });

  const dispatches: Array<{ to: TeamRoleId; message: string }> = [];
  working = working.replace(DISPATCH_RE, (_full, role: string, message: string) => {
    dispatches.push({ to: role.toLowerCase() as TeamRoleId, message: message.trim() });
    return "";
  });

  return {
    visibleText: working.trim(),
    newHandoffDoc,
    handoffs,
    dispatches,
  };
}
