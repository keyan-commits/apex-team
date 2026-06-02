#!/usr/bin/env tsx
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const FRAGMENTS_DIR = "_handoff-pending";
const HANDOFF_FILE = "HANDOFF.md";

export interface Fragment {
  name: string;
  content: string;
}

// Pure function — testable without filesystem or git side-effects.
export function foldFragments(
  fragments: Fragment[],
  existingHandoff: string,
  date: string
): string {
  if (fragments.length === 0) return existingHandoff;

  const count = fragments.length;
  const label = count === 1 ? "1 fragment folded" : `${count} fragments folded`;
  const sections = fragments
    .map(f => `### ${f.name}\n\n${f.content.trim()}`)
    .join("\n\n");

  const nowBlock = `## ⏭️ NOW — ${date} (Wave close — ${label})\n\n${sections}`;
  return nowBlock + "\n\n---\n\n" + existingHandoff;
}

export async function run(): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(FRAGMENTS_DIR);
  } catch {
    console.log("fold-handoff: no _handoff-pending/ directory — nothing to do.");
    return;
  }

  const fragments = entries
    .filter(f => f.endsWith(".md") && f !== ".gitkeep")
    .sort();

  if (fragments.length === 0) {
    console.log("fold-handoff: no pending fragments — nothing to do.");
    return;
  }

  const date = new Date().toISOString().slice(0, 10);
  const loaded: Fragment[] = await Promise.all(
    fragments.map(async f => ({
      name: f.replace(".md", ""),
      content: await readFile(join(FRAGMENTS_DIR, f), "utf8"),
    }))
  );

  const existing = await readFile(HANDOFF_FILE, "utf8");
  const folded = foldFragments(loaded, existing, date);
  await writeFile(HANDOFF_FILE, folded);

  for (const f of fragments) {
    execSync(`git rm ${join(FRAGMENTS_DIR, f)}`, { stdio: "inherit" });
  }

  console.log(`fold-handoff: folded ${fragments.length} fragment(s) into ${HANDOFF_FILE}.`);
}

// Main guard — only execute when this script is the entry point.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().catch(err => {
    console.error("fold-handoff error:", err);
    process.exit(1);
  });
}
