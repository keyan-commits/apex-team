import type { Options as ClaudeAgentOptions } from "@anthropic-ai/claude-agent-sdk";

export const APEX_MCP_URL =
  process.env.APEX_MCP_URL?.trim() || "http://127.0.0.1:31001/mcp";

const APEX_SERVER_NAME = "apex-engine";
const PLAYWRIGHT_SERVER_NAME = "playwright";

// Tools we explicitly let team agents call. Claude Agent SDK's `allowedTools`
// is an AUTO-APPROVE list — listed tools execute without a permission prompt.
// Anything not listed still works only if the headless SDK can satisfy its
// permission check (which in our context means: it won't, hence the agent
// gets blocked). So we have to enumerate everything we want autonomy on.
//
// Apex-engine MCP tools are sourced from REGISTERED_TOOL_NAMES.
const ALLOWED_APEX_TOOLS = [
  "apex_synthesize",
  "apex_fanout",
  "apex_decompose",
  "apex_self_check",
  "doc_review",
  "code",
  "history_search",
  "web_search",
  "web_fetch",
  "query_source",
  "read_source",
] as const;

// Built-in Claude Code tools team agents are autonomous on. Excludes
// destructive / interactive surfaces (e.g. Task, ExitPlanMode).
const ALLOWED_BUILTIN_TOOLS = [
  "Read",
  "Write",
  "Edit",
  "Glob",
  "Grep",
  "Bash",
  "WebSearch",
  "WebFetch",
] as const;

// Playwright MCP tools — restricted to QA role only (~114K tokens/session vs
// ~27K via CLI; too expensive to give all 7 roles).
const ALLOWED_PLAYWRIGHT_TOOLS = [
  "browser_navigate",
  "browser_snapshot",
  "browser_click",
  "browser_type",
  "browser_close",
  "browser_wait_for",
] as const;

export function apexAllowedTools(role?: string): string[] {
  const tools: string[] = [
    ...ALLOWED_APEX_TOOLS.map((t) => `mcp__${APEX_SERVER_NAME}__${t}`),
    ...ALLOWED_BUILTIN_TOOLS,
  ];
  if (role === "qa") {
    tools.push(
      ...ALLOWED_PLAYWRIGHT_TOOLS.map((t) => `mcp__${PLAYWRIGHT_SERVER_NAME}__${t}`),
    );
  }
  return tools;
}

export function apexMcpServers(
  role?: string,
): NonNullable<ClaudeAgentOptions["mcpServers"]> {
  const servers: NonNullable<ClaudeAgentOptions["mcpServers"]> = {
    [APEX_SERVER_NAME]: {
      type: "http",
      url: APEX_MCP_URL,
    },
  };
  if (role === "qa") {
    servers[PLAYWRIGHT_SERVER_NAME] = {
      type: "stdio",
      command: "npx",
      args: ["@playwright/mcp@latest"],
    };
  }
  return servers;
}
