import { ALL_ROLES } from "./roles";
import type { RoleId, TeamStatus } from "../types";

interface TriggerInfo {
  id: number;
  content: string;
  createdAt: number;
  kind: "dispatch" | "user";
}

export function deriveNowAndQueued(
  lastTrigger: Map<RoleId, TriggerInfo>,
  lastAgentId: Map<RoleId, number>,
  now10mMs: number,
): { now: TeamStatus["now"]; queued: TeamStatus["queued"] } {
  const now: TeamStatus["now"] = [];
  const queued: TeamStatus["queued"] = [];

  for (const role of ALL_ROLES) {
    const trigger = lastTrigger.get(role);
    if (!trigger) continue;
    if (trigger.id <= (lastAgentId.get(role) ?? 0)) continue; // already replied

    const taskSummary = trigger.content.slice(0, 80);

    // A trigger within the last 10 minutes is "active" regardless of whether
    // agent_state.updatedAt has moved — long tool calls (web search, gh CLI,
    // Playwright) run for minutes without touching agent_state.
    if (trigger.createdAt >= now10mMs) {
      now.push({ role, taskSummary, startedAt: trigger.createdAt, state: "thinking" });
    } else {
      queued.push({
        id: trigger.id,
        toRole: role,
        fromRole: trigger.kind === "user" ? "user" : "product-owner",
        taskSummary,
        createdAt: trigger.createdAt,
      });
    }
  }

  return { now, queued };
}
