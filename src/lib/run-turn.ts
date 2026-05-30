// Shared helper used by both /api/chat (streaming, web UI) and the MCP
// tool handlers (non-streaming, external Claude Code). Encapsulates the
// "run one agent turn, parse its reply, persist NOTES + HANDOFF + DISPATCH
// rows" logic so both surfaces stay consistent.

import { appendMessage, setAgentHandoffDoc } from "@/lib/db";
import { runAgentTurn } from "@/lib/agents";
import { parseAgentReply } from "@/lib/orchestrator";
import type { AgentConfig, RoleId, TeamRoleId } from "@/types";

export interface RunTurnInput {
  threadId: string;
  target: RoleId;
  userMessage?: string;
  agents: Record<RoleId, AgentConfig>;
  workspace?: string;
  signal: AbortSignal;
  /** Called with each text chunk as the model emits it. Optional. */
  onChunk?: (chunk: string) => void;
}

export interface RunTurnResult {
  visibleText: string;
  rawBuffer: string;
  newHandoffDoc: string | null;
  handoffs: Array<{ to: TeamRoleId | "product-owner"; message: string }>;
  dispatches: Array<{ to: TeamRoleId; message: string }>;
}

export async function runTurn(input: RunTurnInput): Promise<RunTurnResult> {
  if (input.userMessage && input.userMessage.trim()) {
    appendMessage(
      input.threadId,
      { kind: "user", to: input.target },
      input.userMessage.trim(),
    );
  }

  let buffer = "";
  for await (const chunk of runAgentTurn({
    threadId: input.threadId,
    role: input.target,
    agents: input.agents,
    cwd: input.workspace,
    signal: input.signal,
  })) {
    buffer += chunk;
    input.onChunk?.(chunk);
  }

  const { visibleText, newHandoffDoc, handoffs, dispatches } = parseAgentReply(buffer);

  appendMessage(
    input.threadId,
    { kind: "agent", role: input.target },
    visibleText || buffer.trim(),
  );

  if (newHandoffDoc !== null) {
    setAgentHandoffDoc(input.threadId, input.target, newHandoffDoc);
  }

  // Peer handoffs — only valid from non-PO roles. PO uses DISPATCH.
  if (input.target !== "product-owner") {
    for (const h of handoffs) {
      appendMessage(
        input.threadId,
        {
          kind: "handoff",
          from: input.target as TeamRoleId,
          // The protocol allows escalating to PO; we widen the type at the boundary.
          to: h.to as TeamRoleId,
        },
        h.message,
      );
    }
  }

  // Dispatches — only valid from PO. Caller is responsible for auto-triggering
  // each dispatched role; this function just persists the dispatch row.
  if (input.target === "product-owner") {
    for (const d of dispatches) {
      appendMessage(input.threadId, { kind: "dispatch", to: d.to }, d.message);
    }
  }

  return { visibleText, rawBuffer: buffer, newHandoffDoc, handoffs, dispatches };
}
