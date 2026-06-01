// MCP tools exposed to external Claude Code sessions (or any MCP client).
// Register with: `claude mcp add apex-team --transport http http://localhost:3000/mcp`
//
// Design notes:
//   - Tools are SYNCHRONOUS from the caller's POV: talk_to_role blocks
//     until the team agent's turn is fully complete (model done streaming,
//     persistence committed), then returns the agent's visible reply.
//   - Every tool that targets a thread takes a `thread_id` arg. External
//     Claude Code is responsible for tracking which thread it's in. Use
//     `new_thread` to mint one.
//   - Workspace defaults to the apex-team server's cwd when omitted.

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { runTurn } from "@/lib/run-turn";
import { runTurnWithDispatches } from "@/lib/run-turn-with-dispatches";
import { withThreadLock } from "@/lib/thread-lock";
import { armScheduler, pauseScheduler, resumeScheduler, getSchedulerState } from "@/lib/tick-scheduler";
import { setActiveThread } from "@/lib/active-thread";
import {
  appendMessage,
  getAgentState,
  getThreadAgentModels,
  getThreadSpendSince,
  listMessages,
  listPendingInbox,
  setThreadWorkspace,
} from "@/lib/db";
import { ALL_ROLES, DEFAULT_ROLE_MODELS, TEAM_ROLES, isTeamRole } from "@/lib/roles";
import type { AgentConfig, RoleId, TeamRoleId } from "@/types";

const RoleEnum = z.enum([
  "product-owner",
  "business-analyst",
  "architect",
  "ui-developer",
  "backend-developer",
  "qa",
  "devsecops",
  "ux-designer",
]);

function resolvedAgents(threadId: string): Record<RoleId, AgentConfig> {
  const stored = getThreadAgentModels(threadId) ?? {};
  return Object.fromEntries(
    ALL_ROLES.map((r) => [r, {
      role: r,
      provider: "claude" as const,
      model: stored[r] ?? DEFAULT_ROLE_MODELS[r],
    }])
  ) as Record<RoleId, AgentConfig>;
}

