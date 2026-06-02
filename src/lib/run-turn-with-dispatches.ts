// Wraps runTurn with the auto-trigger semantics for Product Owner
// DISPATCHes: after the target turn finishes, any [[DISPATCH: role]]
// blocks the PO emitted are run in parallel as their own runTurn calls.
// Used by EVERY path that can advance a PO turn — web UI (/api/chat,
// /api/po-dispatch), the MCP tools (talk_to_product_owner AND
// talk_to_role), and the tick scheduler. Any path that uses bare runTurn
// for a PO turn records the dispatch rows but never fans them out to the
// peers (#156: the silent-stall class).

import { appendMessage, markRoleActive, markRoleIdle } from "@/lib/db";
import { runTurn, type RunTurnInput, type RunTurnResult } from "@/lib/run-turn";
import type { TeamRoleId } from "@/types";

export interface RunTurnWithDispatchesResult extends RunTurnResult {
  peerReplies: Array<{ role: TeamRoleId; result: RunTurnResult }>;
}

export async function runTurnWithDispatches(
  input: RunTurnInput,
): Promise<RunTurnWithDispatchesResult> {
  // Mark the primary target active for the duration of its turn.
  try { markRoleActive(input.threadId, input.target); } catch {}
  let result: RunTurnResult;
  try {
    result = await runTurn(input);
  } finally {
    try { markRoleIdle(input.threadId, input.target); } catch {}
  }

  if (input.target !== "product-owner" || result.dispatches.length === 0) {
    return { ...result, peerReplies: [] };
  }

  // Parallel fan-out — each dispatched peer gets its own turn. Pass the
  // dispatch body as userMessage so the peer has an unambiguous trigger
  // and does not infer its task from the shared transcript (which
  // could cause it to answer a dispatch addressed to a different role
  // — the #137 misroute class).
  //
  // allSettled, NOT all: a single peer throwing must not reject the whole
  // fan-out and silently drop the other peers' turns. A rejected peer is
  // logged AND surfaced into the thread transcript as a synthetic message
  // so the PO sees "peer X stalled" on its next turn instead of an 8-hour
  // silence (#156 forensics).
  const settled = await Promise.allSettled(
    result.dispatches.map(async (d) => {
      try { markRoleActive(input.threadId, d.to); } catch {}
      try {
        const peerResult = await runTurn({
          threadId: input.threadId,
          target: d.to,
          userMessage: d.message,
          agents: input.agents,
          workspace: input.workspace,
          signal: input.signal,
        });
        return { role: d.to, result: peerResult };
      } finally {
        try { markRoleIdle(input.threadId, d.to); } catch {}
      }
    }),
  );

  const peerReplies = settled.flatMap((s, i) => {
    if (s.status === "fulfilled") return [s.value];
    const role = result.dispatches[i].to;
    const reason = s.reason instanceof Error ? s.reason.message : String(s.reason);
    console.error(`[runTurnWithDispatches] dispatched peer ${role} FAILED:`, s.reason);
    // Surface the failure to the PO's next-turn context. Without this the
    // dispatch row exists but no reply ever lands — the exact invisible
    // stall #156 documents.
    try {
      appendMessage(
        input.threadId,
        { kind: "user", to: "product-owner" },
        `⚠️ Dispatched peer **${role}** failed to complete its turn (the DISPATCH was recorded but produced no reply): ${reason}`,
      );
    } catch {
      // best-effort — never let failure-surfacing mask the original error
    }
    return [];
  });

  return { ...result, peerReplies };
}
