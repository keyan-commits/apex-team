// Shared helper used by both /api/chat (the web UI initiator) and the
// MCP tool handlers (external Claude Code). Runs one agent turn, parses
// its reply, persists NOTES + HANDOFF + DISPATCH rows, AND publishes
// every observable event onto the thread's event bus so any subscriber
// (the dashboard, future watchers) sees it.

import { appendMessage, setAgentHandoffDoc, setThreadAgentModels, recordTurnUsage, stampTurnAt } from "@/lib/db";
import { runAgentTurn } from "@/lib/agents";
import { parseAgentReply } from "@/lib/orchestrator";
import { publish } from "@/lib/event-bus";
import { ALL_ROLES } from "@/lib/roles";
import { DEFAULT_MODELS } from "@/lib/providers";
import type { AgentConfig, RoleId, TeamRoleId } from "@/types";

export interface RunTurnInput {
  threadId: string;
  target: RoleId;
  userMessage?: string;
  agents: Record<RoleId, AgentConfig>;
  workspace?: string;
  signal: AbortSignal;
}

export interface RunTurnResult {
  visibleText: string;
  rawBuffer: string;
  newHandoffDoc: string | null;
  handoffs: Array<{ to: TeamRoleId | "product-owner"; message: string }>;
  dispatches: Array<{ to: TeamRoleId; message: string; model?: string }>;
  agentModels: Record<string, string> | null;
}

export async function runTurn(input: RunTurnInput): Promise<RunTurnResult> {
  if (input.userMessage && input.userMessage.trim()) {
    const trimmed = input.userMessage.trim();
    appendMessage(input.threadId, { kind: "user", to: input.target }, trimmed);
    publish(input.threadId, {
      type: "user-message",
      role: input.target,
      text: trimmed,
    });
  }

  publish(input.threadId, { type: "turn-start", role: input.target });

  const cfg = input.agents[input.target];
  const model = cfg?.model ?? DEFAULT_MODELS.claude;

  let buffer = "";
  try {
    for await (const chunk of runAgentTurn({
      threadId: input.threadId,
      role: input.target,
      agents: input.agents,
      cwd: input.workspace,
      signal: input.signal,
      onUsage: (usage) => {
        try {
          recordTurnUsage(input.threadId, input.target, model, usage);
        } catch { /* best-effort — never fail a turn over usage tracking */ }
      },
    })) {
      buffer += chunk;
      publish(input.threadId, { type: "delta", role: input.target, text: chunk });
    }
  } catch (err) {
    try { stampTurnAt(input.threadId, input.target); } catch { /* best-effort */ }
    publish(input.threadId, {
      type: "error",
      role: input.target,
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  try { stampTurnAt(input.threadId, input.target); } catch { /* best-effort */ }
  const { visibleText, newHandoffDoc, handoffs, dispatches, agentModels } = parseAgentReply(buffer);

  appendMessage(
    input.threadId,
    { kind: "agent", role: input.target },
    visibleText || buffer.trim(),
  );

  if (newHandoffDoc !== null) {
    setAgentHandoffDoc(input.threadId, input.target, newHandoffDoc);
    publish(input.threadId, {
      type: "notes-updated",
      role: input.target,
      handoffDoc: newHandoffDoc,
    });
  }

  // Peer handoffs — only valid from non-PO roles. PO uses DISPATCH.
  if (input.target !== "product-owner") {
    for (const h of handoffs) {
      appendMessage(
        input.threadId,
        {
          kind: "handoff",
          from: input.target as TeamRoleId,
          // The protocol allows escalating to PO; we widen at the boundary.
          to: h.to as TeamRoleId,
        },
        h.message,
      );
      publish(input.threadId, {
        type: "handoff",
        from: input.target as TeamRoleId,
        to: h.to as TeamRoleId,
        message: h.message,
      });
    }
  }

  // Dispatches — only valid from PO. Caller is responsible for auto-triggering
  // each dispatched role; this function just persists + publishes the row.
  if (input.target === "product-owner") {
    // Wave 79 (#171): PO outbound HANDOFFs silently vanish — the handoff-persist
    // loop above skips PO turns, so nothing fans them out. Promote each HANDOFF
    // to a synthetic DISPATCH so it inherits DISPATCH fan-out semantics.
    // Peer→peer HANDOFFs are NOT promoted here (sender ≠ PO); the rescue sweep
    // in tick-scheduler handles those.
    for (const h of handoffs) {
      if (h.to === "product-owner") continue; // PO cannot dispatch itself
      dispatches.push({ to: h.to as TeamRoleId, message: h.message });
      console.warn(`[run-turn] auto-promoted PO HANDOFF→DISPATCH to ${h.to} (#171)`);
    }

    for (const d of dispatches) {
      appendMessage(input.threadId, { kind: "dispatch", to: d.to }, d.message);
      publish(input.threadId, {
        type: "dispatch",
        to: d.to,
        message: d.message,
      });
    }
  }

  // PO-only: persist + broadcast per-role model overrides for this thread.
  // Filter against ALL_ROLES before persisting to prevent unknown keys from
  // accumulating in thread_config if the PO emits malformed role names.
  if (input.target === "product-owner" && agentModels) {
    const knownRoles = new Set<string>(ALL_ROLES);
    const filtered = Object.fromEntries(
      Object.entries(agentModels).filter(([k]) => knownRoles.has(k)),
    ) as Record<RoleId, string>;
    setThreadAgentModels(input.threadId, filtered);
    publish(input.threadId, { type: "agent-models", agentModels: filtered });
  }

  publish(input.threadId, {
    type: "turn-end",
    role: input.target,
    text: visibleText,
  });

  return { visibleText, rawBuffer: buffer, newHandoffDoc, handoffs, dispatches, agentModels };
}
