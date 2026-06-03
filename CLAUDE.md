# CLAUDE.md — apex-team

**Subagent + workspace-conventions hub.** apex-team now ships **eight Claude Code subagents** (Product Owner + seven role specialists) plus the workspace conventions they operate against (`requirements/`, `architecture/`, `design/`, `tests/`, `ops/`, `coordination/handoffs/`). The Next.js monolith + MCP server + SQLite are retired (Wave 106, Plan C hard-cutover, 2026-06-04). Files on disk are the only state — no shared server, no database, no message bus.

Companion read-only viewer lives at `keyan-commits/apex-team-viewer` (sibling clone at `../apex-team-viewer/`, port `:3200`). It polls files from disk + `gh` for CI status, with a `▶ Run` button per QA test that streams `pnpm vitest run <path>` via SSE. Survives independently of this repo.

## Session pickup

A fresh Claude Code session inheriting this repo should read these files in order:

1. `HANDOFF.md` — top NOW block: cutover state + open next steps
2. `LESSONS.md` — append-only "we hit X, it broke for Y, we now do Z" log; explains WHY conventions exist
3. `.claude/agents/*.md` — the eight subagent definitions; each carries its role prompt + Plan C runtime adapter + skill content
4. `architecture/decisions/` — ADRs for big design choices
5. `requirements/INDEX.md` — current user-story backlog + status

Memory files at `~/.claude/projects/-Users-nikoe-Development-Study-apex-team/memory/` are auto-loaded into every session and carry durable user preferences (push policy, no-API-key constraint, HANDOFF-in-PR rule, etc.).

## Architecture

```
   ┌──────────────────────────┐
   │  Your Claude Code (CLI)  │  ← outer orchestrator session
   └────────────┬─────────────┘
                │ Agent tool → subagent dispatch
                ▼
   ┌────────────────────────────────────────────────────────┐
   │  8 subagents under .claude/agents/<role>.md            │
   │  (also symlinked at ~/.claude/agents/ for user-scope)  │
   │                                                        │
   │   product-owner    — orchestrates, dispatches peers    │
   │   ────────────────────────────────────────────────     │
   │   business-analyst — owns requirements/                │
   │   architect        — owns architecture/ + NFRs         │
   │   ux-designer      — owns design/                      │
   │   ui-developer     — frontend code                     │
   │   backend-developer — backend / API code               │
   │   qa               — owns tests/ (files on disk)       │
   │   devsecops        — owns ops/ + CI/CD                 │
   └────────────────────────────────────────────────────────┘
                │ Read/Write/Edit
                ▼
   ┌──────────────────────────┐
   │  Files on disk           │
   │  (workspace conventions) │
   └──────────────────────────┘
                │ poll
                ▼
   ┌──────────────────────────┐
   │  apex-team-viewer        │  ← separate repo + process
   │  http://localhost:3200   │     read-only dashboard
   └──────────────────────────┘
```

Each subagent is invoked as a single-turn Claude Code subagent (`Agent` tool with `subagent_type: <role>`). No persistent process, no shared memory, no inbox bus. Cross-role coordination happens through files in `coordination/handoffs/<role>.md` and the workspace artifacts (US-NNN files, ADRs, design specs, tests, ops manifests).

## The 8 subagents

| Role | Owns | Model |
|---|---|---|
| **product-owner** | Orchestration. Reads goals; emits advisory `[[DISPATCH: role]]` blocks (advisory only — the outer Claude Code orchestrator reads them and decides which subagents to invoke). | opus |
| **business-analyst** | `requirements/` — INDEX.md, scope.md, glossary.md, open-questions.md, user-stories/, business-rules.md, domains/, data-sources.md, samples/. Authoritative on business logic. | sonnet |
| **architect** | `architecture/` — NFRs, system design, coding standards, ADRs. Authoritative on tech/cross-cutting. All code reviews. | opus |
| **ux-designer** | `design/` — per-feature design specs. A11y, contrast, motion gates. | sonnet |
| **ui-developer** | Frontend code. Escalates business → BA, tech → Architect. | sonnet |
| **backend-developer** | Backend / API / service code. Same escalation pattern. | sonnet |
| **qa** | All testing — unit, smoke, regression, UI, backend, security. **Tests are files on disk** (US-085 discipline, absorbed into `qa.md`) — chat-bubble code does not count. | sonnet |
| **devsecops** | `ops/` — CI/CD, secrets, deploy, supply-chain security. Sole agent that merges to main. | sonnet |

**Coordination semantics:**

- `[[HANDOFF: role]] … [[/HANDOFF]]` blocks in a subagent's output are **advisory text** describing what should happen next. They do NOT auto-trigger peer turns under the subagent runtime.
- `[[DISPATCH: role]] … [[/DISPATCH]]` blocks from the PO are likewise advisory — the outer Claude Code session reads them and invokes the next subagent via the Agent tool.
- `[[NOTES]] … [[/NOTES]]` blocks describe updates the subagent makes to its own `coordination/handoffs/<role>.md` file.

## How to drive the team

The outer Claude Code session uses the `Agent` tool to invoke subagents:

```
Agent({
  description: "<short>",
  subagent_type: "business-analyst",  // or any role id from .claude/agents/
  prompt: "<self-contained brief — the subagent has no conversation history>"
})
```

