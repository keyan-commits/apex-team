export const REQUIREMENTS_PHASE_PROTOCOL = `
REQUIREMENTS_PHASE_PROTOCOL
===========================

Every new task entering the team via \`talk_to_product_owner\` enters the
**Requirements Phase** first. No implementer (QA, BE Dev, UI Dev, DevSecOps)
may begin work until this phase completes.

### PO's first action on a new task

Parallel DISPATCH to all three requirements-phase peers, executed in parallel:

1. \`[[DISPATCH: architect]]\` — NFR / structural / pattern / security /
   observability guidance for the wave. Architect may reply "no NFR impact,
   proceed" if applicable.
2. \`[[DISPATCH: ux-designer]]\` — UI-impact analysis (interaction, a11y,
   visual regressions). UX Designer may reply "no UI impact, skip UX gate"
   if non-UI.
3. \`[[DISPATCH: business-analyst]]\` — user-story file at
   \`requirements/user-stories/US-NNN-<slug>.md\` with \`## Story\` +
   \`## Acceptance criteria\` + \`## Out of scope\`. BA also updates
   \`requirements/INDEX.md\` in the SAME PR where the wave referencing the
   US ships (no orphan US references).

### Implementer dispatch is BLOCKED until all three return

PO must hold dispatches to \`qa\`, \`backend-developer\`, \`ui-developer\`,
\`devsecops\` until all three triad replies arrive. The wait is bounded
(three short parallel turns); the cost of dispatching un-specced work
is unbounded.

### Exception classes (PO may dispatch implementers directly; must justify)

The triad mandate carves out narrow classes where the requirements phase is
already satisfied or is structurally unnecessary. PO must include an explicit
exception tag in the implementer's DISPATCH text — without the tag, the
implementer's refusal clause fires.

| Tag | When it applies |
|---|---|
| \`[exception: trivial-ops]\` | <1 LOC source change, zero new behavior, no design surface touched. Typo in comment, single import reorder, version bump matching upstream. |
| \`[exception: gate-verdict]\` | QA / UX / Architect gating a PR whose upstream wave has a US (or user-story-format issue). The PR# IS the dispatch's spec ref. |
| \`[exception: scout-issue]\` | The dispatch's spec IS the GitHub issue body (Wave 51 mandates user-story format on issues). Common for backlog-drain dispatches. |
| \`[exception: housekeeping]\` | HANDOFF compaction, server restart, branch cleanup, dashboard re-render, secret rotation, dependency lockfile refresh, catch-up documentation reflecting already-shipped behavior. Not new work-on-behalf-of-user. |
| \`[exception: revise-redispatch]\` | Re-dispatching the same implementer to fix gate-flagged issues — the original US still binds. |
| \`[exception: emergency-rollback]\` | Production-down or test-suite-broken — waiting for a triad blocks recovery. PO must include a one-line incident description; the rollback PR is self-justifying. |
| \`[exception: security-hotfix]\` | CVE patch, leaked-secret remediation, compromised dependency. Vulnerability advisory or incident report serves as the spec. Architect's NFR-security input arrives parallel-AFTER (within 24h), not before. |

### Anti-pattern

PO short-circuiting the triad on a task PO believes is small. Two of the
process flaws surfaced in 2026-Q2 trace to bypassed requirements phases.
When in doubt, dispatch the triad — they are cheap and idle peers stay
warm; un-specced implementer work is the only expensive outcome.
`.trim();

export const IMPLEMENTER_REFUSAL_CLAUSE = `
### Refuse work without a user-story reference (Wave 55)

Before starting ANY task from a DISPATCH, scan the dispatch text for ONE of:

1. A path matching \`requirements/user-stories/US-\\d+-.*\\.md\`.
2. A \`Closes #NNN\` issue reference where the issue is in user-story format
   (Wave 51 mandates this on all apex-team-filed issues).
3. An explicit PO-declared exception tag from the canonical seven:
   \`[exception: trivial-ops]\`, \`[exception: gate-verdict]\`,
   \`[exception: scout-issue]\`, \`[exception: housekeeping]\`,
   \`[exception: revise-redispatch]\`, \`[exception: emergency-rollback]\`,
   \`[exception: security-hotfix]\`.

If NONE of the three is present, **refuse the work** with this exact reply:

> Requirements phase incomplete — this DISPATCH lacks a \`US-NNN\` path, a
> user-story-format \`Closes #NNN\`, or an explicit exception tag. HANDOFF
> back to PO to consult BA before re-dispatching.
> (Wave 55 — REQUIREMENTS_PHASE_PROTOCOL.)

Then emit \`[[HANDOFF: product-owner]]\` naming the missing input and the
dispatch context. DO NOT start implementation work, do NOT touch source
files, do NOT open a branch.

**Why this exists:** Wave 55 — orchestrators (PO over MCP, and outer
claude-code sessions) were short-circuiting the requirements phase on
tasks they judged small. Result: un-specced work shipped, gates missed,
role lanes blurred. Implementer-side refusal is the hard backstop.
`.trim();

export const IMPLEMENTATION_PHASE_PROTOCOL = `
Implementation phase (after requirements are documented):
- UI Dev and BE Dev each work on a feature branch from main: feature/<wave>-<short>.
- Each runs their own isolated dev instance: pnpm dev:test:ui (port 3110, DB data/test-ui.db) or pnpm dev:test:be (port 3120, DB data/test-be.db).
- Each writes unit tests in tests/ui/ or tests/be/ covering their acceptance criteria.
- Each runs pnpm test:run locally; all tests must pass before HANDOFF to QA.
- Never HANDOFF to QA on code that hasn't been locally unit-tested.
`.trim();

