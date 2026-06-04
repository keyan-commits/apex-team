# US-091 — Wave 112 cluster cleanup

**Status:** done
**Wave:** 112
**Shipped:** Wave 112 PR #393 (`68202c3` / merge `75266d3`)
**Issues:** #389 #390 #391 #196 (partial) #332 #333

---

## Story

As the apex-team, I want the residual Wave 111c follow-ups + Wave 109
backlog items closed cleanly, so that the subagent runtime has no
known orphan items and the discipline rules from prior waves are
fully encoded across all subagent bodies.

---

## Acceptance criteria

### AC1 (#389) — `_handoff-pending/` retired

`_handoff-pending/` directory deleted. `.githooks/pre-commit` rewritten
to check for modifications to `coordination/handoffs/*.md` instead of
the legacy fragment pattern. Pre-commit hook accepts current PR.

### AC2 (#390) — Python heredoc extracted

`.github/workflows/pass-verdict-format-check.yml` no longer contains a
Python heredoc; calls `python3 scripts/check-placeholder-ttl.py <args>`
instead. `scripts/check-placeholder-ttl.py` exists with shebang, license
header, locally invokable.

### AC3 (#391) — Peer-edit protocol codified

`architecture/workspace-conventions.md` contains a "Peer-edit protocol"
section: each `coordination/handoffs/<role-id>.md` is owned exclusively
by `<role-id>`. `.claude/agents/architect.md` review rubric flags
peer-HANDOFF edits as FAIL. All 8 `.claude/agents/*.md` bodies contain
a "no peer HANDOFF writes" boundary clause.

### AC4 — Shell-injection lint live

`.github/workflows/` contains an actionlint job (or equivalent grep
rule) that runs on every PR and would flag the `${{ github.event.* }}`
inline-shell anti-pattern fixed in #378 and Wave 111c follow-up.

### AC5 (#196 partial) — 5 remaining bodies have Lessons sections

`.claude/agents/business-analyst.md`, `ui-developer.md`,
`backend-developer.md`, `ux-designer.md`, `product-owner.md` each
contain a `## Lessons from prior incidents` section with 3–5 bullets
in Date/Wave/Rule/Why/Apply format. Combined with Wave 111b's 3 bodies
(architect, qa, devsecops), all 8 subagent bodies now carry Lessons
sections — closes #196 fully.

### AC6 (#332 + #333) — Positional directive-supremacy test

`tests/qa/wave-112/wave-112-completeness.test.ts` asserts:
(a) AC1–AC5 above land mechanically (presence checks for `_handoff-pending/`
deletion, script extraction, peer-edit protocol section, actionlint job,
and Lessons sections in all 8 bodies), AND
(b) directive-supremacy content appears in the first ~600 chars of each
`.claude/agents/<role>.md` body (post-frontmatter).
Closes #332 + #333. Test file named "completeness check" per BA's
Wave 109 menu framing.

---

## Out of scope

- New skill proposals beyond the Wave 111b set
- Viewer-repo subagent body work (separate codebase)
- Any pre-Plan-C functionality
