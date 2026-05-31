import { NextRequest } from "next/server";
import { z } from "zod";
import { execFileSync } from "node:child_process";

import { runTurnWithDispatches } from "@/lib/run-turn-with-dispatches";
import { defaultAgentConfig } from "@/lib/providers";
import { ALL_ROLES } from "@/lib/roles";
import type { AgentConfig, RoleId } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  threadId: z.string().min(1),
  issueNumbers: z.number().array().min(1).max(20),
  workspace: z.string().optional(),
});

function defaultAgents(): Record<RoleId, AgentConfig> {
  return Object.fromEntries(
    ALL_ROLES.map((r) => [r, defaultAgentConfig(r)]),
  ) as Record<RoleId, AgentConfig>;
}

interface GHIssue {
  number: number;
  title: string;
  body: string;
  labels: Array<{ name: string }>;
  url: string;
}

function fetchIssue(n: number): GHIssue {
  const out = execFileSync("gh", [
    "issue",
    "view",
    String(n),
    "--repo",
    "keyan-commits/apex-team",
    "--json",
    "number,title,body,labels,url",
  ]);
  return JSON.parse(out.toString("utf8")) as GHIssue;
}

function buildPoMessage(issues: GHIssue[]): string {
  const sections = issues.map((issue) => {
    const labels = issue.labels.map((l) => l.name).join(", ") || "(none)";
    return [
      `### Issue #${issue.number} — ${issue.title}`,
      `Labels: ${labels}`,
      `URL: ${issue.url}`,
      "---",
      issue.body || "(no body)",
      "---",
    ].join("\n");
  });

  return [
    "The user has selected the following backlog issues to consider for scheduling.",
    "For each: decide if it belongs in the next wave, defer, or close as noise.",
    "If you schedule any, dispatch the appropriate role(s) in this same turn.",
    "",
    ...sections,
  ].join("\n");
}

export async function POST(req: NextRequest): Promise<Response> {
  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "invalid body", detail: String(err) }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { threadId, issueNumbers, workspace } = parsed;

  let issues: GHIssue[];
  try {
    issues = issueNumbers.map(fetchIssue);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "failed to fetch issues", detail: String(err) }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const ctrl = new AbortController();
  req.signal.addEventListener("abort", () => ctrl.abort(), { once: true });

  try {
    const result = await runTurnWithDispatches({
      threadId,
      target: "product-owner",
      userMessage: buildPoMessage(issues),
      workspace: workspace ?? process.cwd(),
      agents: defaultAgents(),
      signal: ctrl.signal,
    });

    return new Response(
      JSON.stringify({ ok: true, dispatched: result.dispatches.length, issueCount: issues.length }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
