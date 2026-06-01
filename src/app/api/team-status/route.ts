import { type NextRequest, NextResponse } from "next/server";
import { execSync } from "node:child_process";
import {
  listMessages,
  listAllAgentStates,
  getSpendSummary,
  getScoutMeta,
  getThreadWorkspace,
} from "@/lib/db";
import { ALL_ROLES } from "@/lib/roles";
import { deriveGithubRepo } from "@/lib/derive-github-repo";
import { deriveNowAndQueued } from "@/lib/derive-now-queued";
import type { RoleId, ChatMessage, TeamStatus } from "@/types";

// Per-repo 60s in-memory issue cache keyed by "owner/repo"
const _issueCache = new Map<string, { data: TeamStatus["issues"]; at: number }>();

function fetchIssues(repo: string): TeamStatus["issues"] {
  const cached = _issueCache.get(repo);
  if (cached && Date.now() - cached.at < 60_000) return cached.data;
  const empty: TeamStatus["issues"] = {
    selfImprovement: 0,
    skillProposal: 0,
    mcpProposal: 0,
    recent: [],
    repo,
    repoStatus: "ok",
  };
  try {
    const raw = execSync(
      `gh issue list --repo ${repo} --state open --json number,title,labels,url --limit 50`,
      { timeout: 5000, stdio: ["ignore", "pipe", "ignore"] },
    ).toString();
    const items = JSON.parse(raw) as Array<{
      number: number;
      title: string;
      labels: Array<{ name: string }>;
      url: string;
    }>;
    let si = 0,
      sp = 0,
      mp = 0;
    const recent: TeamStatus["issues"]["recent"] = [];
    for (const it of items) {
      const names = it.labels.map((l) => l.name);
      if (names.includes("self-improvement")) si++;
      if (names.includes("skill-proposal")) sp++;
      if (names.includes("mcp-proposal")) mp++;
      if (recent.length < 10)
        recent.push({ number: it.number, title: it.title, label: names[0] ?? "", url: it.url });
    }
    const data: TeamStatus["issues"] = { selfImprovement: si, skillProposal: sp, mcpProposal: mp, recent, repo, repoStatus: "ok" };
    _issueCache.set(repo, { data, at: Date.now() });
    return data;
  } catch {
    return empty;
  }
}

const _noIssues: TeamStatus["issues"] = {
  selfImprovement: 0,
  skillProposal: 0,
  mcpProposal: 0,
  recent: [],
  repo: null,
  repoStatus: "bad-path",
};

