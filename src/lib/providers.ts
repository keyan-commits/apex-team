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

// Max chars for the full augmented system prompt.
// Claude Sonnet 4.6 has a 200k-token context window; the claude_code preset
// adds ~15k-token static overhead. Capping here at 100k chars (~25k tokens)
// keeps ≥155k tokens available for conversation history and model response.
export const MAX_SYSTEM_PROMPT_CHARS = 100_000;

// Static content (role.systemPrompt + role.skills) comes FIRST so the
// claude_code preset's cache_control covers the largest stable prefix.
// Volatile sections (cwd, HANDOFF, peerStates, inbox) are appended after —
// they change every turn and must not break the cache breakpoint.
export function augmentSystemPrompt(
  role: RoleDefinition,
  ctx: AgentTurnContext,
): string {
  // Fixed — never truncated.
  const fixed: string[] = [role.systemPrompt];
  if (role.skills) fixed.push(role.skills);
  if (ctx.cwd) {
    fixed.push(`## Working directory\n\nYour file tools operate on: \`${ctx.cwd}\``);
  }

  // Volatile state — truncated lowest-priority first when over MAX_SYSTEM_PROMPT_CHARS.
  // Priority (lowest → truncated first): oldest inbox items → HANDOFF tail → peer states.
  let handoffBody = ctx.handoffDoc.trim()
    ? ctx.handoffDoc.trim()
    : `_(empty — this is the start of your work in this thread)_`;

  let peerSection: string | null = null;
  if (ctx.peerStates && ctx.peerStates.length > 0) {
    const peerBlock = ctx.peerStates
      .map((s) => {
        const body = s.handoffDoc.trim() || "_(empty)_";
        return `### ${s.role}\n\n${body}`;
      })
      .join("\n\n");
    peerSection = `## Team HANDOFF docs (peers' current state)\n\n${peerBlock}`;
  }

  let inboxItems: string[] = ctx.pendingInbox.map((m) => {
    const from = m.author.kind === "handoff" ? m.author.from : "?";
    return `- from **${from}**: ${m.content}`;
  });

  const assemble = (): string => {
    const parts = [...fixed, `## Your current HANDOFF doc\n\n${handoffBody}`];
    if (peerSection !== null) parts.push(peerSection);
    if (inboxItems.length > 0) {
      parts.push(
        `## Pending inbox (handoffs from teammates you haven't responded to yet)\n\n${inboxItems.join("\n")}`,
      );
    }
    return parts.join("\n\n");
  };

  let result = assemble();
  if (result.length <= MAX_SYSTEM_PROMPT_CHARS) return result;

  // Pass 1: drop oldest inbox items (most-recent = most relevant).
  let droppedInbox = 0;
  while (inboxItems.length > 0 && assemble().length > MAX_SYSTEM_PROMPT_CHARS) {
    droppedInbox += inboxItems[0].length + 1; // +1 for the joining "\n" separator
    inboxItems.shift();
  }
  if (droppedInbox > 0) {
    inboxItems.unshift(`[truncated ${droppedInbox} chars]`);
  }

  result = assemble();
  if (result.length <= MAX_SYSTEM_PROMPT_CHARS) return result;

  // Pass 2: truncate HANDOFF tail.
  const excess2 = result.length - MAX_SYSTEM_PROMPT_CHARS;
  handoffBody = truncateWithMarker(handoffBody, handoffBody.length - excess2);

  result = assemble();
  if (result.length <= MAX_SYSTEM_PROMPT_CHARS) return result;

  // Pass 3: truncate peer states (edge case — very large PO peer-doc block).
  if (peerSection !== null) {
    const excess3 = result.length - MAX_SYSTEM_PROMPT_CHARS;
    peerSection = truncateWithMarker(peerSection, peerSection.length - excess3);
  }

  return assemble();
}

// Truncates `text` to `maxChars` total length (including the marker).
// The marker reports the approximate number of chars removed so readers know
// content was dropped — never silently truncated.
function truncateWithMarker(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const approxDropped = text.length - maxChars;
  const marker = `\n[truncated ${approxDropped} chars]`;
  const kept = maxChars - marker.length;
  if (kept <= 0) return `[truncated ${text.length} chars]`;
  return text.slice(0, kept) + marker;
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
