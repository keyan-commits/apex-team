import type { TeamRoleId } from "@/types";

export type SlashCommand =
  | { kind: "help" }
  | { kind: "status" }
  | { kind: "clear" }
  | { kind: "dispatch"; target: TeamRoleId | "both" | "auto"; text: string }
  | { kind: "passthrough"; text: string }
  | { kind: "unknown"; raw: string };

const TARGET_FROM_SHORTCUT: Record<string, TeamRoleId | "both" | "auto"> = {
  ba: "business-analyst",
  "business-analyst": "business-analyst",
  dev: "developer",
  developer: "developer",
  both: "both",
  auto: "auto",
};

export function parseSlashCommand(input: string): SlashCommand {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) {
    return { kind: "passthrough", text: trimmed };
  }
  const firstSpace = trimmed.indexOf(" ");
  const cmd = (firstSpace === -1 ? trimmed.slice(1) : trimmed.slice(1, firstSpace))
    .toLowerCase()
    .trim();
  const rest = firstSpace === -1 ? "" : trimmed.slice(firstSpace + 1).trim();

  switch (cmd) {
    case "help":
    case "?":
      return { kind: "help" };
    case "status":
      return { kind: "status" };
    case "clear":
    case "new":
      return { kind: "clear" };
    default: {
      if (cmd in TARGET_FROM_SHORTCUT) {
        if (!rest) {
          return {
            kind: "unknown",
            raw: `/${cmd} requires a message: e.g. \`/${cmd} plan a markdown todo app\``,
          };
        }
        return {
          kind: "dispatch",
          target: TARGET_FROM_SHORTCUT[cmd],
          text: rest,
        };
      }
      return { kind: "unknown", raw: `Unknown command \`/${cmd}\`. Try \`/help\`.` };
    }
  }
}

export const HELP_TEXT = `
**apex-team slash commands**

- \`/help\` — this list.
- \`/status\` — show team state (busy roles, HANDOFF doc sizes, inbox counts, MCP reachability).
- \`/clear\` (or \`/new\`) — start a new thread.
- \`/ba <text>\` — dispatch directly to Business Analyst (bypasses orchestrator LLM).
- \`/dev <text>\` — dispatch directly to Developer.
- \`/both <text>\` — dispatch to BA and Dev in parallel.
- \`/auto <text>\` — let the small classifier (Claude Haiku) pick BA or Dev.

Anything else you type is sent to the **Orchestrator** (Claude Sonnet 4.6), which decides how to drive the team and can auto-dispatch via \`[[DISPATCH: role]]\` blocks in its reply.
`.trim();
