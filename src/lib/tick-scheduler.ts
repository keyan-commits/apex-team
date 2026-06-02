// Server-side PO tick scheduler (Wave 71, US-026, closes #153).
// Arms a per-thread self-rescheduling setTimeout chain that periodically
// re-invokes the Product Owner's turn while the team has work in flight.
//
// Design invariants:
//   - Must call runTurnWithDispatches, NOT bare runTurn (#156: bare runTurn
//     records dispatches but never fans them out to peers).
//   - Must NOT append the BA-seed that talk_to_product_owner does — ticking
//     every 20s would spam BA's inbox.
//   - Acquires per-thread mutex so tick + external call cannot overlap.
//   - Budget sourced from turn_usage table (NO separate budget table — #140
//     drift trap; reuse existing spend tracking per Architect's design).

import { execSync } from "node:child_process";
import { runTurnWithDispatches } from "@/lib/run-turn-with-dispatches";
import { withThreadLock } from "@/lib/thread-lock";
import {
  getThreadSpendSince,
  logTick,
  listPendingInbox,
  getThreadWorkspace,
  getThreadAgentModels,
  upsertPrStatus,
  setPipelineState,
  getPipelineState,
  type PrStatusRow,
} from "@/lib/db";
import { ALL_ROLES, TEAM_ROLES, DEFAULT_ROLE_MODELS } from "@/lib/roles";
import type { AgentConfig, RoleId, TeamRoleId } from "@/types";

export interface SchedulerDeps {
  schedule: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  now: () => number;
}

interface TickState {
  threadId: string;
  tickN: number;
  consecutiveNoOpCount: number;
  cumulativeNoOpDelayMs: number;
  paused: boolean;
  pausedReason: string | null;
  lastTickAt: number | null;
  timer: ReturnType<typeof setTimeout> | null;
  deps: SchedulerDeps;
  lastRescueAt: Map<TeamRoleId, number>;
}

const DEFAULT_DEPS: SchedulerDeps = {
  schedule: (fn, ms) => setTimeout(fn, ms),
  now: () => Date.now(),
};

const BASE_MS = 20_000;
const MAX_DELAY_MS = 120_000;
const NO_OP_K = 3;
const PAUSE_THRESHOLD_MS = 300_000;
const RESCUE_THRESHOLD_MS = 300_000; // independent knob from PAUSE_THRESHOLD_MS even if values coincide
const MAX_THREADS = 5;

const schedulers = new Map<string, TickState>();

export function armScheduler(
  threadId: string,
  opts?: { deps?: SchedulerDeps },
): void {
  if (schedulers.has(threadId)) return;
  if (schedulers.size >= MAX_THREADS) {
    console.warn(`[tick-scheduler] max ${MAX_THREADS} threads reached; not arming ${threadId}`);
    return;
  }
  const state: TickState = {
    threadId,
    tickN: 0,
    consecutiveNoOpCount: 0,
    cumulativeNoOpDelayMs: 0,
    paused: false,
    pausedReason: null,
    lastTickAt: null,
    timer: null,
    deps: opts?.deps ?? DEFAULT_DEPS,
    lastRescueAt: new Map(),
  };
  schedulers.set(threadId, state);
  reschedule(state, BASE_MS);
}

export function pauseScheduler(threadId: string, reason = "manual"): boolean {
  const state = schedulers.get(threadId);
  if (!state) return false;
  if (state.timer != null) clearTimeout(state.timer);
  state.timer = null;
  state.paused = true;
  state.pausedReason = reason;
  return true;
}

export function resumeScheduler(threadId: string): boolean {
  const state = schedulers.get(threadId);
  if (!state || !state.paused) return false;
  state.paused = false;
  state.pausedReason = null;
  state.consecutiveNoOpCount = 0;
  state.cumulativeNoOpDelayMs = 0;
  reschedule(state, BASE_MS);
  return true;
}

export interface TickStateSnapshot {
  active: boolean;
  tickN: number;
  noOpCount: number;
  paused: boolean;
  pausedReason: string | null;
  lastTickAt: number | null;
}

export function getSchedulerState(threadId: string): TickStateSnapshot | null {
  const state = schedulers.get(threadId);
  if (!state) return null;
  return {
    active: true,
    tickN: state.tickN,
    noOpCount: state.consecutiveNoOpCount,
    paused: state.paused,
    pausedReason: state.pausedReason,
    lastTickAt: state.lastTickAt,
  };
}

