import { query } from "@anthropic-ai/claude-agent-sdk";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";

import type { AgentConfig, AgentState, ChatMessage, RoleDefinition, RoleId } from "@/types";
import { getRole } from "./roles";
import { apexAllowedTools, apexMcpServers } from "./mcp-config";
import type { UsageCapture } from "./db";

export type { UsageCapture };

export interface ModelMessage {
  role: "user" | "assistant";
  content: string;
}

export const DEFAULT_MODELS: Record<AgentConfig["provider"], string> = {
  claude: "claude-sonnet-4-6",
  gemini: "gemini-2.5-flash",
  groq: "llama-3.3-70b-versatile",
};

export function defaultAgentConfig(role: RoleId): AgentConfig {
  return { role, provider: "claude", model: DEFAULT_MODELS.claude };
}

// What an agent for `role` sees on a turn.
//   - This role's own replies → "assistant"
//   - Everything else (user, teammate replies, handoffs, dispatches) → "user" with a label
//   - For BA/Dev: filter out user messages targeted at the OTHER team role.
//   - For orchestrator: sees everything (no filter).
export function buildConversation(
  role: RoleId,
  history: ChatMessage[],
): ModelMessage[] {
  const out: ModelMessage[] = [];
  for (const m of history) {
    // Filter user messages addressed to a different team role (orchestrator sees all).
    if (
      m.author.kind === "user" &&
      m.author.to &&
      m.author.to !== role &&
      role !== "product-owner"
    ) {
      continue;
    }
    if (m.author.kind === "agent" && m.author.role === role) {
      out.push({ role: "assistant", content: m.content });
      continue;
    }
    const label = labelForAuthor(m, role);
    out.push({ role: "user", content: `${label}${m.content}` });
  }
  return out;
}

function labelForAuthor(m: ChatMessage, viewer: RoleId): string {
  switch (m.author.kind) {
    case "user":
      return "[user] ";
    case "agent":
      return `[${m.author.role}] `;
    case "orchestrator":
      return "[orchestrator-system] ";
    case "handoff":
      return m.author.to === viewer
        ? `[handoff from ${m.author.from}] `
        : `[handoff ${m.author.from} → ${m.author.to}] `;
    case "dispatch":
      return m.author.to === viewer
        ? `[dispatched to you by orchestrator] `
        : `[orchestrator → ${m.author.to}] `;
  }
}

export interface AgentTurnContext {
  /** Agent's own persistent HANDOFF doc — prepended as system context. */
  handoffDoc: string;
  /** Pending inbox items the agent hasn't seen yet (handoffs from teammates). Empty for orchestrator. */
  pendingInbox: ChatMessage[];
  /** Peer HANDOFF docs the agent should see for situational awareness. Populated for orchestrator. */
  peerStates?: AgentState[];
  /** Working directory the agent's file tools operate on. */
  cwd?: string;
}

export async function* streamAgent(
  cfg: AgentConfig,
  history: ChatMessage[],
  ctx: AgentTurnContext,
  signal: AbortSignal,
  onUsage?: (u: UsageCapture) => void,
): AsyncGenerator<string> {
  const role = getRole(cfg.role);
  const messages = buildConversation(cfg.role, history);
  const augmentedSystem = augmentSystemPrompt(role, ctx);

  if (cfg.provider === "claude") {
    yield* streamClaude(cfg.model, augmentedSystem, messages, ctx.cwd, signal, onUsage, cfg.role);
    return;
  }

  // Non-Claude providers don't accept a cwd — their file tools don't exist.
  // We still pass the directory in the system prompt so the model knows the context.
  yield* streamAiSdk(cfg, augmentedSystem, messages, signal, onUsage);
}

