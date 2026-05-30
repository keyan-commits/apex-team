import { NextRequest } from "next/server";
import { z } from "zod";

import { classifyTask } from "@/lib/routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  userMessage: z.string().min(1),
});

export async function POST(req: NextRequest): Promise<Response> {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return Response.json({ error: "invalid body", detail: String(err) }, { status: 400 });
  }

  try {
    const decision = await classifyTask(body.userMessage, req.signal);
    return Response.json(decision);
  } catch (err) {
    return Response.json(
      {
        target: "business-analyst" as const,
        reason: `routing failed: ${err instanceof Error ? err.message : String(err)} — defaulted to BA`,
      },
      { status: 200 },
    );
  }
}
