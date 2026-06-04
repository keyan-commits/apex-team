# US-093 — Requirements-first enforcement skill + implementer refusal gate

**Status:** in-flight

## Story

As a user driving any project that has apex-team's user-scope subagents
installed, I want a requirements-first skill + implementer hard-refusal
clause that mechanically prevents implementers from writing code without
a BA-authored US, so that I cannot accidentally bypass BA/QA when I
issue an implementation request — even on a downstream project, even
when I phrase it as "just fix X".

## Acceptance criteria

### AC1 — Wave 117 gate mechanically asserted

`tests/qa/wave-117/requirements-first.test.ts` asserts:

(a) The requirements-first skill exists at `.claude/skills/
    requirements-first/SKILL.md` in this repo AND is symlinked into
    `~/.claude/skills/requirements-first/SKILL.md` via
    `scripts/install-agents-user-scope.sh`.

(b) Each of `.claude/agents/backend-developer.md`,
    `ui-developer.md`, `qa.md`, `devsecops.md` contains the canonical
    hard-refusal anchor phrase Architect ratifies in
    `coordination/handoffs/architect.md` Wave 117 NOW.

(c) `.claude/agents/business-analyst.md` contains the canonical
    auto-routing anchor phrase Architect ratifies.

(d) Test passes under `pnpm test:run`. Wave 108/110/111a/111b/111c/
    112 regression tests remain green.

### AC2 — Skill content: requirements-first gate

`.claude/skills/requirements-first/SKILL.md` (and its `~/.claude/skills/`
symlink) contains:

(a) A clear statement that no implementer (BE Dev, UI Dev, QA, DevSecOps)
    may write code, tests, CI config, or operational artifacts for a
    requested feature unless a BA-authored user story (US-NNN) exists on
    disk at `requirements/user-stories/US-NNN-*.md` with status
    `accepted` or later.

(b) The mandatory routing rule: if the user issues an implementation
    request without referencing a US-NNN, the skill instructs the
    invoking agent to stop and invoke (or advise invoking) the BA
    subagent to author the story first.

(c) The handoff-to-QA routing rule: once a US is authored and accepted,
    BA routes to QA (in parallel with BE/UI Dev) so QA can write the
    test scaffold before or alongside implementation — not after.

(d) Exception tags from the REQUIREMENTS_PHASE_PROTOCOL that are valid
    bypasses of this skill, listed explicitly so implementers can self-
    assess without guessing.

### AC3 — Hard-refusal clause in implementer bodies

Each of `.claude/agents/backend-developer.md`, `ui-developer.md`,
`qa.md`, `devsecops.md` gains a hard-refusal clause (to be placed in
the body per Architect's Wave 117 ratified anchor position) that reads:

> **Requirements gate:** Before writing any implementation artifact
> (code, test, CI config, ops manifest), confirm a BA-authored
> `US-NNN` file exists at `requirements/user-stories/` with status
> `accepted` or later, OR confirm one of the REQUIREMENTS_PHASE_PROTOCOL
> exception tags applies (`[exception: trivial-ops]`, `[exception:
> gate-verdict]`, `[exception: scout-issue]`, `[exception:
> housekeeping]`, `[exception: revise-redispatch]`, `[exception:
> emergency-rollback]`, `[exception: security-hotfix]`). If neither
> condition holds, stop and route to BA to author the US first.

The exact wording is ratified by Architect in `coordination/handoffs/
architect.md` Wave 117 NOW before implementer body edits land.

### AC4 — Auto-routing clause in BA body

`.claude/agents/business-analyst.md` gains an auto-routing clause (per
Architect's Wave 117 ratified anchor position) that instructs BA to:

(a) On receiving any implementation request (direct from user or via
    PO DISPATCH), immediately author the US-NNN file before signalling
    back.

(b) After authoring and setting status to `accepted`, emit a
    `[[HANDOFF: qa]]` advisory with the US-NNN reference so QA can
    begin the test scaffold in parallel with implementation.

(c) After authoring, emit `[[HANDOFF: product-owner]]` with the US-NNN
    reference so PO can dispatch implementers.

### AC5 — Install script wired for skill symlink

`scripts/install-agents-user-scope.sh` is updated to also symlink
`.claude/skills/requirements-first/SKILL.md` into
`~/.claude/skills/requirements-first/SKILL.md`, so the skill is
available in every Claude Code session on the machine, not just within
the apex-team workspace.

## Out of scope

- Retrofitting prior US files — skill applies from Wave 117 onward.
- Auto-bootstrapping a downstream project's `requirements/user-stories/`
  directory beyond what BA does on first write.
- Wiring a downstream-project CI check.
- Changes to the REQUIREMENTS_PHASE_PROTOCOL exception tag list itself —
  that lives in the PO body and is out of BA's edit boundary.

## Traceability

- Trigger incident: Wave 117 — downstream Mac bypassed BA, went straight
  to BE Dev without a US. Existing rules (REQUIREMENTS_PHASE_PROTOCOL in
  PO body) were advisory-only; no mechanical hard-stop existed in
  implementer bodies.
- Related: `domains/orchestrator-protocol.md` §IMPLEMENTER_REFUSAL_CLAUSE
  (Wave 108 — advisory); US-087 AC3 (PR #379 — body rewrites introduced
  consultation language but not a hard gate); US-016 (mandatory triad —
  PO-side enforcement only).
- Owners: BA (this story), Architect (ratify anchor phrase + positions,
  AC1b/AC1c), QA (write `tests/qa/wave-117/requirements-first.test.ts`,
  AC1), UI Dev / BE Dev / DevSecOps (body edits, AC3), BA (body edit,
  AC4), DevSecOps (install script update, AC5).
