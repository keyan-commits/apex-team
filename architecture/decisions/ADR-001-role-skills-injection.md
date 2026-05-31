# ADR-001 — Role Skills Injection

**Date:** 2026-05-31
**Status:** Accepted
**Requirement:** Phase 2 self-improvement — equip each peer role with domain expertise that raises output quality without changing the orchestration protocol.

## Context
Each of the six peer roles currently runs with only a generic system prompt describing its responsibilities. The UI Developer in particular was producing layouts that lacked visual hierarchy, skipped interaction states, and ignored accessibility. Similar gaps exist across all peer roles.

Options considered:
- **(a) TypeScript string constants injected at prompt-build time** (chosen)
- **(b) Claude Agent SDK native `skills?: string[]`** — enables SKILL.md procedure files (procedural capability), not domain knowledge. Useful in a later wave for Architect's code-review and QA's verify skills; wrong tool for domain expertise injection.
- **(c) External skill repos vendored** — unnecessary indirection; no runtime benefit over inline constants.
- **(d) Markdown files loaded at runtime** — same content, adds `fs.readFileSync` with no benefit; skills don't change at runtime.

## Decision
Skills are TypeScript string constants in `src/lib/skills/<role-id>.ts`. Each file exports a single `const skills: string`. The `RoleDefinition` type gains an optional `skills?: string` field. `augmentSystemPrompt()` in `providers.ts` appends the skills block when present. Non-Claude providers (Gemini, Groq) benefit automatically via the shared code path.

## Consequences
- **Positive:** Zero I/O overhead; type-checked; version-controlled alongside the prompts they extend; works for all providers.
- **Positive:** Backward-compatible — existing roles without a `skills` field are unaffected.
- **Positive:** Each role's domain expertise is visible and reviewable in one place.
- **Negative:** Skills are static strings; any dynamic or runtime-fetched skill content would need a different mechanism (not currently needed).
- **Follow-up:** Wave 2 will add skills files for all six peer roles. Wave 3 will evaluate SDK-native `skills: ['code-review']` for Architect and `skills: ['verify']` for QA.