// Static content (role.systemPrompt + role.skills) comes FIRST so the
// claude_code preset's cache_control covers the largest stable prefix.
// Volatile sections (cwd, HANDOFF, peerStates, inbox) are appended after —
// they change every turn and must not break the cache breakpoint.
export function augmentSystemPrompt(
  role: RoleDefinition,
  ctx: AgentTurnContext,
): string {
  const sections: string[] = [role.systemPrompt];

  if (role.skills) {
    sections.push(role.skills);
  }

  if (ctx.cwd) {
    sections.push(`## Working directory\n\nYour file tools operate on: \`${ctx.cwd}\``);
  }

  sections.push(
    ctx.handoffDoc.trim()
      ? `## Your current HANDOFF doc\n\n${ctx.handoffDoc.trim()}`
      : `## Your current HANDOFF doc\n\n_(empty — this is the start of your work in this thread)_`,
  );

  if (ctx.peerStates && ctx.peerStates.length > 0) {
    const peerBlock = ctx.peerStates
      .map((s) => {
        const body = s.handoffDoc.trim() || "_(empty)_";
        return `### ${s.role}\n\n${body}`;
      })
      .join("\n\n");
    sections.push(`## Team HANDOFF docs (peers' current state)\n\n${peerBlock}`);
  }

  if (ctx.pendingInbox.length > 0) {
    const inbox = ctx.pendingInbox
      .map((m) => {
        const from = m.author.kind === "handoff" ? m.author.from : "?";
        return `- from **${from}**: ${m.content}`;
      })
      .join("\n");
    sections.push(
      `## Pending inbox (handoffs from teammates you haven't responded to yet)\n\n${inbox}`,
    );
  }

  return sections.join("\n\n");
}

async function* streamClaude(
  model: string,
  systemPrompt: string,
  messages: ModelMessage[],
  cwd: string | undefined,
  signal: AbortSignal,
  onUsage?: (u: UsageCapture) => void,
  role?: string,
): AsyncGenerator<string> {
  const prompt = serializeForClaudePrompt(messages);

  const result = query({
    prompt,
    options: {
      model,
      systemPrompt: { type: "preset", preset: "claude_code", append: systemPrompt },
      mcpServers: apexMcpServers(role),
      allowedTools: apexAllowedTools(role),
      ...(cwd ? { cwd } : {}),
    },
  });

  for await (const msg of result) {
    if (signal.aborted) return;
    if (msg.type === "result" && onUsage) {
      onUsage({
        inputTokens: msg.usage.input_tokens,
        outputTokens: msg.usage.output_tokens,
        cacheCreationTokens: msg.usage.cache_creation_input_tokens ?? 0,
        cacheReadTokens: msg.usage.cache_read_input_tokens ?? 0,
      });
      continue;
    }
    if (msg.type !== "assistant") continue;
    const content = msg.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block.type === "text" && typeof block.text === "string") {
        yield block.text;
      }
    }
  }
}

function serializeForClaudePrompt(messages: ModelMessage[]): string {
  if (messages.length === 0) return "(no prior context — proceed.)";
  const last = messages[messages.length - 1];
  const prior = messages.slice(0, -1);

  if (prior.length === 0) {
    return last.role === "user"
      ? last.content
      : `(Previous reply you made:)\n${last.content}`;
  }

  const transcript = prior
    .map((m) => (m.role === "user" ? `USER: ${m.content}` : `YOU: ${m.content}`))
    .join("\n\n");

  return `Conversation so far:\n\n${transcript}\n\nNow respond to this:\n\n${last.content}`;
}

async function* streamAiSdk(
  cfg: AgentConfig,
  systemPrompt: string,
  messages: ModelMessage[],
  signal: AbortSignal,
  onUsage?: (u: UsageCapture) => void,
): AsyncGenerator<string> {
  const model =
    cfg.provider === "gemini" ? google(cfg.model) : groq(cfg.model);

  let captured: Error | null = null;
  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    abortSignal: signal,
    onError({ error }) {
      captured = error instanceof Error ? error : new Error(String(error));
    },
  });

  for await (const chunk of result.textStream) {
    if (signal.aborted) return;
    yield chunk;
  }

  if (onUsage && !captured && !signal.aborted) {
    try {
      const usage = await result.usage;
      onUsage({
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        cacheCreationTokens: usage.inputTokenDetails?.cacheWriteTokens ?? 0,
        cacheReadTokens: usage.inputTokenDetails?.cacheReadTokens ?? 0,
      });
    } catch { /* usage capture is best-effort */ }
  }

  if (captured) throw captured;
}
