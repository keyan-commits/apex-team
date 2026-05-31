import { NextRequest } from "next/server";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { ROLES, ALL_ROLES } from "@/lib/roles";
import { getThreadAgentModels } from "@/lib/db";
import type { RoleId } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProvenanceValue =
  | "claude"
  | "user"
  | "external"
  | { provenance: string; sourceUrl: string };

interface SkillsJson {
  version: number;
  sections: Record<string, ProvenanceValue>;
}

export async function GET(
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

  const roleId = role as RoleId;
  const def = ROLES[roleId];

  const skillsMarkdown = def.skills ?? "";

  let skillsProvenance: Record<string, ProvenanceValue> = {};
  const provenanceFile = resolve(
    process.cwd(),
    `src/lib/skills/${roleId}.skills.json`,
  );
  if (existsSync(provenanceFile)) {
    try {
      const parsed = JSON.parse(
        readFileSync(provenanceFile, "utf8"),
      ) as SkillsJson;
      skillsProvenance = parsed.sections ?? {};
    } catch {
      skillsProvenance = {};
    }
  }

  const url = new URL(req.url);
  const threadId = url.searchParams.get("threadId");
  let currentModel = "claude-sonnet-4-6";
  if (threadId) {
    const models = getThreadAgentModels(threadId);
    if (models && models[roleId]) {
      currentModel = models[roleId];
    }
  }

  return Response.json({
    role: roleId,
    title: def.label,
    accent: def.accent,
    currentModel,
    skillsMarkdown,
    skillsProvenance,
    systemPromptSummary: def.systemPrompt.slice(0, 200),
  });
}
