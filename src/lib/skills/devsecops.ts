import { USER_DIRECTIVE_SKILL } from "./_shared/user-directive-supremacy";

export const skills = `\
${USER_DIRECTIVE_SKILL}

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

### Artifact provenance
- SLSA Build Levels 1–3: L1 = provenance exists, L2 = hosted build platform produces it, L3 = hardened reusable workflow (tamper-resistant). Aim for L2 by default; reusable workflows give L3 for free.
- GitHub artifact attestations (\`actions/attest-build-provenance@v2\`) achieve SLSA L2 with 3 lines of workflow YAML — default behavior for public repos since 2025.
- Verify before deploying: \`gh attestation verify <artifact> --repo <owner/repo>\`. A deploy gate that skips attestation verification is no gate at all.
- Rule: every container image or release artifact produced in CI must have a signed provenance attestation. Passive SBOM + active provenance = defense-in-depth on the supply chain.

### GitHub Actions hardening
- **Pin action SHAs:** reference third-party actions by full commit SHA, not mutable tag (e.g. \`uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2\`). A tag can be force-pushed; a SHA cannot. GitHub Actions policy enforcement has supported this since August 2025.
- **Job-level \`permissions:\`**: set \`permissions: {}\` at workflow level; grant minimum write permissions per-job only (e.g. \`contents: read\`, \`id-token: write\` only where OIDC is used). Never rely on the default broad token.
- **OIDC token federation**: replace long-lived secrets (API keys, cloud credentials) with OIDC short-lived tokens wherever the provider supports it (AWS, GCP, Azure). Tokens expire per-run, access is scoped and auditable — no rotation ceremony needed.
- **Secret scanning in CI**: add \`trufflesecurity/trufflehog\` action on PRs as a server-side complement to pre-commit gitleaks. Defense-in-depth catches leaks that bypass local hooks.

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

### HANDOFF state updates — fragment pattern (Wave 93+)
Per ADR-014, do NOT edit \`HANDOFF.md\` directly in PRs. Write a fragment instead:
\`_handoff-pending/<wave>-devsecops.md\`

4-section format (all sections required):
\`\`\`
## Done
- <what shipped this wave>
## In flight
- <what's mid-stream>
## Next
- <what's queued>
## Notes
- <caveats, links>
\`\`\`

PO folds all fragments into \`HANDOFF.md\` at wave close with \`pnpm fold-handoff\`.
The pre-commit hook accepts either a direct \`HANDOFF.md\` edit or a fragment — both valid during the migration window.

### Conflict resolution playbook — union-merge files

\`.gitattributes\` marks append-mostly coordination docs (HANDOFF.md, **/HANDOFF.md,
.restart-trigger, LESSONS.md, requirements/INDEX.md, architecture/INDEX.md) as
\`merge=union\` — git keeps BOTH sides' lines instead of leaving conflict markers.

**Critical invariant: the union driver fires only on a LOCAL merge/rebase.**
GitHub's server-side "Update branch" button (\`gh pr update-branch\`) does NOT apply
the repo's \`.gitattributes\` merge driver — it re-introduces the exact CONFLICTING
state the union driver exists to prevent. NEVER use \`gh pr update-branch\` to refresh
a branch that touches a union-merge file.

When a PR shows CONFLICTING (or before merging a branch behind main) on a
union-merge file, resolve LOCALLY:

\`\`\`
git fetch origin
git worktree add /tmp/ds-<pr-branch> <pr-branch>
cd /tmp/ds-<pr-branch>
git rebase origin/main          # union driver auto-resolves the doc-only hunks
# if a NON-union (real code) file conflicts, resolve by hand, then \`git rebase --continue\`
pnpm install --frozen-lockfile && pnpm build   # verify before pushing
git push --force-with-lease     # --force-with-lease, never plain --force
git worktree remove /tmp/ds-<pr-branch>
\`\`\`

\`--force-with-lease\` (not \`--force\`) so a concurrent push by another agent aborts
the push instead of clobbering it. The rebase + local merge is what invokes
\`merge=union\`; the server-side button bypasses it.
`;
