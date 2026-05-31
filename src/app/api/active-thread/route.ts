export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getActiveThread } from "@/lib/active-thread";

export function GET(): Response {
  return Response.json({ threadId: getActiveThread() });
}
