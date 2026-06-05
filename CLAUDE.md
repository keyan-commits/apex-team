# CLAUDE.md — apex-team

**Direct-talk subagent workbench.** apex-team ships **8 Claude Code subagents** (one Product Owner planner + seven role specialists) that the user (or outer Claude Code session) invokes directly via the `Agent` tool. Each subagent does the work it's asked to do and returns. **There is no orchestration layer** — no PO routing mandate, no required triad, no gate chain, no auto-dispatch. Wave 142 (2026-06-05) stripped the orchestration discipline because it had become net-negative: 3+ hours producing a 50-line app with broken output.

Companion read-only viewer lives at `keyan-commits/apex-team-viewer` (sibling clone at `../apex-team-viewer/`, port `:3200`). It polls files from disk + `gh` for CI status, with a per-test `▶ Run` button that streams the test runner's output via SSE. Survives independently of this repo.

## Session pickup

A fresh Claude Code session inheriting this repo should read these files in order:

1. `HANDOFF.md` — top NOW block: current state + open next steps
2. `LESSONS.md` — append-only "we hit X, it broke for Y, we now do Z" log
3. `.claude/agents/*.md` — the 8 subagent definitions (lean, ~40-50 lines each)
4. `requirements/INDEX.md` if you want to see what's been spec'd

Memory at `~/.claude/projects/-Users-nikoe-Development-Study-apex-team/memory/` is auto-loaded; the load-bearing entry for the new model is `feedback_no_orchestration_mandate.md`.

## How to use the team

You (the user, or an outer Claude Code session) invoke whichever subagent fits the work:

```js
Agent({
  description: "<short>",
  subagent_type: "ui-developer",  // or any role from .claude/agents/
  prompt: "<self-contained brief — the subagent has no conversation history>"
})
```

Multiple subagents in parallel = several `Agent` tool calls in one response. **But only because the work is split, not because a rule says to.** If the job is small, one subagent is fine.

Subagents are also symlinked into `~/.claude/agents/` via `bash scripts/install-agents-user-scope.sh` so they're available in every Claude Code session on this machine.

## The 8 subagents

| Role | What they do | Model |
|---|---|---|
| **product-owner** | Opt-in planner. Invoke when you want help breaking a goal into pieces. Does NOT auto-orchestrate others. | opus |
| **business-analyst** | Writes user stories, acceptance criteria, scope, glossary, business rules. | sonnet |
| **architect** | System design, ADRs, NFRs, coding standards, code reviews when asked. | opus |
| **ux-designer** | Design specs, a11y/contrast/motion gates, UI critiques. | sonnet |
| **ui-developer** | Browser-rendered code (HTML/CSS/JS/TS, React/Vue/Svelte, viewer `public/*`). | sonnet |
| **backend-developer** | Server code (Node HTTP, API routes, SSE, spawn, file IO, schemas, business logic). | sonnet |
| **qa** | Tests of every kind (unit/integration/smoke/regression/UI/E2E), suite runs, verdicts. | sonnet |
| **devsecops** | CI/CD, workflows, secrets, deploy pipelines, PR merges, supply-chain security. | sonnet |

Each subagent body is ~40-50 lines: role, job, style, what-they-don't-do, optional references. They are NOT prescriptive workflows.

## Optional conventions (use when useful, skip when not)

These were enforced as MANDATORY pre-Wave-142. Now they're available as guidance:

- **FEAT-XXXX feature grouping.** When a multi-wave initiative benefits from grouping, BA allocates a `FEAT-NNNN` with sibling tickets (`ARCH-NNNN`, `UX-NNNN`, `TEST-NNNN`, `FE-NNNN`, `BE-NNNN`, `OPS-NNNN`) at canonical paths under `<owner-dir>/features/FEAT-NNNN-<slug>/`. INDEX.md per owner-dir tracks allocations. For one-off bugfixes or small features, skip the convention.
- **Comprehensive testing rubric.** Positive + negative + edge + iterate-every-known-sample-input. Apply per AC's complexity. Skill at `~/.claude/skills/comprehensive-testing/SKILL.md`.
- **QA artifact discipline (S1-S9).** For visual / operator-facing deliverables: render-and-look, real artifact end-to-end, realistic data, positional/semantic correctness, WCAG contrast, side-by-side reference diff, validated≠deployed check, question business intent, no silent green. Apply judgment. Skill at `~/.claude/skills/qa-artifact-discipline/SKILL.md`.
- **Test coverage audit.** `pnpm run feat:backfill` and `scripts/status-reconcile.mjs` exist for when you want them.
- **ADR-018 verdict format.** Verdict blocks in HANDOFF docs can use the canonical `### Wave-NNN PASS verdict — PR #N — SHA <40hex>` format when verdict traceability matters across waves.
- **HANDOFF-in-PR.** When a wave touches code, the HANDOFF refresh ships in the same PR. Pre-commit hook enforces this; bypass with `--no-verify` only on explicit per-incident authorization.

## Stack

- **Tests:** Vitest (`pnpm test:run`). Test files at `tests/qa/...`.
- **TypeScript** for tests + scripted tooling.
- **Lint:** ESLint + `typescript-eslint`.
- **Package manager:** pnpm.

## File layout

```
apex-team/
├── .claude/agents/                       (8 subagent .md files)
├── .claude/skills/                       (optional guidance skills)
├── architecture/                         (Architect outputs: ADRs, NFRs, system design)
├── requirements/                         (BA outputs: user stories, scope, glossary)
├── design/                               (UX outputs: design specs)
├── tests/                                (QA outputs: tests on disk)
├── ops/                                  (DevSecOps: CI/CD, deploy, security)
├── frontend/                             (UI Dev Plan-C summary docs)
├── backend/                              (BE Dev Plan-C summary docs)
├── scripts/                              (utilities: feat-backfill, status-reconcile, install-agents)
├── coordination/handoffs/                (per-subagent durable working state, optional)
├── HANDOFF.md                            (living NOW block at top)
├── LESSONS.md                            (append-only why-log)
└── CLAUDE.md                             (this file)
```

## Prerequisites

- Claude Code CLI installed.
- pnpm installed.
- `gh` CLI for issue/PR operations.

## Commands

```bash
pnpm install
pnpm test:run                              # vitest run
pnpm type-check                            # tsc --noEmit
pnpm lint                                  # eslint .
bash scripts/install-agents-user-scope.sh  # symlink 8 subagents into ~/.claude/agents/
```

## Engineering standards

1. **Files-on-disk discipline.** Every deliverable is a real file. Chat-bubble artifacts don't count.
2. **HANDOFF in same PR as code** (when HANDOFF is being updated at all).
3. **No basics-explanations in code comments.** Comments explain WHY when non-obvious.
4. **No `shell: true` on user-data-derived args.** Spawn argv-array directly. (Wave 131 lesson.)
5. **`Cache-Control: no-cache` on static assets** to avoid stale-code-after-deploy. (Wave 135.)

## Caveats

- **Subagents are single-turn.** Each invocation gets a fresh subagent with no memory of prior runs. Brief each one self-contained.
- **No `[[DISPATCH]]` auto-firing.** If a subagent emits a HANDOFF block, it's text for you to read — the outer session decides what (if anything) to invoke next. Most of the time you don't need to invoke anyone else.
- **No process to start.** No dev server, no MCP server, no health endpoint. Viewer runs separately at `:3200`.

## Session continuity

`HANDOFF.md` (root, NOW block on top) is the resume point. Update via `/handoff` at end of session, commit work + HANDOFF together, push.
