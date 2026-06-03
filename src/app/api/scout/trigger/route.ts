import { query } from "@anthropic-ai/claude-agent-sdk";
import { scoutRunning, setScoutRunning } from "@/lib/scout-state";
import { runScout } from "@/lib/scout-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  if (scoutRunning) {
    return Response.json(
      { error: { code: "ALREADY_RUNNING", message: "Scout is already running" } },
      { status: 409 },
    );
  }

  // Auth probe: iterate query() once to surface OAuth absence before returning 202.
  // The SDK throws on the first iteration when Claude Code is not logged in.
  try {
    const probe = query({
      prompt: "ping",
      options: {
        model: "claude-haiku-4-5-20251001",
        systemPrompt: { type: "preset", preset: "claude_code", append: "Reply with ok." },
      },
    });
    for await (const _ of probe) {
      break; // one iteration is enough to confirm OAuth is live
    }
  } catch {
    return Response.json(
      {
        error: {
          code: "UNAUTHENTICATED",
          message: "Claude Code not logged in — run 'claude login' to authenticate",
        },
      },
      { status: 503 },
    );
  }

  // Auth confirmed — run the full scout in-process (fire and forget)
  setScoutRunning(true);
  runScout().finally(() => setScoutRunning(false));

  return Response.json({ status: "running" }, { status: 202 });
}
