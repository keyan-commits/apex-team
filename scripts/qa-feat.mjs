#!/usr/bin/env node
// CLI runner: pnpm vitest run tests/qa/features/FEAT-XXXX-*/
// Usage: pnpm run qa:feat --feat=FEAT-0001
//
// parent_feat: FEAT-0003
// parent_us: US-100
// role: devsecops

import { spawn } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map(a => a.replace(/^--/, '').split('='))
);
const { feat } = args;

if (!feat) {
  console.error('Usage: pnpm run qa:feat --feat=FEAT-XXXX');
  process.exit(1);
}

const featuresDir = 'tests/qa/features';

let matches = [];
try {
  const entries = readdirSync(featuresDir);
  matches = entries
    .filter(e => e.startsWith(feat))
    .map(e => join(featuresDir, e))
    .filter(p => statSync(p).isDirectory());
} catch {
  // featuresDir does not exist yet
}

if (!matches.length) {
  console.error(`No test dir matches ${featuresDir}/${feat}-*`);
  process.exit(1);
}

const child = spawn('pnpm', ['vitest', 'run', ...matches], { stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 1));
