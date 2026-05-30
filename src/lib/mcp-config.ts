import type { Options as ClaudeAgentOptions } from "@anthropic-ai/claude-agent-sdk";

export const APEX_MCP_URL =
  process.env.APEX_MCP_URL?.trim() || "http://127.0.0.1:31001/mcp";

const APEX_SERVER_NAME = "apex-engine";

// Tools we explicitly let team agents call. Claude Agent SDK's `allowedTools`
// uses the `mcp__<server>__<tool>` naming convention.
//
// Sourced from apex-engine's `REGISTERED_TOOL_NAMES` (src/mcp/register-tools.ts).
// Kept conservative for MVP — destructive / project-bootstrap tools are off.
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

export function apexAllowedTools(): string[] {
  return ALLOWED_APEX_TOOLS.map((t) => `mcp__${APEX_SERVER_NAME}__${t}`);
}

export function apexMcpServers(): NonNullable<ClaudeAgentOptions["mcpServers"]> {
  return {
    [APEX_SERVER_NAME]: {
      type: "http",
      url: APEX_MCP_URL,
    },
  };
}
