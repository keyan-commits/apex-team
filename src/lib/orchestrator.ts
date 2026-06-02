import type { TeamRoleId } from "@/types";

const TEAM_ROLE_PATTERN =
  "business-analyst|architect|ui-developer|backend-developer|qa|devsecops|ux-designer";

// Body excludes nested openers — without this, a strict regex following an
// unclosed opener greedily absorbs subsequent openers into its body until it
// finds ANY closer (#164 regression).
const BODY_NO_NESTED_OPENERS = `((?:(?!\\n\\[\\[DISPATCH:|\\n\\[\\[HANDOFF:)[\\s\\S])*?)`;
const HANDOFF_RE = new RegExp(
  `(?:^|\\n)\\[\\[HANDOFF:\\s*(${TEAM_ROLE_PATTERN}|product-owner)\\s*\\]\\]\\n${BODY_NO_NESTED_OPENERS}\\n\\[\\[/HANDOFF\\]\\]`,
  "gi",
);
const DISPATCH_RE = new RegExp(
  `(?:^|\\n)\\[\\[DISPATCH:\\s*(${TEAM_ROLE_PATTERN})(?:\\s+model:([\\w.-]+))?\\s*\\]\\]\\n${BODY_NO_NESTED_OPENERS}\\n\\[\\[/DISPATCH\\]\\]`,
  "gi",
);

// Tolerant fallbacks for openers without matching `[[/X]]` closers — observed
// drift in PO replies post-Wave-65 (#164): the model often emits the opener
// then bleeds the body into a `Reply:` paragraph or a `---` section break
// without ever closing. Strict regex above yields zero matches → fan-out
// silently short-circuits. These fallbacks terminate the body at the first
// of: next opener (DISPATCH or HANDOFF), a `---` horizontal-rule line, or
// end-of-text. Strict closers are still preferred (matched first); these
// only run on the remainder.
const DISPATCH_OPENER_RE = new RegExp(
  `(?:^|\\n)\\[\\[DISPATCH:\\s*(${TEAM_ROLE_PATTERN})(?:\\s+model:([\\w.-]+))?\\s*\\]\\]\\n`,
  "i",
);
const HANDOFF_OPENER_RE = new RegExp(
  `(?:^|\\n)\\[\\[HANDOFF:\\s*(${TEAM_ROLE_PATTERN}|product-owner)\\s*\\]\\]\\n`,
  "i",
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

/**
 * Find the index where an unclosed block's body should end. Terminator is
 * the first occurrence (after `startIdx`) of: next DISPATCH opener, next
 * HANDOFF opener, a `---` line on its own, or end-of-text. Returns the
 * absolute index in `text` where the body ends (exclusive).
 */
function findUnclosedBodyEnd(text: string, startIdx: number): number {
  const slice = text.slice(startIdx);
  let nearest = slice.length;
  for (const re of [
    /\n\[\[DISPATCH:/,
    /\n\[\[HANDOFF:/,
    /\n---\s*(?:\n|$)/,
  ]) {
    const m = slice.match(re);
    if (m && m.index !== undefined && m.index < nearest) nearest = m.index;
  }
  return startIdx + nearest;
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
  // Strict matches first (preserves existing properly-closed behavior).
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

  // Tolerant fallback pass — handle DISPATCH openers that never got closed.
  // Iterates because each replacement shrinks `working`.
  while (true) {
    const m = working.match(DISPATCH_OPENER_RE);
    if (!m || m.index === undefined) break;
    const role = m[1].toLowerCase() as TeamRoleId;
    const model = m[2] as string | undefined;
    const bodyStart = m.index + m[0].length;
    const bodyEnd = findUnclosedBodyEnd(working, bodyStart);
    const message = working.slice(bodyStart, bodyEnd).trim();
    console.warn(
      `[parseAgentReply] DISPATCH to ${role} missing [[/DISPATCH]] closer — auto-terminated at offset ${bodyEnd} (length ${working.length}). PO prompt drift (#164).`,
    );
    dispatches.push({
      to: role,
      message,
      ...(model ? { model } : {}),
    });
    working = working.slice(0, m.index) + working.slice(bodyEnd);
  }

  // Same tolerant fallback for HANDOFF openers.
  while (true) {
    const m = working.match(HANDOFF_OPENER_RE);
    if (!m || m.index === undefined) break;
    const role = m[1].toLowerCase() as TeamRoleId | "product-owner";
    const bodyStart = m.index + m[0].length;
    const bodyEnd = findUnclosedBodyEnd(working, bodyStart);
    const message = working.slice(bodyStart, bodyEnd).trim();
    console.warn(
      `[parseAgentReply] HANDOFF to ${role} missing [[/HANDOFF]] closer — auto-terminated at offset ${bodyEnd} (length ${working.length}). PO prompt drift (#164).`,
    );
    handoffs.push({
      to: role,
      message,
    });
    working = working.slice(0, m.index) + working.slice(bodyEnd);
  }

  return {
    visibleText: working.trim(),
    newHandoffDoc,
    handoffs,
    dispatches,
    agentModels,
  };
}
