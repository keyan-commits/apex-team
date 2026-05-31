// Peer roles — the six team members the Product Owner dispatches to,
// and that handoff to each other via the async inbox protocol.
export type TeamRoleId =
  | "business-analyst"
  | "architect"
  | "ui-developer"
  | "backend-developer"
  | "qa"
  | "devsecops";

// All addressable agents. The product-owner is the in-app orchestrator
// — it uses DISPATCH (auto-trigger) to drive the team; peers use HANDOFF
// (async inbox, no auto-trigger).
export type RoleId = TeamRoleId | "product-owner";

export type Provider = "claude" | "gemini" | "groq";

export interface RoleDefinition {
  id: RoleId;
  label: string;
  shortLabel: string;
  accent: AccentKey;
  systemPrompt: string;
  skills?: string;
}

// Accent key drives both UI color and grouping. Six peer accents + PO.
export type AccentKey =
  | "po"
  | "ba"
  | "arch"
  | "ui"
  | "be"
  | "qa"
  | "ops";

export interface AgentConfig {
  role: RoleId;
  provider: Provider;
  model: string;
}

export type MessageAuthor =
  | { kind: "user"; to?: RoleId }
  | { kind: "agent"; role: RoleId }
  // System-generated entries shown in the orchestrator pane (e.g. dispatch
  // confirmations). Distinct from PO's own LLM replies, which use
  // `{ kind: "agent"; role: "product-owner" }`.
  | { kind: "orchestrator" }
  | { kind: "handoff"; from: RoleId; to: TeamRoleId }
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
  agents: Record<RoleId, AgentConfig>;
}

export type SseEventType =
  | "turn-start"
  | "delta"
  | "turn-end"
  | "handoff"
  | "dispatch"
  | "notes-updated"
  | "user-message"
  | "error"
  | "agent-models"
  | "done";

export interface SseEvent {
  type: SseEventType;
  role?: RoleId;
  text?: string;
  from?: TeamRoleId;
  to?: TeamRoleId;
  message?: string;
  handoffDoc?: string;
  agentModels?: Record<RoleId, string>;
}