function newThreadId(): string {
  return `mcp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function workspaceOrCwd(workspace?: string): string {
  if (!workspace) return process.cwd();
  try {
    if (statSync(workspace).isDirectory()) return workspace;
  } catch {
    /* fall through */
  }
  return process.cwd();
}

export function registerApexTeamTools(server: McpServer): void {
  // -- talk_to_role: direct dispatch to any team member, blocks until reply
  server.registerTool(
    "talk_to_role",
    {
      title: "Talk to a team role",
      description:
        "Send a message to a specific team member and wait for their reply. " +
        "Roles: product-owner (PO orchestrates the team), business-analyst (owns requirements/), " +
        "architect (NFRs + code review), ui-developer, backend-developer, qa (testing), devsecops. " +
        "Returns the agent's visible reply AND any DISPATCH/HANDOFF blocks they emitted as structured data. " +
        "DISPATCH blocks are NOT auto-triggered within a single MCP call — " +
        "call talk_to_role for each dispatched peer to run their turn. " +
        "Reserved for diagnostic or explicit-override use. New work must go through `talk_to_product_owner` so the requirements phase runs.",
      inputSchema: {
        role: RoleEnum,
        message: z.string().min(1).describe("The user message to send to that role."),
        thread_id: z.string().min(1).describe("The conversation thread id. Use new_thread to mint one."),
        workspace: z
          .string()
          .optional()
          .describe("Absolute path to the project directory the team should operate on. Defaults to apex-team's own cwd."),
      },
    },
    async ({ role, message, thread_id, workspace }) => {
      setActiveThread(thread_id);
      if (workspace) setThreadWorkspace(thread_id, workspace);
      // Seed BA's inbox so it can capture product requirements from every
      // user message, regardless of which role the user targeted.
      if (role !== "business-analyst") {
        appendMessage(thread_id, { kind: "handoff", from: role, to: "business-analyst" }, message);
      }
      const result = await withThreadLock(thread_id, () =>
        runTurn({
          threadId: thread_id,
          target: role,
          userMessage: message,
          workspace: workspaceOrCwd(workspace),
          agents: resolvedAgents(thread_id),
          signal: new AbortController().signal,
        }),
      );
      const out = [
        `### ${role} reply`,
        result.visibleText || "(no visible text — full reply was structured blocks only)",
      ];
      if (result.newHandoffDoc !== null) {
        out.push("", `_HANDOFF doc updated (${result.newHandoffDoc.length} chars)_`);
      }
      if (result.handoffs.length > 0) {
        out.push(
          "",
          "### Peer HANDOFFs emitted (NOT auto-triggered — call talk_to_role on the target if you want them to respond):",
          ...result.handoffs.map((h) => `- → ${h.to}: ${h.message.slice(0, 120)}${h.message.length > 120 ? "…" : ""}`),
        );
      }
      if (result.dispatches.length > 0) {
        out.push(
          "",
          "### DISPATCHes emitted (NOT auto-triggered — call talk_to_role for each dispatched peer to run their turn):",
          ...result.dispatches.map((d) => `- → ${d.to}: ${d.message.slice(0, 120)}${d.message.length > 120 ? "…" : ""}`),
        );
      }
      return { content: [{ type: "text", text: out.join("\n") }] };
    },
  );

  // -- talk_to_product_owner: convenience wrapper, PO routes the work
  server.registerTool(
    "talk_to_product_owner",
    {
      title: "Talk to the Product Owner",
      description:
        "Canonical entry point. All new work goes here. " +
        "PO will run the requirements phase (Architect + UX + BA in parallel) before any implementer is dispatched. " +
        "Hand a task off to the Product Owner. The PO will decide which team members to dispatch " +
        "(via [[DISPATCH: role]] blocks in their reply). " +
        "Use this when you want the team driven for you instead of picking the role yourself. " +
        "Returns the PO's reply AND every dispatched peer's reply. " +
        "DISPATCH blocks ARE auto-triggered — dispatched peer turns run in parallel after the PO's turn completes.",
      inputSchema: {
        message: z.string().min(1),
        thread_id: z.string().min(1),
        workspace: z.string().optional(),
      },
    },
    async ({ message, thread_id, workspace }) => {
      setActiveThread(thread_id);
      if (workspace) setThreadWorkspace(thread_id, workspace);
      appendMessage(thread_id, { kind: "handoff", from: "product-owner", to: "business-analyst" }, message);
      const result = await withThreadLock(thread_id, () =>
        runTurnWithDispatches({
          threadId: thread_id,
          target: "product-owner",
          userMessage: message,
          workspace: workspaceOrCwd(workspace),
          agents: resolvedAgents(thread_id),
          signal: new AbortController().signal,
        }),
      );
      // Arm the tick scheduler on the first successful PO call for this thread.
      // Subsequent arms are no-ops (armScheduler is idempotent).
      armScheduler(thread_id);
      const out = [
        "### Product Owner reply",
        result.visibleText || "(PO emitted only structured blocks)",
      ];
      if (result.newHandoffDoc !== null) {
        out.push("", `_HANDOFF doc updated (${result.newHandoffDoc.length} chars)_`);
      }
      if (result.handoffs.length > 0) {
        out.push(
          "",
          "### Peer HANDOFFs emitted (NOT auto-triggered — call talk_to_role on the target if you want them to respond):",
          ...result.handoffs.map((h) => `- → ${h.to}: ${h.message.slice(0, 120)}${h.message.length > 120 ? "…" : ""}`),
        );
      }
      if (result.peerReplies.length > 0) {
        out.push("", "### Dispatched peers (auto-triggered):");
        for (const p of result.peerReplies) {
          const preview = (p.result.visibleText || "(no visible text)").slice(0, 300);
          out.push(`- → ${p.role}: ${preview}`);
        }
      }
      return { content: [{ type: "text", text: out.join("\n") }] };
    },
  );

  // -- get_team_status: snapshot of everyone's state
  server.registerTool(
    "get_team_status",
    {
      title: "Get team status",
      description:
        "Return a snapshot of the team's current state for a thread: each role's HANDOFF doc size and inbox count, plus the total message count.",
      inputSchema: {
        thread_id: z.string().min(1),
      },
    },
    async ({ thread_id }) => {
      const messages = listMessages(thread_id);
      const lines = [`**Thread:** \`${thread_id}\``, `**Messages:** ${messages.length}`, "", "**Roles:**"];
      for (const role of ALL_ROLES) {
        const state = getAgentState(thread_id, role);
        const inbox = isTeamRole(role) ? listPendingInbox(thread_id, role as TeamRoleId) : [];
        lines.push(
          `- **${role}** — HANDOFF: ${state.handoffDoc.length} chars${state.updatedAt ? ` (updated ${new Date(state.updatedAt).toISOString()})` : ""}${isTeamRole(role) ? ` · inbox: ${inbox.length}` : ""}`,
        );
      }
      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );

  // -- read_handoff_doc: read a role's current HANDOFF
  server.registerTool(
    "read_handoff_doc",
    {
      title: "Read a role's HANDOFF doc",
      description: "Return the current contents of a role's persistent HANDOFF doc.",
      inputSchema: {
        role: RoleEnum,
        thread_id: z.string().min(1),
      },
    },
    async ({ role, thread_id }) => {
      const state = getAgentState(thread_id, role);
      if (!state.handoffDoc.trim()) {
        return {
          content: [{ type: "text", text: `_(${role}'s HANDOFF doc is empty for thread ${thread_id})_` }],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `### ${role} HANDOFF doc\n_Last updated: ${new Date(state.updatedAt).toISOString()}_\n\n${state.handoffDoc}`,
          },
        ],
      };
    },
  );

  // -- list_requirements: list BA's requirements directory in the workspace
  server.registerTool(
    "list_requirements",
    {
      title: "List requirement docs (BA-owned)",
      description: "List every file under the BA's <workspace>/requirements/ directory.",
      inputSchema: {
        workspace: z.string().optional(),
      },
    },
    async ({ workspace }) => {
      const cwd = workspaceOrCwd(workspace);
      const dir = resolve(cwd, "requirements");
      if (!existsSync(dir)) {
        return {
          content: [
            {
              type: "text",
              text: `_(No requirements/ directory yet at ${dir}. BA creates it on its first turn.)_`,
            },
          ],
        };
      }
      const entries = walkDir(dir, dir);
      return {
        content: [
          {
            type: "text",
            text: `### Requirements (at ${dir})\n\n${entries.map((e) => `- ${e}`).join("\n")}`,
          },
        ],
      };
    },
  );

  // -- read_requirement: read one file in requirements/
  server.registerTool(
    "read_requirement",
    {
      title: "Read a requirement doc",
      description:
        "Read a single file inside <workspace>/requirements/. `path` is relative to that directory (e.g. `user-stories/US-001-login.md`).",
      inputSchema: {
        path: z.string().min(1),
        workspace: z.string().optional(),
      },
    },
    async ({ path, workspace }) => {
      const cwd = workspaceOrCwd(workspace);
      const dir = resolve(cwd, "requirements");
      const full = resolve(dir, path);
      // Path traversal guard — must stay inside requirements/.
      if (!full.startsWith(dir + "/") && full !== dir) {
        return {
          content: [{ type: "text", text: `Refusing path-traversal: ${path}` }],
          isError: true,
        };
      }
      if (!existsSync(full)) {
        return {
          content: [{ type: "text", text: `Not found: ${full}` }],
          isError: true,
        };
      }
      const body = readFileSync(full, "utf8");
      return {
        content: [{ type: "text", text: `### ${path}\n\n${body}` }],
      };
    },
  );

  // -- new_thread: mint a fresh thread id
  server.registerTool(
    "new_thread",
    {
      title: "Create a new conversation thread",
      description: "Mint a fresh thread id. The team's per-role HANDOFF docs and message history are scoped per thread.",
      inputSchema: {},
    },
    async () => {
      const id = newThreadId();
      setActiveThread(id);
      return { content: [{ type: "text", text: `New thread id: \`${id}\`` }] };
    },
  );

  // -- get_workspace: report the server's default workspace
  server.registerTool(
    "get_workspace",
    {
      title: "Get the apex-team server's default workspace",
      description:
        "Returns the directory apex-team's server is running in. This is the fallback workspace when none is specified per tool call.",
      inputSchema: {},
    },
    async () => {
      return { content: [{ type: "text", text: `Default workspace: \`${process.cwd()}\`` }] };
    },
  );

  // -- list_team_roles: list available role ids and labels
  server.registerTool(
    "list_team_roles",
    {
      title: "List team roles",
      description: "List every role id you can target with talk_to_role, with their short label.",
      inputSchema: {},
    },
    async () => {
      const lines = ALL_ROLES.map((r) => `- \`${r}\``);
      lines.unshift("**Roles:**");
      lines.push("", "**Peer roles** (use HANDOFF):", ...TEAM_ROLES.map((r) => `- \`${r}\``));
      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );

  // -- pause_ticks: pause the tick scheduler for a thread
  server.registerTool(
    "pause_ticks",
    {
      title: "Pause tick scheduler",
      description: "Pause the automatic PO tick scheduler for the given thread. Does nothing if no scheduler is active.",
      inputSchema: {
        thread_id: z.string().min(1),
      },
    },
    async ({ thread_id }) => {
      const ok = pauseScheduler(thread_id);
      return {
        content: [
          {
            type: "text",
            text: ok
              ? `Tick scheduler paused for thread \`${thread_id}\`.`
              : `No active tick scheduler for thread \`${thread_id}\`.`,
          },
        ],
      };
    },
  );

  // -- resume_ticks: resume a paused tick scheduler
  server.registerTool(
    "resume_ticks",
    {
      title: "Resume tick scheduler",
      description: "Resume a paused tick scheduler for the given thread.",
      inputSchema: {
        thread_id: z.string().min(1),
      },
    },
    async ({ thread_id }) => {
      const ok = resumeScheduler(thread_id);
      return {
        content: [
          {
            type: "text",
            text: ok
              ? `Tick scheduler resumed for thread \`${thread_id}\`.`
              : `No paused scheduler found for thread \`${thread_id}\`.`,
          },
        ],
      };
    },
  );

  // -- get_tick_state: observe the scheduler's current state + budget
  server.registerTool(
    "get_tick_state",
    {
      title: "Get tick scheduler state",
      description:
        "Return current tick scheduler state for a thread: tickN, noOpCount, paused, pausedReason, budgetSpent, budgetCap, budgetPct, lastTickAt.",
      inputSchema: {
        thread_id: z.string().min(1),
      },
    },
    async ({ thread_id }) => {
      const budgetCap = parseInt(
        process.env.APEX_TEAM_TICK_BUDGET_PER_HOUR ?? "500000",
        10,
      );
      const hourAgo = Date.now() - 3_600_000;
      const budgetSpent = getThreadSpendSince(thread_id, hourAgo);
      const budgetPct = Math.round((budgetSpent / budgetCap) * 100);
      const state = getSchedulerState(thread_id);
      const payload = state
        ? { ...state, budgetSpent, budgetCap, budgetPct }
        : { active: false, budgetSpent, budgetCap, budgetPct };
      return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
    },
  );

  // -- record_user_message: append a user message to a thread without
  //    triggering an agent turn (useful for context-only updates).
  server.registerTool(
    "record_user_message",
    {
      title: "Record a user message (no agent turn)",
      description:
        "Append a user-authored message to the thread WITHOUT triggering an agent. " +
        "Use this when you want the team to see context before you next dispatch.",
      inputSchema: {
        thread_id: z.string().min(1),
        message: z.string().min(1),
      },
    },
    async ({ thread_id, message }) => {
      setActiveThread(thread_id);
      appendMessage(thread_id, { kind: "user" }, message);
      return { content: [{ type: "text", text: "Recorded." }] };
    },
  );
}

function walkDir(root: string, current: string, depth = 0): string[] {
  if (depth > 4) return [];
  const out: string[] = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const full = join(current, entry.name);
    const rel = full.slice(root.length + 1);
    if (entry.isDirectory()) {
      out.push(...walkDir(root, full, depth + 1));
    } else {
      out.push(rel);
    }
  }
  return out;
}
