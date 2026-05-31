import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { scoutRunning, setScoutRunning } from "@/lib/scout-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error: {
          code: "API_KEY_MISSING",
          message:
            "ANTHROPIC_API_KEY required for scout — set it in .env.local",
        },
      },
      { status: 503 },
    );
  }

  if (scoutRunning) {
    return Response.json(
      { error: { code: "ALREADY_RUNNING", message: "Scout is already running" } },
      { status: 409 },
    );
  }

  const scriptPath = resolve(process.cwd(), "scripts/skill-scout.mjs");
  const child = spawn("node", [scriptPath], {
    detached: false,
    stdio: ["ignore", "pipe", "pipe"],
  });

  setScoutRunning(true);

  child.on("close", () => {
    setScoutRunning(false);
  });

  return Response.json({ status: "running", pid: child.pid }, { status: 202 });
}
