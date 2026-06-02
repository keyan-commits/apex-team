// Wave 81 (#177): server-side stall detector — pure predicate + DB helpers.
// All stall detection logic lives here. doTick in tick-scheduler.ts is the
// only call site; this module never imports from tick-scheduler.

import { execSync } from "node:child_process";
import {
  getPipelineState,
  insertStallEventRow,
  getLatestUnackedStallRow,
  markStallEventAcked,
  type StallEventRow,
} from "@/lib/db";

export const STALL_MERGE_THRESHOLD_MS = 3_600_000;  // 60 min
export const STALL_BUDGET_FLOOR_TOKENS = 5_000;      // min hourly output tokens

// Re-export DB type under the canonical name for consumers (Wave 82 etc.)
export type StallEvent = StallEventRow;

export interface StallCheckParams {
  threadId: string;
  workspace: string;
  hourlyOutputTokens: number;  // outputTokensBefore from doTick
  tickArmed: boolean;          // !state.paused
  now: () => number;           // injectable for tests (mirrors SchedulerDeps.now)
}

// Pure predicate — reads from DB and shell but no writes.
// Returns the stall event payload if all 4 conditions hold, null otherwise.
export function evaluateStall(
  params: StallCheckParams,
): Omit<StallEvent, "id" | "acknowledged"> | null {
  const { threadId, workspace, hourlyOutputTokens, tickArmed, now } = params;

  // Predicate 3: tick is armed (scheduler not paused)
  if (!tickArmed) return null;

  // Predicate 4: enough tokens spent to confirm an active run (not a warm-up)
  if (hourlyOutputTokens < STALL_BUDGET_FLOOR_TOKENS) return null;

  // Predicate 2: backlog > 0
  const backlogRow = getPipelineState(threadId, "open_issue_count");
  const backlogCount = backlogRow?.value != null ? parseInt(backlogRow.value, 10) : 0;
  if (isNaN(backlogCount) || backlogCount <= 0) return null;

  // Predicate 1: no main merge within STALL_MERGE_THRESHOLD_MS
  const nowMs = now();
  let lastMergeAtMs = 0;     // 0 → epoch-0 → age is huge → condition 1 true
  let lastMergeAt: string | null = null;
  try {
    const raw = execSync("git log origin/main -1 --format=%at", {
      cwd: workspace,
      encoding: "utf8",
      timeout: 5_000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const epochSec = parseInt(raw, 10);
    if (!isNaN(epochSec) && epochSec > 0) {
      lastMergeAtMs = epochSec * 1000;
      lastMergeAt = new Date(lastMergeAtMs).toISOString();
    }
  } catch {
    // git unavailable or not a git repo → lastMergeAtMs stays 0 → stalled (conservative)
  }

  const stallAgeMs = nowMs - lastMergeAtMs;
  if (stallAgeMs < STALL_MERGE_THRESHOLD_MS) return null;

  return {
    threadId,
    detectedAt: new Date(nowMs).toISOString(),
    lastMergeAt,
    stallAgeMs,
    backlogCount,
    hourlyTokens: hourlyOutputTokens,
  };
}

// Writes a stall event to DB. Deduplicates: skips insert if an unacknowledged
// event already exists with detectedAt within the last STALL_MERGE_THRESHOLD_MS.
export function recordStallEvent(
  event: Omit<StallEvent, "id" | "acknowledged">,
): void {
  const existing = getLatestUnackedStallRow(event.threadId);
  if (existing) {
    const existingTs = new Date(existing.detectedAt).getTime();
    if (Date.now() - existingTs < STALL_MERGE_THRESHOLD_MS) return;
  }
  insertStallEventRow(event);
}

// Returns the most recent unacknowledged stall event, or null.
// Used by /api/team-status to surface the stall field.
export function getLatestUnackedStall(threadId: string): StallEvent | null {
  return getLatestUnackedStallRow(threadId);
}

// Marks all unacknowledged stall events for this thread as acknowledged.
// Called by doTick auto-clear when stall condition resolves.
export function ackStallEvent(threadId: string): void {
  markStallEventAcked(threadId);
}
