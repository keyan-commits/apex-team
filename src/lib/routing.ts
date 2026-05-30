import { query } from "@anthropic-ai/claude-agent-sdk";
import type { RoleId } from "@/types";

export type RoutingTarget = RoleId | "both";

export interface RoutingDecision {
  target: RoutingTarget;
  reason: string;
}

const ROUTING_MODEL = "claude-haiku-4-5";

const ROUTING_SYSTEM_PROMPT = `
You are routing a single task to one or both agents on a small software team. Pick the lane the task falls into.

- **business-analyst** — owns product requirements: personas, user stories, acceptance criteria, scope decisions, business logic. Best for fuzzy stakeholder asks, scoping work, drafting/refining specs, defining what a feature should DO.
- **developer** — owns implementation: files, libraries, stack choices, code, technical decisions. Best for "implement X", "scaffold Y", code-level questions, library/framework selection, technical risk callouts, defining HOW a feature gets built.
- **both** — pick this ONLY when the task is genuinely addressed to the whole team (a greeting like "say hello", an introduce-yourselves prompt, a status check, a retrospective question) OR when the task has two clearly distinct sub-tasks for different roles. Do NOT pick \`both\` just because a task is ambiguous; pick the single best fit instead.

Reply with EXACTLY two lines, nothing else:
ROLE: <business-analyst|developer|both>
REASON: <one short sentence>
`.trim();

const LINE_RE = /^ROLE:\s*(business-analyst|developer|both)\s*$/im;
const REASON_RE = /^REASON:\s*(.+)$/im;

export async function classifyTask(
  userMessage: string,
  signal?: AbortSignal,
): Promise<RoutingDecision> {
  const ctrl = signal ?? new AbortController().signal;

  const result = query({
    prompt: `Task: ${userMessage}`,
    options: {
      model: ROUTING_MODEL,
      systemPrompt: { type: "preset", preset: "claude_code", append: ROUTING_SYSTEM_PROMPT },
      // Routing is a small classification — no tools, no MCP.
      allowedTools: [],
    },
  });

  let buffer = "";
  for await (const msg of result) {
    if (ctrl.aborted) break;
    if (msg.type !== "assistant") continue;
    const content = msg.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block.type === "text" && typeof block.text === "string") {
        buffer += block.text;
      }
    }
  }

  return parseDecision(buffer);
}

export function parseDecision(text: string): RoutingDecision {
  const roleMatch = text.match(LINE_RE);
  const reasonMatch = text.match(REASON_RE);
  // Fall back to BA when the classifier output is malformed — BA is the
  // safer default because they don't auto-decide business logic the way
  // a misrouted Dev turn might.
  const target = (roleMatch?.[1] as RoutingTarget | undefined) ?? "business-analyst";
  const reason = reasonMatch?.[1]?.trim() ?? "routing classifier output unparseable; defaulted to BA";
  return { target, reason };
}