export function stopAllSchedulers(): void {
  for (const state of schedulers.values()) {
    if (state.timer != null) clearTimeout(state.timer);
  }
  schedulers.clear();
}

function reschedule(state: TickState, delayMs: number): void {
  if (state.timer != null) clearTimeout(state.timer);
  state.timer = state.deps.schedule(() => void doTick(state), delayMs);
}

// Best-effort refresh of pr_status + pipeline_state.open_issue_count from gh CLI.
// Runs in the workspace directory so gh targets the right repo.
// Swallows all errors so a missing gh or unconfigured repo never kills the tick.
function refreshGhState(threadId: string, workspace: string): void {
  try {
    const prJson = execSync("gh pr list --state all --json number,title,state,headRefOid,body --limit 50", {
      cwd: workspace,
      encoding: "utf8",
      timeout: 10_000,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const prs = JSON.parse(prJson) as Array<{ number: number; title: string; state: string; headRefOid: string; body: string }>;
    for (const pr of prs) {
      const rawState = pr.state.toLowerCase();
      const status: PrStatusRow["status"] = rawState === "merged" ? "merged" : rawState === "closed" ? "closed" : "open";
      const closesMatch = pr.body?.match(/closes?\s+#(\d+)/gi);
      const closesIssues = closesMatch ? closesMatch.join(", ") : undefined;
      upsertPrStatus(threadId, pr.number, { title: pr.title, status, sha: pr.headRefOid || undefined, closesIssues });
    }
  } catch {
    // gh not available or workspace not a git repo — skip silently
  }

  try {
    const issueJson = execSync("gh issue list --state open --json number --limit 200", {
      cwd: workspace,
      encoding: "utf8",
      timeout: 10_000,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const issues = JSON.parse(issueJson) as Array<{ number: number }>;
    setPipelineState(threadId, "open_issue_count", String(issues.length));
  } catch {
    // best-effort
  }
}

function resolveAgents(threadId: string): Record<RoleId, AgentConfig> {
  const stored = (getThreadAgentModels(threadId) ?? {}) as Record<string, string>;
  return Object.fromEntries(
    ALL_ROLES.map((r) => [
      r,
      {
        role: r,
        provider: "claude" as const,
        model: stored[r] ?? DEFAULT_ROLE_MODELS[r],
      },
    ]),
  ) as Record<RoleId, AgentConfig>;
}

async function doTick(state: TickState): Promise<void> {
  if (state.paused) return;

  const now = state.deps.now();
  state.tickN += 1;
  state.lastTickAt = now;
  const startedAt = new Date(now).toISOString();

  // Budget check — soft enforcement: let in-flight call finish, pause BEFORE next tick.
  const budgetCap = parseInt(
    process.env.APEX_TEAM_TICK_BUDGET_PER_HOUR ?? "500000",
    10,
  );
  const hourAgo = now - 3_600_000;
  const outputTokensBefore = getThreadSpendSince(state.threadId, hourAgo);

  if (outputTokensBefore >= budgetCap) {
    pauseScheduler(state.threadId, "budget-cap");
    console.warn(
      `[tick-scheduler] thread ${state.threadId}: budget cap reached (${outputTokensBefore}/${budgetCap}), pausing`,
    );
    return;
  }
  if (outputTokensBefore >= budgetCap * 0.8) {
    const pct = Math.round((outputTokensBefore / budgetCap) * 100);
    console.warn(
      `[tick-scheduler] thread ${state.threadId}: approaching budget cap (${pct}%)`,
    );
  }

  const workspace = getThreadWorkspace(state.threadId) ?? process.cwd();

  // Refresh pr_status + open_issue_count before building the tick message.
  refreshGhState(state.threadId, workspace);

  // Snapshot peer inbox state for the AUTO-CONTINUE message.
  const inboxCounts = TEAM_ROLES.map((r) => ({
    role: r as TeamRoleId,
    count: listPendingInbox(state.threadId, r as TeamRoleId).length,
  }));
  const inflightCount = inboxCounts.filter((p) => p.count > 0).length;
  const idlePeers = inboxCounts.filter((p) => p.count === 0).map((p) => p.role);

  const openIssueRow = getPipelineState(state.threadId, "open_issue_count");
  const backlog = openIssueRow?.value ?? "?";
  const message = `[[AUTO-CONTINUE tick=${state.tickN} inflight=${inflightCount} idle-peers=${idlePeers.join(",") || "none"} backlog=${backlog}]]`;

  let dispatchesEmitted = 0;
  let tickOutputTokens = 0;
  let failed = false;
  let agents: Record<RoleId, AgentConfig> | undefined;

  try {
    agents = resolveAgents(state.threadId);

    const result = await withThreadLock(state.threadId, () =>
      runTurnWithDispatches({
        threadId: state.threadId,
        target: "product-owner",
        userMessage: message,
        workspace,
        agents: agents!,
        signal: new AbortController().signal,
      }),
    );

    dispatchesEmitted = result.dispatches.length;
    const outputTokensAfter = getThreadSpendSince(state.threadId, hourAgo);
    tickOutputTokens = Math.max(0, outputTokensAfter - outputTokensBefore);
  } catch (err) {
    failed = true;
    console.error(
      `[tick-scheduler] tick ${state.tickN} for thread ${state.threadId} failed:`,
      err,
    );
  }

  // Wave 79 (#171): rescue-sweep — after the PO tick, drain peer inboxes that
  // have been waiting longer than RESCUE_THRESHOLD_MS with no PO-driven dispatch.
  // Bypasses the PO entirely so it's structural and not prompt-dependent.
  let rescuesEmitted = 0;
  if (!failed && agents) {
    const rescueNow = state.deps.now();
    for (const teamRole of TEAM_ROLES) {
      const pending = listPendingInbox(state.threadId, teamRole as TeamRoleId);
      if (pending.length === 0) continue;
      const oldestCreatedAt = Math.min(...pending.map((m) => m.createdAt));
      const oldestAgeMs = rescueNow - oldestCreatedAt;
      if (oldestAgeMs <= RESCUE_THRESHOLD_MS) continue;
      const lastRescue = state.lastRescueAt.get(teamRole as TeamRoleId) ?? 0;
      if (rescueNow - lastRescue <= RESCUE_THRESHOLD_MS) continue;
      const ageSec = Math.round(oldestAgeMs / 1000);
      console.warn(`[tick-scheduler] rescue-sweep: ${teamRole} inbox age=${ageSec}s (#171)`);
      try {
        await withThreadLock(state.threadId, () =>
          runTurnWithDispatches({
            threadId: state.threadId,
            target: teamRole as TeamRoleId,
            userMessage: `[[RESCUE-SWEEP tick=${state.tickN} role=${teamRole} inbox-age=${ageSec}s]] Process your inbox (rescue).`,
            workspace,
            agents: agents!,
            signal: new AbortController().signal,
          }),
        );
        state.lastRescueAt.set(teamRole as TeamRoleId, rescueNow);
        rescuesEmitted += 1;
      } catch (err) {
        console.error(`[tick-scheduler] rescue for ${teamRole} failed:`, err);
      }
    }
  }

  const finishedAt = new Date(state.deps.now()).toISOString();
  const isNoOp = failed || (dispatchesEmitted === 0 && rescuesEmitted === 0);

  try {
    logTick(
      state.threadId,
      state.tickN,
      tickOutputTokens,
      dispatchesEmitted,
      isNoOp,
      startedAt,
      finishedAt,
      rescuesEmitted,
    );
  } catch {
    // best-effort — never kill the scheduler over audit logging
  }

  if (isNoOp) {
    state.consecutiveNoOpCount += 1;
  } else {
    state.consecutiveNoOpCount = 0;
    state.cumulativeNoOpDelayMs = 0;
  }

  // Check stop / backoff conditions after the tick completes.
  if (state.paused) return;

  if (state.consecutiveNoOpCount >= NO_OP_K) {
    const exponent = state.consecutiveNoOpCount - NO_OP_K;
    const backoffDelay = Math.min(BASE_MS * Math.pow(2, exponent), MAX_DELAY_MS);
    state.cumulativeNoOpDelayMs += backoffDelay;

    // Stop condition 1: signals clear — all peer inboxes empty + K no-ops (proxy
    // for "no open PRs / backlog" in v1 without a GH API call).
    if (inflightCount === 0 && inboxCounts.every((p) => p.count === 0)) {
      pauseScheduler(state.threadId, "signals-clear");
      return;
    }

    // Stop condition 2: cumulative no-op delay exceeded 300s threshold.
    if (state.cumulativeNoOpDelayMs >= PAUSE_THRESHOLD_MS) {
      pauseScheduler(state.threadId, "no-op-throttle");
      return;
    }

    reschedule(state, backoffDelay);
    return;
  }

  reschedule(state, BASE_MS);
}
