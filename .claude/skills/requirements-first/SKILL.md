---
name: requirements-first
description: Enforce the requirements-first invariant on implementation work in ANY project. When the user requests new functionality (code, tests, behavior change), the outer Claude Code orchestrator MUST first invoke the business-analyst subagent to produce a US-NNN user-story file under the active workspace's `requirements/user-stories/`. Only AFTER BA returns with a written US file may the orchestrator dispatch QA (to author tests) and the appropriate developer (to implement) in parallel. Applies regardless of project — apex-team itself, host workspaces apex-team drives, or any standalone repo whose Claude Code session has the eight role subagents installed.
---

# requirements-first

The invariant this skill enforces:

> **Every implementation request goes through the business-analyst subagent first. The BA writes a US-NNN file in `<active-workspace>/requirements/user-stories/`. Only then do QA (tests) and the appropriate developer (code) run in parallel.**

This applies to ANY project the outer Claude Code session is driving — apex-team, downstream host workspaces, third-party repos. The eight role subagents are user-scoped (`~/.claude/agents/`) and so is this skill; the discipline travels with them.

## Why this exists

The eight subagents already document the phased workflow (Phase 1 requirements → Phase 2 implementation → Phase 3 verification → Phase 4 deployment). Each implementer body carries a "refuse work without a user-story reference" clause. But those clauses fire AT the implementer subagent — by the time they fire, the outer orchestrator has already chosen to dispatch the implementer instead of BA. The orchestrator-side guidance was advisory only.

Trigger incident: a downstream Mac running apex-team's user-scope subagents was given an implementation task. The outer Claude Code dispatched the implementing developer directly, skipping BA. Existing rules were honored at the subagent boundary but bypassed at the orchestrator boundary.

This skill is the orchestrator-side checklist. It runs BEFORE the first subagent dispatch.

## The pre-dispatch checklist

When a user message asks for implementation work in any project, the outer Claude Code orchestrator MUST run through these gates IN ORDER, BEFORE issuing any `Agent({ subagent_type: ... })` call:

### Gate 1 — Detect that this is implementation work

"Implementation work" means any of:

- Adding new functionality / behavior to a project.
- Changing existing behavior in a non-trivial way (more than a typo or comment).
- Writing tests for behavior that doesn't yet have a US.
- Fixing a bug whose root cause is unspecified (the spec for the fix is the bug; the bug needs a user story).

NOT implementation work (skip this skill):

- Pure read / investigation / "tell me how X works."
- Running an existing test suite, build, lint with no code change.
- Following an existing US that already exists on disk (the dispatch references it).
- A gate verdict on an in-flight PR (`[exception: gate-verdict]`).
- Housekeeping the user has explicitly authorized (rotate secret, rerun CI, etc.).
- Emergency rollback or security hotfix (named exceptions in the implementer subagents).

When in doubt: treat the request as implementation work. The cost of a redundant BA pass is small (one short subagent turn). The cost of skipping BA on real implementation work is large (un-specced code, no test design, gates misaligned).

### Gate 2 — Identify the active workspace

The active workspace is the outer Claude Code session's current working directory (CWD). Each project owns its own `requirements/`, `tests/`, `design/`, `architecture/` directories — apex-team's directories do NOT serve other projects. Confirm CWD with `pwd` or by inspecting the session's working tree.

If the CWD is inside a Git working tree, that working tree IS the active workspace. If not, fall back to the outer session's CWD.

### Gate 3 — Check for an existing US-NNN reference in the user's request

Scan the user message for ONE of:

1. A path matching `requirements/user-stories/US-\d+-.*\.md` (the user already wrote / pointed at a story).
2. A GitHub issue reference like `#NNN` or `Closes #NNN` whose body is in user-story format (`## Story` + `## Acceptance criteria`).
3. An explicit exception tag (`[exception: trivial-ops]`, `[exception: gate-verdict]`, `[exception: scout-issue]`, `[exception: housekeeping]`, `[exception: revise-redispatch]`, `[exception: emergency-rollback]`, `[exception: security-hotfix]`).

If any of the three is present, you may proceed to dispatch the relevant implementer subagent directly with that reference. Skip Gates 4-5; the requirements phase is already covered.

### Gate 4 — Dispatch business-analyst FIRST

If none of the three references exists, dispatch BA before any implementer. The dispatch shape:

