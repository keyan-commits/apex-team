#!/usr/bin/env node
// CLI runner for ops/pipelines/<env>.sh FEAT-XXXX
// Usage: pnpm run ops:run --env=dev --feat=FEAT-0001
//
// parent_feat: FEAT-0003
// parent_us: US-100
// role: devsecops

import { spawn } from 'node:child_process';

const args = Object.fromEntries(
  process.argv.slice(2).map(a => a.replace(/^--/, '').split('='))
);
const { env, feat } = args;

if (!env || !feat) {
  console.error('Usage: pnpm run ops:run --env=<dev|staging|prod> --feat=FEAT-XXXX');
  process.exit(1);
}

const scriptPath = `ops/pipelines/${env}.sh`;
const child = spawn('sh', [scriptPath, feat], { stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 1));