export async function GET(req: NextRequest): Promise<NextResponse<TeamStatus>> {
  const threadId = req.nextUrl.searchParams.get("threadId") ?? "";
  let workspace = req.nextUrl.searchParams.get("workspace") ?? null;
  if (threadId) {
    const threadWs = getThreadWorkspace(threadId);
    if (threadWs) workspace = threadWs;
  }

  const messages: ChatMessage[] = threadId ? listMessages(threadId) : [];
  const agentStates = threadId ? listAllAgentStates(threadId) : [];
  const stateMap = new Map(agentStates.map((s) => [s.role, s]));
  const spendRaw = getSpendSummary(threadId);

  const now10mMs = Date.now() - 600_000;
  const now24hMs = Date.now() - 86_400_000;

  // Single pass: track last trigger and last agent message per role
  const lastTrigger = new Map<
    RoleId,
    { id: number; content: string; createdAt: number; kind: "dispatch" | "user" }
  >();
  const lastAgentId = new Map<RoleId, number>();
  const lastAgentMsg = new Map<RoleId, ChatMessage>();
  const historyDepth = new Map<RoleId, number>();

  for (const m of messages) {
    if (m.author.kind === "dispatch") {
      const prev = lastTrigger.get(m.author.to);
      if (!prev || m.id > prev.id)
        lastTrigger.set(m.author.to, { id: m.id, content: m.content, createdAt: m.createdAt, kind: "dispatch" });
    } else if (m.author.kind === "user" && m.author.to) {
      const prev = lastTrigger.get(m.author.to);
      if (!prev || m.id > prev.id)
        lastTrigger.set(m.author.to, { id: m.id, content: m.content, createdAt: m.createdAt, kind: "user" });
    } else if (m.author.kind === "agent") {
      const { role } = m.author;
      if ((lastAgentId.get(role) ?? 0) < m.id) lastAgentId.set(role, m.id);
      lastAgentMsg.set(role, m);
      historyDepth.set(role, (historyDepth.get(role) ?? 0) + 1);
    }
  }

  // Inbox counts — handoff messages to a role arriving after their last agent reply
  const inboxCount = new Map<RoleId, number>();
  for (const m of messages) {
    if (m.author.kind === "handoff") {
      if (m.id > (lastAgentId.get(m.author.to) ?? 0))
        inboxCount.set(m.author.to, (inboxCount.get(m.author.to) ?? 0) + 1);
    }
  }

  // --- now & queued ---
  const { now: nowPanel, queued: queuedPanel } = deriveNowAndQueued(
    lastTrigger,
    lastAgentId,
    now10mMs,
  );

  // --- done (last 50 agent messages in last 24h, newest first) ---
  const donePanel: TeamStatus["done"] = [];
  const recentAgentMsgs = [...messages]
    .filter((m) => m.author.kind === "agent" && m.createdAt >= now24hMs)
    .reverse()
    .slice(0, 50);

  for (const m of recentAgentMsgs) {
    if (m.author.kind !== "agent") continue;
    const { role } = m.author;
    const triggerMsg = [...messages]
      .reverse()
      .find(
        (t) =>
          t.id < m.id &&
          ((t.author.kind === "dispatch" && t.author.to === role) ||
            (t.author.kind === "user" && t.author.to === role)),
      );
    const taskSummary = triggerMsg ? triggerMsg.content.slice(0, 80) : m.content.slice(0, 80);
    const shaMatch = m.content.match(/[`']([0-9a-f]{7,12})[`']/);
    donePanel.push({ role, taskSummary, completedAt: m.createdAt, commitSha: shaMatch?.[1] });
  }

  // --- blocked ---
  const blockedPanel: TeamStatus["blocked"] = [];
  for (const [role, msg] of lastAgentMsg) {
    if (msg.content.trimStart().toLowerCase().startsWith("error:"))
      blockedPanel.push({ role, errorMessage: msg.content.slice(0, 200), sinceAt: msg.createdAt });
  }

  // --- activeWave (most recent PO agent message) ---
  let activeWave: TeamStatus["activeWave"] = null;
  for (const m of [...messages].reverse()) {
    if (m.author.kind === "agent" && m.author.role === "product-owner") {
      activeWave = { excerpt: m.content.slice(0, 500), emittedAt: m.createdAt };
      break;
    }
  }

  // --- context ---
  const contextPanel: TeamStatus["context"] = ALL_ROLES.map((role) => {
    const state = stateMap.get(role);
    const handoffChars = state?.handoffDoc.length ?? 0;
    const depth = historyDepth.get(role) ?? 0;
    const inbox = inboxCount.get(role) ?? 0;
    return {
      role,
      handoffChars,
      historyDepth: depth,
      inboxCount: inbox,
      needsCleanup: handoffChars > 8000 || depth > 50,
    };
  });

  // --- spend ---
  const perRole = spendRaw.perRole;
  const topSpender =
    perRole.length > 0
      ? perRole.reduce((a, b) => (a.usd >= b.usd ? a : b))
      : null;
  const spend: TeamStatus["spend"] = {
    todayUsd: spendRaw.todayUsd,
    threadUsd: spendRaw.threadUsd,
    perRole,
    topSpender: topSpender ? { role: topSpender.role, usd: topSpender.usd } : null,
  };

  // Derive the GitHub repo from the workspace path; null → empty-state, no fallback.
  // repoStatus discriminates the 4 failure causes for accurate UI copy.
  const { repo, repoStatus } = deriveGithubRepo(workspace);
  const issues: TeamStatus["issues"] = repo
    ? fetchIssues(repo)
    : { ..._noIssues, repoStatus };

  return NextResponse.json({
    now: nowPanel,
    queued: queuedPanel,
    done: donePanel,
    blocked: blockedPanel,
    activeWave,
    issues,
    scout: { ...getScoutMeta(), nextScheduledAt: null },
    context: contextPanel,
    spend,
  } satisfies TeamStatus);
}