```
Agent({
  description: "BA — write US for: <one-line summary>",
  subagent_type: "business-analyst",
  prompt: "User requirement (verbatim): <copy the user's raw request>.\n\nActive workspace: <pwd>. Write a US-NNN file at <pwd>/requirements/user-stories/US-NNN-<slug>.md with `## Story`, `## Acceptance criteria`, and `## Out of scope` sections. If <pwd>/requirements/user-stories/ does not exist, create it. Pick the next available NNN by listing existing US files. Update <pwd>/requirements/INDEX.md to reference the new file."
})
```

BA's response will contain (a) the US file path it wrote, and (b) advisory HANDOFF blocks to QA and the implementing developer (per BA's auto-routing clause). The outer orchestrator reads those advisory blocks and proceeds to Gate 5.

### Gate 5 — Dispatch QA + the implementing developer in parallel

After BA returns with the US file path, dispatch QA AND the appropriate developer in the same response (two `Agent` tool calls, parallel):

```
Agent({
  description: "QA — write tests for <US-NNN>",
  subagent_type: "qa",
  prompt: "Spec: <pwd>/requirements/user-stories/US-NNN-<slug>.md. Write tests covering each acceptance criterion. Place tests under <pwd>/tests/ per QA's conventions."
})

Agent({
  description: "<Dev> — implement <US-NNN>",
  subagent_type: "<ui-developer or backend-developer>",  // pick by AC surface
  prompt: "Spec: <pwd>/requirements/user-stories/US-NNN-<slug>.md. Implement the AC against the project's existing stack. Follow <pwd>/architecture/coding-standards.md if it exists."
})
```

Two parallel tool calls in ONE outer response — this is the "Lane B" parallelism. QA writes tests while the developer writes code; both reference the same US.

Picking the developer: if the AC touches UI files (route pages, components, stylesheets), dispatch ui-developer. If it touches backend / API / service code, dispatch backend-developer. If both, dispatch both in parallel along with QA (three parallel calls).

**For UI-touching work, ALSO dispatch ux-designer in parallel with QA + ui-developer.** UX Designer owns `<workspace>/design/` and the UI-gate review. When the AC has any pixel surface, fan out four ways: BA already returned with the US; the next response dispatches QA + ui-developer + ux-designer in parallel. UX Designer writes the design spec in `<workspace>/design/` while QA writes tests and ui-developer implements. The downstream UI gate (Phase 3) needs UX Designer's spec to gate against.

Detection rule for UI work: the AC mentions any of layout, visual hierarchy, interaction, accessibility, copy, microcopy, focus, keyboard flow, or names a file under `src/app/**/page.tsx`, `src/app/**/layout.tsx`, `src/components/**/*.tsx`, `src/app/globals.css`, or the host project's equivalents. When in doubt, include ux-designer — UX will reply "no UI impact, skip UX gate" if the AC turns out non-visual, which is cheap.

## What this skill does NOT do

- It does NOT replace the implementer subagents' own refusal clauses — those remain as a hard backstop at the subagent boundary.
- It does NOT cover Phase 3 (verification gates) or Phase 4 (deployment) — those are handled inside the relevant subagents (Architect / UX Designer / QA / DevSecOps).
- It does NOT cover the architect / ux-designer triad parallelism for waves that explicitly need NFR or UI design input. That's a Phase 1 amplification: dispatch BA + architect + ux-designer in parallel on substantial waves. For most single-task implementation requests, BA alone is sufficient and the triad would be over-dispatch.

## Anti-patterns this skill prevents

1. **Outer orchestrator dispatching a developer first** — bypasses BA, ships un-specced code.
2. **Outer orchestrator dispatching QA first** — QA writes tests against an inferred spec; the inferred spec drifts from the user's intent.
3. **Outer orchestrator writing the US itself via Write/Edit instead of dispatching BA** — bypasses BA's domain discipline (glossary updates, INDEX maintenance, OQ filing).
4. **Outer orchestrator running a single combined subagent dispatch ("BA then dev")** — the response is single-turn; "then" never happens. The orchestrator must wait for BA's return before dispatching downstream.

## When the active workspace is unconventional

- **No `requirements/` directory yet.** BA creates it on first write. Treat this as the project's first US — index, scope, glossary all start empty and BA seeds them.
- **Project uses a different requirements format (e.g. Jira, Linear).** Still dispatch BA; BA records the external system as the source of truth in `requirements/INDEX.md` and emits a stub US-NNN file that points at the external ticket. The on-disk US is the cross-role contract; the external ticket is the human-readable spec.
- **Project is read-only or a vendored dependency.** This skill does NOT apply — read-only work skips Gate 1.

## Cross-references

- `.claude/agents/business-analyst.md` — BA's auto-routing clause; emits the HANDOFF advisory blocks for QA + Dev after writing the US.
- `.claude/agents/backend-developer.md`, `ui-developer.md`, `qa.md`, `devsecops.md` — each carries the pre-flight refusal clause that fires if the orchestrator skips this skill and dispatches an implementer with no US reference.
- `architecture/workspace-conventions.md` §"Requirements-first enforcement (Wave 117)" — the durable doc explaining where this skill plugs into the directory contract.