export const VERIFICATION_PHASE_PROTOCOL = `
Verification phase (after implementation):
- If the change touches UI: UX Designer reviews the implementation against <workspace>/design/<slug>.md FIRST. Returns PASS or REVISE with concrete deltas. Only after UX PASS does QA proceed.
- BUILD SMOKE mandatory: run \`pnpm build\` before issuing PASS. \`tsc\` and \`vitest\` do NOT invoke the SWC/Turbopack compiler; \`pnpm build\` eagerly compiles the entire Next.js route graph, including all files \`src/app/**\` transitively imports (e.g. \`src/lib/roles.ts\`, \`src/lib/skills/*.ts\`). A parse error there passes type-check and all tests, then crashes the server on boot. Incident: Wave 55-roles commit \`e7d4ba6\` — em-dash in a template literal, 158/158 green, live server HTTP 500.
- BOOT SMOKE mandatory: boot the :3100 test instance (\`pnpm dev:test\`) and confirm \`GET /api/health\` → 200. \`server.ts\` and \`src/mcp/*.ts\` run via tsx/esbuild, NOT through \`pnpm build\`; a parse error there is invisible to the build step. Boot + health is the only gate that covers both compilation layers.
- After confirming health 200, hit at least one changed route or API endpoint with curl to verify the specific change is reachable end-to-end.
- Both legs are AND, not OR: \`pnpm build\` covers the Next.js route graph; \`pnpm dev:test\` + \`/api/health\` 200 covers server.ts/MCP. Skipping either is a QA gate breach, regardless of tsc/vitest results.
- UI-touching PRs (diff includes \`src/app/**/page.tsx\`, \`src/app/**/layout.tsx\`, \`src/components/**/*.tsx\`, \`src/app/globals.css\`, or any file rendering pixels the user sees) → UX Designer gates the UI portion; Architect gates the non-UI portion. Parallel — neither blocks the other.
- Pure non-UI PRs → Architect gates the whole thing; no UX dispatch needed.
- Pure UI PRs → Architect routes to UX with a one-liner; UX gates the whole thing.
- QA always gates AFTER design-gate(s) return — never before Architect / UX Designer have ruled.
- UI changes route to UX Designer; non-UI changes route to Architect; both can gate in parallel on mixed PRs; QA always gates after.
- QA exercises the change on the :3100 test instance (pnpm dev:test, DB data/apex-team-test.db).
- QA verifies against BA's acceptance criteria (from <workspace>/requirements/user-stories/) AND the UX spec (for UI changes).
- QA returns PASS with evidence (test output / Playwright snapshot) or FAIL with repro steps.
- Never return PASS without actually exercising the change on :3100.
`.trim();

export const CONSULTATION_PROTOCOL = `
Consultation protocol (any phase):
- Any role may HANDOFF to BA at any time for requirements clarification or to surface a new functional question.
- BA's <workspace>/requirements/ directory is the authoritative source of truth for what the product does.
- Never guess at functional intent — consult BA instead.
- If BA cannot answer (external stakeholder, deferred decision), BA opens-questions.md captures it and routes to the user via PO.
`.trim();

export const SKILLS_SELF_ENRICHMENT_PROTOCOL = `
Skills self-enrichment protocol:
- If you identify a missing skill or MCP tool that would materially improve your output quality, file a GitHub issue on keyan-commits/apex-team with label skill-proposal (for skills) or mcp-proposal (for MCP tools).
- Title format: [skill:<role-id>] Short description or [mcp:<role-id>] Short description.
- Body: current gap / proposed addition / why it matters / source URL if applicable.
- You may also search mcpmarket.com or the Anthropic skill marketplace for ready-made solutions before proposing a custom one.
- Don't block your current turn waiting for the skill — file the issue and continue with what you have.
`.trim();

export const WORKTREE_ISOLATION_PROTOCOL = `
WORKTREE_ISOLATION_PROTOCOL
===========================

**Invariant:** the primary working tree is read-only for branch state during
any concurrent multi-agent wave. All branch-level work (checkout, edit, build,
test) happens in isolated per-agent worktrees at \`/tmp/<role>-<branch>\`
(e.g. \`/tmp/arch-review\`, \`/tmp/qa-wave72\`).

### Creating a worktree

\`\`\`
git fetch origin
git worktree add /tmp/<role>-<branch> origin/<branch>
cd /tmp/<role>-<branch> && pnpm install --frozen-lockfile
\`\`\`

**Never \`git checkout\` in the primary working tree** while other agents may be
reading it. Switching branches in a shared tree corrupts concurrent file reads
mid-turn.

### Cleanup

After a PR is opened or review is complete:

\`\`\`
git worktree remove /tmp/<role>-<branch>   # add --force if it has uncommitted changes
\`\`\`

DevSecOps post-merge step: run \`git worktree prune\` to remove stale
registrations, and audit \`ls /tmp/<role>-*\` before each wave fan-out to
confirm no orphan worktrees are holding branch locks.

### Scope

This protocol applies to **Architect** (code reviews) and **DevSecOps** (branch
ops), and to any role that needs to inspect or modify a branch other than
the currently checked-out main.
`.trim();
