import type { Options as ClaudeAgentOptions } from "@anthropic-ai/claude-agent-sdk";

export const APEX_MCP_URL =
  process.env.APEX_MCP_URL?.trim() || "http://127.0.0.1:31001/mcp";

const APEX_SERVER_NAME = "apex-engine";

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

export function apexAllowedTools(): string[] {
  return [
    ...ALLOWED_APEX_TOOLS.map((t) => `mcp__${APEX_SERVER_NAME}__${t}`),
    ...ALLOWED_BUILTIN_TOOLS,
  ];
}

export function apexMcpServers(): NonNullable<ClaudeAgentOptions["mcpServers"]> {
  return {
    [APEX_SERVER_NAME]: {
      type: "http",
      url: APEX_MCP_URL,
    },
  };
}
