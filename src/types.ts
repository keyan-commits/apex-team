// The two role-specialized team members. HANDOFF / inbox / per-pane state
// all assume this narrower union. Use `RoleId` (the wider union below) for
// anything that includes the orchestrator.
export type TeamRoleId = "business-analyst" | "developer";

// All addressable agents in the system. The orchestrator drives the team
// via DISPATCH (auto-trigger); BA & Dev are peers that communicate via
// HANDOFF (async-inbox).
export type RoleId = TeamRoleId | "orchestrator";

export type Provider = "claude" | "gemini" | "groq";

export interface RoleDefinition {
  id: RoleId;
  label: string;
  shortLabel: string;
  accent: "ba" | "dev" | "orch";
  systemPrompt: string;
}

export interface AgentConfig {
  role: RoleId;
  provider: Provider;
  model: string;
}

export type MessageAuthor =
  | { kind: "user"; to?: RoleId }
  | { kind: "agent"; role: RoleId }
  // System-generated entries shown in the orchestrator pane (slash command
  // outputs, "dispatched → Dev" confirmations). Distinct from the
  // orchestrator's own LLM replies, which use `{ kind: "agent"; role: "orchestrator" }`.
  | { kind: "orchestrator" }
  | { kind: "handoff"; from: TeamRoleId; to: TeamRoleId }
  | { kind: "dispatch"; to: TeamRoleId };

export interface ChatMessage {
  id: number;
  threadId: string;
  author: MessageAuthor;
  content: string;
  createdAt: number;
}

export interface AgentState {
  threadId: string;
  role: RoleId;
  handoffDoc: string;
  updatedAt: number;
}

export interface ChatTurnRequest {
  threadId: string;
  target: RoleId;
  userMessage: string;
  agents: Record<TeamRoleId, AgentConfig>;
}

export type SseEventType =
  | "turn-start"
  | "delta"
  | "turn-end"
  | "handoff"
  | "dispatch"
  | "notes-updated"
  | "error"
  | "done";

export interface SseEvent {
  type: SseEventType;
  role?: RoleId;
  text?: string;
  from?: TeamRoleId;
  to?: TeamRoleId;
  message?: string;
  handoffDoc?: string;
}
