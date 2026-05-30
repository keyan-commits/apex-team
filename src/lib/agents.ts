import type { AgentConfig, ChatMessage, RoleId } from "@/types";
import { getAgentState, listMessages, listPendingInbox } from "./db";
import { defaultAgentConfig, streamAgent } from "./providers";
import { TEAM_ROLES, isTeamRole } from "./roles";

export interface AgentTurnInput {
  threadId: string;
  role: RoleId;
  agents: Record<RoleId, AgentConfig>;
  /** Working directory the agent's file tools (Read/Edit/Bash) operate on. */
  cwd?: string;
  signal: AbortSignal;
}

// Loads the role's persistent state + thread history + pending inbox,
// then streams the role's reply.
//
// Behavior differs by role:
//   - BA / Dev: sees inbox (handoffs to them) + own HANDOFF doc.
//   - Orchestrator: sees both peers' HANDOFF docs; no inbox concept.
export async function* runAgentTurn(input: AgentTurnInput): AsyncGenerator<string> {
  const cfg = input.agents[input.role] ?? defaultAgentConfig(input.role);
  const history: ChatMessage[] = listMessages(input.threadId);
  const state = getAgentState(input.threadId, input.role);

  if (input.role === "orchestrator") {
    const peerStates = TEAM_ROLES.map((r) => getAgentState(input.threadId, r));
    yield* streamAgent(
      cfg,
      history,
      { handoffDoc: state.handoffDoc, pendingInbox: [], peerStates, cwd: input.cwd },
      input.signal,
    );
    return;
  }

  const pendingInbox = isTeamRole(input.role)
    ? listPendingInbox(input.threadId, input.role)
    : [];
  yield* streamAgent(
    cfg,
    history,
    { handoffDoc: state.handoffDoc, pendingInbox, cwd: input.cwd },
    input.signal,
  );
}
