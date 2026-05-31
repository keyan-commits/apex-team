import { NextRequest } from "next/server";
import { execFileSync } from "node:child_process";
import { z } from "zod";
import { ALL_ROLES } from "@/lib/roles";
import type { RoleId } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  title: z.string().min(1).max(256),
  body: z.string().min(1).max(8000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ role: string }> },
): Promise<Response> {
  const { role } = await params;

  if (!ALL_ROLES.includes(role as RoleId)) {
    return Response.json(
      { error: { code: "UNKNOWN_ROLE", message: `Unknown role: ${role}` } },
      { status: 400 },
    );
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return Response.json(
      { error: { code: "INVALID_BODY", message: String(err) } },
      { status: 400 },
    );
  }

  try {
    const out = execFileSync(
      "gh",
      [
        "issue",
        "create",
        "--repo",
        "keyan-commits/apex-team",
        "--label",
        "skill-proposal",
        "--label",
        role,
        "--title",
        body.title,
        "--body",
        body.body,
      ],
      { encoding: "utf8" },
    );

    const issueUrl = out.trim();
    const match = issueUrl.match(/\/issues\/(\d+)/);
    const number = match ? parseInt(match[1], 10) : null;

    return Response.json({ url: issueUrl, number }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: { code: "GH_CLI_ERROR", message: String(err) } },
      { status: 500 },
    );
  }
}
