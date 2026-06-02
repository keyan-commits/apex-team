import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import type { CiHealthData, CiRunInfo, CiState } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO = "keyan-commits/apex-team";
const THRESHOLD = 2;
const GH_TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const STATE_FILE = path.join(process.cwd(), "data", "ci-health-state.json");

const execFileAsync = promisify(execFile);

interface GhRunRecord {
  headSha: string;
  status: string;
  conclusion: string | null;
  name: string;
  createdAt: string;
}

interface PersistedState {
  cachedResult: CiHealthData | null;
  cachedAt: number;
  lastSuccessAt: number | null;
}

function loadState(): PersistedState {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as PersistedState;
  } catch {
    return { cachedResult: null, cachedAt: 0, lastSuccessAt: null };
  }
}

function saveState(s: PersistedState): void {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(s), "utf8");
  } catch {
    // best-effort; never crash the route
  }
}

/** Pure: classify GH run records into a CI health result. Exported for unit tests. */
export function detectCiHealth(
  runs: GhRunRecord[],
  threshold = THRESHOLD
): Omit<CiHealthData, "staleSince"> {
  const completed = runs.filter((r) => r.status === "completed");

  if (!completed.length) {
    return { state: "unknown", consecutiveReds: 0, threshold, latestRun: null };
  }

  // Build ordered unique headShas (most-recent first, preserving run order)
  const shaOrder: string[] = [];
  const shaGroups = new Map<string, GhRunRecord[]>();
  for (const run of completed) {
    if (!shaGroups.has(run.headSha)) {
      shaOrder.push(run.headSha);
      shaGroups.set(run.headSha, []);
    }
    shaGroups.get(run.headSha)!.push(run);
  }

  const isRedSha = (sha: string) =>
    shaGroups.get(sha)!.every(
      (r) => r.conclusion === "failure" || r.conclusion === "cancelled"
    );

  const isGreenSha = (sha: string) =>
    shaGroups.get(sha)!.some((r) => r.conclusion === "success");

  let consecutiveReds = 0;
  for (const sha of shaOrder) {
    if (isRedSha(sha)) consecutiveReds++;
    else break;
  }

  const latestCompleted = completed[0];
  const latestRun: CiRunInfo = {
    name: latestCompleted.name,
    conclusion: latestCompleted.conclusion ?? "unknown",
    createdAt: latestCompleted.createdAt,
  };

  let state: CiState;
  if (consecutiveReds >= threshold) {
    state = "alarm";
  } else if (consecutiveReds > 0) {
    state = "warning";
  } else if (isGreenSha(shaOrder[0]) && shaOrder.slice(1).some(isRedSha)) {
    // Latest SHA is green but prior window has red SHAs → recovering
    state = "recovering";
  } else {
    state = "healthy";
  }

  return { state, consecutiveReds, threshold, latestRun };
}

export async function GET(): Promise<Response> {
  const now = Date.now();
  const stored = loadState();

  // Serve from cache within the ≤5-min cron window (idempotent re-entry)
  if (stored.cachedResult && now - stored.cachedAt < CACHE_TTL_MS) {
    return Response.json(stored.cachedResult);
  }

  try {
    const { stdout } = await execFileAsync(
      "gh",
      [
        "run",
        "list",
        "--repo",
        REPO,
        "--limit",
        "20",
        "--json",
        "headSha,status,conclusion,name,createdAt",
      ],
      { timeout: GH_TIMEOUT_MS }
    );

    const runs = JSON.parse(stdout) as GhRunRecord[];
    const detected = detectCiHealth(runs, THRESHOLD);

    const result: CiHealthData = { ...detected, staleSince: null };
    saveState({ cachedResult: result, cachedAt: now, lastSuccessAt: now });
    return Response.json(result);
  } catch {
    // GH timed out or process error → unknown; surface last-known-good timestamp
    const staleSince = stored.lastSuccessAt
      ? new Date(stored.lastSuccessAt).toISOString()
      : null;
    return Response.json({
      state: "unknown",
      consecutiveReds: 0,
      threshold: THRESHOLD,
      latestRun: null,
      staleSince,
    } satisfies CiHealthData);
  }
}
