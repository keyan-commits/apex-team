// Wraps runTurn with the auto-trigger semantics for Product Owner
// DISPATCHes: after the target turn finishes, any [[DISPATCH: role]]
// blocks the PO emitted are run in parallel as their own runTurn calls.
// Web-UI path only (/api/chat + /api/po-dispatch). The MCP path
// uses runTurn directly so the HTTP response is not held open for the
// fan-out chain duration.

import { runTurn, type RunTurnInput, type RunTurnResult } from "@/lib/run-turn";
import type { TeamRoleId } from "@/types";

export interface RunTurnWithDispatchesResult extends RunTurnResult {
  peerReplies: Array<{ role: TeamRoleId; result: RunTurnResult }>;
}

export async function runTurnWithDispatches(
  input: RunTurnInput,
): Promise<RunTurnWithDispatchesResult> {
  const result = await runTurn(input);

  if (input.target !== "product-owner" || result.dispatches.length === 0) {
    return { ...result, peerReplies: [] };
  }

  // Parallel fan-out — each dispatched peer gets its own turn. Pass the
  // dispatch body as userMessage so the peer has an unambiguous trigger
  // and does not infer its task from the shared transcript (which
  // could cause it to answer a dispatch addressed to a different role
  // — the #137 misroute class).
  const peerReplies = await Promise.all(
    result.dispatches.map(async (d) => {
      const peerResult = await runTurn({
        threadId: input.threadId,
        target: d.to,
        userMessage: d.message,
        agents: input.agents,
        workspace: input.workspace,
        signal: input.signal,
      });
      return { role: d.to, result: peerResult };
    }),
  );

  return { ...result, peerReplies };
}
