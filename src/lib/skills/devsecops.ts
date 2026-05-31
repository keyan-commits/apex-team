export const skills = `\
## DevSecOps domain expertise

### Pipeline-as-code principles
- Every pipeline is version-controlled alongside the code it builds. No manual steps in CI that aren't documented and automated.
- Minimal privilege per step: a build step gets no more access than it needs to run. The deploy step gets deploy credentials; the test step does not.
- Fail fast: the cheapest checks (lint, type-check, unit tests) run first. Don't spend 10 minutes on integration tests only to fail on a lint error.
- No inline secrets, ever. Environment variables injected at runtime from a secret store — not hardcoded, not interpolated into YAML strings.

### Secrets hygiene
- Secrets never appear in source (including YAML, logs, error messages, and git history). One accidental commit of a secret means rotation, not deletion.
- Explicit rotation cadence per secret class: API keys, DB passwords, and tokens each have a defined TTL and rotation procedure documented before they're issued.
- Vault-pattern storage: secrets live in the platform's secret manager (env secrets, Vault, AWS SSM, etc.), referenced by name in config — never by value.
- Audit trail: every secret access is logged. If you can't answer "who accessed this secret and when," the hygiene is incomplete.

### Supply-chain discipline
- Pin deps to exact versions in production lockfiles. Floating ranges (\`^x.y\`, \`~x.y\`) are acceptable in dev deps; never in production builds.
- Track CVEs via Dependabot or Renovate. A critical CVE in a direct dependency blocks the release until patched.
- SBOM awareness: know what's in the build. A new dep is a new trust decision — check the license (compatibility with project license), the maintenance health (last commit, open issue count), and the transitive dep tree size.

### Shift-left security
- SAST in the PR pipeline, not just at release. A security finding that blocks a deploy is expensive; one that blocks a PR is cheap.
- Dependency vulnerability scan on every merge to main, not just on a schedule.
- Secrets scanning pre-commit (e.g. gitleaks, detect-secrets). The earlier in the flow, the lower the blast radius of a leak.

### Deployment safety gates
- Define the rollback condition and rollback procedure before deploying, not after an incident. "We'll figure it out if it breaks" is not a plan.
- Blue/green or feature-flag awareness: a deploy that can be toggled off without a redeploy is safer than one that can't.
- Smoke test fires within 2 minutes of deploy completing — if it doesn't pass within that window, rollback automatically or manually before users are affected.

### Restart triggering
- When shipping changes to \`src/mcp/**\` or any module imported by \`src/mcp/handler.ts\` (tools.ts, run-turn.ts, providers.ts, etc.), the MCP module graph is cached at process start. New code is not active until the process restarts.
- To activate new code without killing in-progress turns on other agents: append a timestamp line to \`.restart-trigger\`. The supervisor (\`pnpm dev:supervised\`) will SIGTERM + respawn cleanly.
- Do this from a turn dedicated to the restart, not from a turn that has other work pending — the agent writing to \`.restart-trigger\` will be killed mid-turn as part of the restart.
- If running under plain \`pnpm dev\` (no supervisor), restart manually: Ctrl-C + \`pnpm dev\`.
`;
