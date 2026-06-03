---
name: US-086-workspace-conventions
description: Authoritative workspace directory contract for the Plan C subagent runtime — resolves OQ-085-001 and OQ-085-002; traceability wrapper for architecture/workspace-conventions.md
metadata:
  type: user-story
  status: accepted
  owner: Architect (doc) + BA (traceability)
  wave: "107"
  last-modified: 2026-06-04
---

## Story

As a subagent on the Plan C runtime, I want a single authoritative document describing the workspace directory contract, so that I can locate peer artifacts and place my own outputs in the canonical home without guessing.

## Acceptance criteria

1. **Doc exists** — `architecture/workspace-conventions.md` (or an ADR equivalent, at Architect's discretion) is committed to the repo and is not a stub.

2. **Canonical homes specified** — the document explicitly names the owner and canonical path for each role-lane:
   - `requirements/` — BA output (user stories, open questions, glossary, INDEX.md, scope.md, domain MDs)
   - `architecture/` — Architect output (ADRs, NFR briefs, workspace-conventions.md itself)
   - `design/` — UX Designer output (interaction specs, a11y specs)
   - `tests/` — QA output, including the wave-scoped artifact convention (`tests/qa/wave-NNN/`)
   - `ops/` + `.github/workflows/` — DevSecOps output
   - `coordination/handoffs/` — per-role HANDOFF docs (Plan C runtime working state)

3. **CLAUDE.md linked** — `architecture/workspace-conventions.md` is referenced from `CLAUDE.md`'s engineering-standards section (or the equivalent "canonical homes" section) so every subagent inherits the convention on load.

4. **OQ-085-001 resolved** — the QA disk-artifact location question (originally: "where do QA wave-level test artifacts live?") is answered with an explicit policy. Answer is present in `architecture/workspace-conventions.md` and cross-referenced back to this story.

5. **OQ-085-002 resolved or explicitly closed** — the "skill slot in monolith QA skill file" question is explicitly marked moot (monolith retired at Plan C cutover, PRs #373 + #374) in this story and in `requirements/open-questions.md`.

## Out of scope

- Modifying subagent prompts at `.claude/agents/*.md` — the conventions doc is a reference, not a rewrite of agent prompts.
- Viewer-repo conventions — separate codebase, parked as a Wave 108+ topic.
- NFR budgets or security policies — Architect's lane, separate from naming conventions.

## Open questions

None at acceptance. OQ-085-001 and OQ-085-002 are resolved by this story's ACs.

## Links

_(Filled in during implementation)_

- impl: `(SHA-pending)`
- test: `(not applicable — doc-only deliverable; Architect reviews)`
- qa-pass-by: `(not applicable)`
- deployed-by: `(not applicable — doc-only; no deployment gate)`
