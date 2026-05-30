// pnpm drops the execute bit from node-pty's `spawn-helper` binary during
// extraction (long-standing pnpm issue with binary file modes from npm
// tarballs). Without the +x bit, node-pty's posix_spawnp fails with the
// opaque message "posix_spawnp failed." — the actual cause is that the
// helper launcher can't be exec'd. We re-apply +x here so the bug doesn't
// recur on every install.

import { chmodSync, statSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = dirname(here);

function findSpawnHelpers() {
  const root = join(repo, "node_modules", ".pnpm");
  if (!existsSync(root)) return [];
  const out = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith("node-pty@")) continue;
    const prebuilds = join(root, entry.name, "node_modules/node-pty/prebuilds");
    if (!existsSync(prebuilds)) continue;
    for (const platform of readdirSync(prebuilds)) {
      const helper = join(prebuilds, platform, "spawn-helper");
      if (existsSync(helper)) out.push(helper);
    }
  }
  return out;
}

const helpers = findSpawnHelpers();
if (helpers.length === 0) {
  console.log("[fix-node-pty-perms] no node-pty spawn-helper found (skipping)");
  process.exit(0);
}

for (const helper of helpers) {
  const mode = statSync(helper).mode & 0o777;
  if ((mode & 0o111) === 0o111) {
    console.log(`[fix-node-pty-perms] ok: ${helper}`);
    continue;
  }
  chmodSync(helper, mode | 0o111);
  console.log(`[fix-node-pty-perms] +x  ${helper}`);
}
