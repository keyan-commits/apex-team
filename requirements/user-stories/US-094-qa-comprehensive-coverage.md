# US-094 — QA comprehensive coverage: positive/negative/edge + all known inputs

**Status:** in-flight
**Wave:** 118
**Trigger:** LFM Add-PO project — date-fix feature shipped against 1 of 9 sample files (`20260524` ISO format); missed `20260525` (slash format `5/27/2026`); feature shipped + failed production; required second hot-fix. Root cause: single-sample testing instead of iterating over the full known input set.

---

## Story

As a user driving any project with apex-team's user-scope subagents installed,
I want QA to author positive + negative + edge-case tests AND iterate over
every known sample input file in the workspace,
so that single-sample QA misses (LFM Add-PO date-fix slash-format variant,
2026-06-04) cannot recur.

---

## Acceptance criteria

### AC1 — Wave 118 coverage gate mechanically asserted

`tests/qa/wave-118/comprehensive-coverage.test.ts` asserts:

(a) `.claude/skills/comprehensive-testing/SKILL.md` exists with YAML
    frontmatter containing `name: comprehensive-testing`.

(b) `.claude/agents/qa.md` contains the canonical Wave 118 hard-rule anchor
    phrase that Architect ratifies in `coordination/handoffs/architect.md`
    Wave 118 NOW before body edits land.

(c) Per-clause co-presence anchors — all of the following phrases present
    within the new comprehensive-coverage section of `qa.md`:
    - `positive`
    - `negative`
    - `edge`
    - `requirements/samples/`
    - `every known sample input`
    - `Wave 118`
    - `MANDATORY`

(d) `architecture/workspace-conventions.md` contains a
    "Comprehensive testing (Wave 118)" section, cross-linked from the
    Wave 117 "Requirements-first enforcement" section.

(e) Test passes under `pnpm test:run`. Wave 108 / 110 / 111a / 111b / 111c /
    112 / 113 / 117 regression tests remain green.

### AC2 — Skill file

`.claude/skills/comprehensive-testing/SKILL.md` exists with:

- YAML frontmatter: `name: comprehensive-testing`.
- Body documents the comprehensive-coverage rule:
  1. For every QA wave, author at minimum: one positive test path (happy
     path), one negative test path (invalid / missing input), one edge-case
     test path (boundary, format variant, empty, unexpected shape).
  2. Enumerate all known sample input files in `requirements/samples/` (and
     any project-specific sample directory disclosed in the workspace's
     `requirements/data-sources.md` or `requirements/domains/*.md`). Run or
     assert against EACH — not just one representative.
  3. If a sample file's format variant is undocumented, promote it to
     `requirements/domains/<domain>.md` before closing the wave.

### AC3 — Hard-rule clause in `qa.md` body

`.claude/agents/qa.md` gains a mandatory comprehensive-coverage section
containing the anchor phrase Architect ratifies in Wave 118 NOW. The clause
must appear before the first wave-specific S1–S9 skill rubric section.

Blocking dependency: Architect must ratify the canonical anchor phrase
(AC1b, AC1c) in `coordination/handoffs/architect.md` Wave 118 NOW before
body edits to `qa.md` land.

### AC4 — `architecture/workspace-conventions.md` cross-link

`architecture/workspace-conventions.md` gains a "Comprehensive testing
(Wave 118)" section documenting the positive/negative/edge + all-inputs
discipline. The Wave 117 "Requirements-first enforcement" section gains a
cross-reference pointing to this new section.

### AC5 — Install script wired

`scripts/install-agents-user-scope.sh` updated to symlink
`.claude/skills/comprehensive-testing/SKILL.md` →
`~/.claude/skills/comprehensive-testing/SKILL.md`.

---

## Out of scope

- Retrofitting prior QA tests in apex-team or any downstream project.
- Auto-generating test fixtures from sample inputs (the skill prescribes the
  discipline; it does not implement scaffolding).
- Wiring a downstream-project CI check that fails if QA tests don't cover
  every sample file — that is a Wave 119 candidate if needed.

---

## Owners

| Lane | Owner | Deliverable |
|---|---|---|
| Requirements | BA | This story + INDEX.md update (Wave 118) |
| Architecture gate | Architect | Ratify anchor phrase in Wave 118 NOW; AC4 workspace-conventions section |
| Skill file | QA or UI Dev | `.claude/skills/comprehensive-testing/SKILL.md` (AC2) |
| `qa.md` body edit | QA | AC3 hard-rule clause |
| Install script | DevSecOps | AC5 symlink addition |
| Test | QA | `tests/qa/wave-118/comprehensive-coverage.test.ts` (AC1) |