Multiple subagents can be invoked in parallel by issuing several `Agent` tool calls in a single response.

Subagents are also symlinked into `~/.claude/agents/` via `bash scripts/install-agents-user-scope.sh`, so they are available in every Claude Code session on this machine, not just within apex-team's workspace. Symlinks (not copies) — `git pull` updates propagate automatically.

## Stack

- **Subagents:** Claude Code native subagent runtime. No SDK, no MCP server, no process to start.
- **Tests:** Vitest (`pnpm test:run`). QA produces test files at `tests/qa/wave-NNN/<descriptive>.test.ts` or under existing `tests/<area>/` per Architect ratification.
- **TypeScript:** for tests and any future scripted tooling. No application source.
- **Linting:** ESLint + `@eslint/js` + `typescript-eslint`.
- **Package manager:** pnpm.

## File layout

```
apex-team/
├── .claude/agents/                       (8 subagent .md files — the team)
│   ├── product-owner.md
│   ├── architect.md
│   ├── business-analyst.md
│   ├── ux-designer.md
│   ├── ui-developer.md
│   ├── backend-developer.md
│   ├── qa.md
│   └── devsecops.md
├── architecture/                         (Architect-owned: ADRs, NFRs, system design, coding standards)
├── requirements/                         (BA-owned: user stories, scope, glossary, OQs, domains, business rules)
├── design/                               (UX-owned: per-feature design specs)
├── tests/                                (QA-owned: tests on disk; tests/qa/wave-NNN/ is the canonical home)
├── ops/                                  (DevSecOps-owned: CI/CD, deploy, security)
├── coordination/handoffs/                (per-subagent working state files)
├── scripts/
│   ├── install-agents-user-scope.sh      (symlinks .claude/agents/ → ~/.claude/agents/)
│   ├── git-hooks/                        (pre-commit / pre-push: HANDOFF freshness + branch policy)
│   ├── devsecops/bootstrap-workspace.mjs (apply this repo's enforcement recipe to any external workspace)
│   ├── memory_lint.py, memory_recall.py  (memory tooling)
│   ├── generate_index_md.py, validate_index.py (INDEX maintenance)
│   └── sync_memory.sh, check_handoff_fresh.sh
├── HANDOFF.md                            (living NOW block at top)
├── LESSONS.md                            (append-only why-log)
├── INDEX.md, INDEX.yaml                  (machine-readable doc index)
├── CLAUDE.md                             (this file)
└── README.md
```

## Prerequisites

- Claude Code CLI installed and logged in (`claude login`).
- pnpm installed (for `pnpm install` + `pnpm test:run`).
- `gh` CLI for issue/PR operations (no longer required for subagent operation, but used by viewer + DevSecOps).

## Commands

```bash
pnpm install                              # devDeps: vitest, eslint, typescript
pnpm test:run                             # vitest run --sequence.shuffle
pnpm type-check                           # tsc --noEmit (against tests/)
pnpm lint                                 # eslint .
bash scripts/install-agents-user-scope.sh # symlink 8 subagents into ~/.claude/agents/
```

## Engineering standards

1. **Files-on-disk discipline.** Every deliverable is a real file. Chat-bubble artifacts (test code, design specs, ADRs) do not count.
2. **One source of truth per artifact:**
   - Functional requirements: `requirements/` (BA-owned).
   - Architecture + NFRs + coding standards: `architecture/` (Architect-owned).
   - UX specs: `design/` (UX-owned).
   - Tests: `tests/` (QA-owned).
   - Ops / CI / deployment: `ops/` (DevSecOps-owned).
   - Per-subagent working state: `coordination/handoffs/<role>.md`.
3. **HANDOFF-in-PR rule.** Every wave's HANDOFF refresh ships in the same PR as the code change. Never a separate doc-only PR.
4. **Living docs at the top.** `HANDOFF.md` always opens with the NOW block; older blocks demote to PREV or archive under `_archive/HANDOFF-<YYYY-MM>.md`.
5. **No basics-explanations in code comments.** Comments explain WHY (constraint, invariant, bug context) when non-obvious.

## Caveats

- **Subagents are single-turn.** Each invocation gets a fresh subagent with no memory of prior runs. Brief each one self-contained.
- **`[[DISPATCH]]` / `[[HANDOFF]]` blocks are advisory only.** Under the subagent runtime they do NOT auto-fire peer turns. The outer Claude Code orchestrator reads them and chooses what to invoke next.
- **No process to start.** There is no dev server, no MCP server, no health endpoint. The viewer is a separate repo + process.
- **Subagent files contain legacy text.** Each `.claude/agents/<role>.md` has a Plan C runtime adapter at the top that translates legacy monolith semantics (MCP tools, SQLite, `pnpm dev:test*`, `.restart-trigger`) into the file-only subagent runtime. Read the adapter — it's the authoritative translation contract until a fuller subagent body rewrite ships.

## Session continuity

`HANDOFF.md` (root, NOW block on top) is the live resume point. Update it via `/handoff` at end of session, commit the work + the HANDOFF together, push. `CLAUDE.md` (this file) is stable architecture + standards.
