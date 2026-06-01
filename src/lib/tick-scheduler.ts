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

import { runTurnWithDispatches } from "@/lib/run-turn-with-dispatches";
import { withThreadLock } from "@/lib/thread-lock";
import {
  getThreadSpendSince,
  logTick,
  listPendingInbox,
  getThreadWorkspace,
  getThreadAgentModels,
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
}

const DEFAULT_DEPS: SchedulerDeps = {
  schedule: (fn, ms) => setTimeout(fn, ms),
  now: () => Date.now(),
};

const BASE_MS = 20_000;
const MAX_DELAY_MS = 120_000;
const NO_OP_K = 3;
const PAUSE_THRESHOLD_MS = 300_000;
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

  // Snapshot peer inbox state for the AUTO-CONTINUE message.
  const inboxCounts = TEAM_ROLES.map((r) => ({
    role: r as TeamRoleId,
    count: listPendingInbox(state.threadId, r as TeamRoleId).length,
  }));
  const inflightCount = inboxCounts.filter((p) => p.count > 0).length;
  const idlePeers = inboxCounts.filter((p) => p.count === 0).map((p) => p.role);

  const message = `[[AUTO-CONTINUE tick=${state.tickN} inflight=${inflightCount} idle-peers=${idlePeers.join(",") || "none"} backlog=?]]`;

  let dispatchesEmitted = 0;
  let tickOutputTokens = 0;
  let failed = false;

  try {
    const workspace = getThreadWorkspace(state.threadId) ?? process.cwd();
    const agents = resolveAgents(state.threadId);

    const result = await withThreadLock(state.threadId, () =>
      runTurnWithDispatches({
        threadId: state.threadId,
        target: "product-owner",
        userMessage: message,
        workspace,
        agents,
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

  const finishedAt = new Date(state.deps.now()).toISOString();
  const isNoOp = failed || dispatchesEmitted === 0;

  try {
    logTick(
      state.threadId,
      state.tickN,
      tickOutputTokens,
      dispatchesEmitted,
      isNoOp,
      startedAt,
      finishedAt,
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
