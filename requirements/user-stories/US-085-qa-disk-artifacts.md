# US-085 — QA produces test files on disk, not chat artifacts

**Status:** superseded
**Owner role:** qa
**Created:** 2026-06-04
**Superseded:** 2026-06-04 (same day — Wave 106 Plan C hard-cutover)
**Story ID:** US-085

---

## Resolution — superseded by Plan C subagent extraction

This story was filed during Wave 106 Lane A to close a discipline gap in the monolith's QA role (test code arriving as chat bubbles instead of files on disk). Same wave, the architecture pivoted to Plan C: every role becomes a Claude Code subagent under `.claude/agents/*.md`, files-on-disk semantics by construction, and the monolith retires.

The "tests are files on disk, not chat artifacts" discipline was baked directly into **`.claude/agents/qa.md`** during the port (PR #373). The monolith `src/lib/skills/qa.ts` edit (AC4) is no longer in scope — the monolith is on death row, the skill file goes with it. The path-convention question (OQ-085-001) and skill-slot question (OQ-085-002) are both moot under the subagent runtime: each subagent owns its own artifact conventions and there is no shared skill file to slot into.

The user committed to hard cutover on 2026-06-04 — no parallel-run window. PR #367 (US-084 AC1 monolith fence) closed unmerged the same evening for the same reason.

## Acceptance Criteria — disposition

- **AC1 — Tests are files** — discipline encoded in `.claude/agents/qa.md`. Path convention deferred to the subagent's own runtime — no monolith config to negotiate against.
- **AC2 — HANDOFF lists paths** — discipline encoded in `.claude/agents/qa.md`.
- **AC3 — Runnable in one command** — discipline encoded in `.claude/agents/qa.md`.
- **AC4 — Skill-enforced (`src/lib/skills/qa.ts`)** — **dropped.** Target file deleted in retirement PR.
- **AC5 — Smoke proof** — pending. The next subagent-driven QA wave proves the discipline by producing test files on disk. Recorded in HANDOFF when it occurs.

## Open Questions — disposition

- **OQ-085-001** (AC1 path convention) — **moot.** No shared vitest config to coordinate against; subagent runtime owns its artifact conventions.
- **OQ-085-002** (AC4 skill slot) — **moot.** No shared skill file; `.claude/agents/qa.md` is the skill file.

## Links

- Plan C extraction PR: #373 (`feature/c1-plan-c-subagent-extraction`)
- Discipline location: `.claude/agents/qa.md` (added in PR #373)
- Hard-cutover decision: HANDOFF NOW block, 2026-06-04
