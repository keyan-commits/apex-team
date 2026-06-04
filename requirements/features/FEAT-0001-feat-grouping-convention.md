---
feat: FEAT-0001
title: "FEAT-XXXX Grouping Convention"
status: active
created: 2026-06-04
wave: 122
related-us: US-098
related-adr: "(pending — Architect to file after workspace-conventions.md update)"
related-design: "(none — non-UI convention)"
related-tests: "tests/qa/features/FEAT-0001-feat-grouping-convention/ (pending Wave 122 QA dispatch)"
related-ops: "ops/features/FEAT-0001-feat-grouping-convention/ (pending DevSecOps dispatch)"
---

# FEAT-0001 — FEAT-XXXX Grouping Convention

This is the meta-feature: it defines the convention itself. Every other FEAT-XXXX
feature in this workspace was organized using the rules described here and in US-098.

---

## What this feature is

A cross-team organizational convention that groups all deliverables (requirements, tests,
architecture docs, design specs, code, and CI pipelines) under a shared `FEAT-XXXX`
identifier. The convention makes every artifact for a given feature discoverable,
cross-linked, and groupable in the apex-team-viewer without hunting across flat file lists.

**Motivation (from user directive, Wave 122):**

- The LFM project's BA output showed 24+ flat `requirements/**/*.md` files with no
  grouping. The user wanted `FEAT-0001 — Add PO to Order Sheet` as a named feature
  card linking to all related artifacts.
- QA output showed "no files" — needed FEAT-grouped test rendering.
- The convention needs to span apex-team (subagent body + workspace-conventions) AND
  apex-team-viewer (rendering changes).

---

## Driving user story

[US-098 — FEAT-XXXX Grouping Convention](../user-stories/US-098-feat-grouping-convention.md)

See US-098 for the full acceptance criteria. This FEAT doc is the feature parent;
US-098 is the child story that specifies what "done" looks like for this feature.

---

## Scope of FEAT-0001

FEAT-0001 covers the CONVENTION itself (the rules, the directory layout, the registry).
It does NOT cover the implementation of:

- Subagent body amendments (US-099+, Architect ratification required first)
- Viewer rendering changes (US-099+, viewer-side implementation)
- DevSecOps pipeline scaffolding for `ops/pipelines/` + `ops/features/` (separate wave)
- LFM project feature assignments (LFM workspace has its own FEAT allocation sequence)

---

## Per-role ticket prefixes (ratified Wave 122)

Ticket numbers are allocated monotonically per role, independently of other roles.
`ADR-NNNN` remains for cross-cutting Architect decisions; `ARCH-XXXX` is feature-scoped work.

| Role | Ticket prefix | Per-role INDEX |
|---|---|---|
| BA | `FEAT-XXXX` | `requirements/features/INDEX.md` |
| Architect | `ARCH-XXXX` | `architecture/features/INDEX.md` |
| UX | `UX-XXXX` | `design/features/INDEX.md` |
| QA | `TEST-XXXX` | `tests/qa/features/INDEX.md` |
| FE Dev | `FE-XXXX` | `src/features/INDEX.md` (or project-equivalent) |
| BE Dev | `BE-XXXX` | same as FE |
| DevSecOps | `OPS-XXXX` | `ops/features/INDEX.md` |

## Mandatory frontmatter on every role deliverable

Every role deliverable file MUST include a frontmatter (Markdown) or header-comment block
(non-Markdown) with the following fields:

```yaml
---
ticket: <PREFIX-NNNN>       # this role's ticket (e.g. ARCH-0001)
parent_feat: FEAT-NNNN      # the BA feature this belongs to
parent_us: US-NNN           # the BA user story (omit if no US exists)
role: <role-id>             # e.g. architect, qa, ui-developer
status: <status>            # proposed | accepted | in-flight | done | superseded
---
```

For non-Markdown files, use the file's native comment syntax. This is the
`grep parent_feat: FEAT-XXXX` anchor that computes count columns in `requirements/features/INDEX.md`.

BA's FEAT-XXXX files use `feat: FEAT-XXXX` (not `parent_feat:`) — they ARE the parent.

## Autonomous role standard — subagent body amendment (Wave 122)

Every role subagent body (`.claude/agents/<role-id>.md`) carries a section with the
EXACT heading:

```
### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)
```

This section codifies role-specifically: the role's ticket prefix, the artifact directory
layout, the mandatory frontmatter rule (inline — not a cross-reference), the per-role
INDEX maintenance rule, and the cross-workspace applicability statement:

> "This convention applies in ANY workspace, not just apex-team."

The section heading is the canonical grep anchor used by QA regression tests. Byte-for-byte
stability is required.

Architect owns implementation of this amendment for all 8 subagent bodies (Wave 122).

## Per-role artifact directories

| Role | Path | Ticket | Status |
|---|---|---|---|
| BA | `requirements/features/FEAT-0001-feat-grouping-convention.md` (this file) | FEAT-0001 | Active |
| Architect | `architecture/features/FEAT-0001-feat-grouping-convention/ARCH-XXXX-*.md` | ARCH-XXXX | Pending — Architect to create after workspace-conventions.md update |
| UX | N/A — non-UI convention feature | — | Not applicable |
| QA | `tests/qa/features/FEAT-0001-feat-grouping-convention/TEST-XXXX-*.test.ts` | TEST-XXXX | Pending — QA dispatch after Wave 122 requirements phase completes |
| FE Dev | N/A (no apex-team source code for this convention) | — | — |
| BE Dev | N/A | — | — |
| DevSecOps | `ops/features/FEAT-0001-feat-grouping-convention/OPS-XXXX-*.sh` | OPS-XXXX | Pending — DevSecOps dispatch, separate wave |

---

## Acceptance criteria summary

See US-098 for the full testable ACs. Summary for feature-level tracking:

- [x] AC1: FEAT-XXXX naming format defined (BA, this wave)
- [x] AC2: FEAT frontmatter block spec defined (BA, this wave)
- [x] AC3: Per-role ticket prefixes + directory layout + per-role INDEX.md (BA-defined, Architect to ratify)
- [x] AC4: `requirements/features/INDEX.md` registry — canonical column shape (BA, this wave)
- [x] AC5: US-NNN coexistence rule (Option B) defined (BA, this wave)
- [x] AC6: QA test-type decision discipline defined (BA, this wave)
- [ ] AC7: Reusable DevSecOps pipelines (DevSecOps, pending wave)
- [ ] AC8: `pnpm run qa:feat` script (DevSecOps + QA, pending wave)
- [ ] AC9: Viewer rendering — FEAT-grouped cards (UI Dev + BE Dev, US-099+)
- [ ] AC10: `architecture/workspace-conventions.md` "FEAT-XXXX feature grouping (Wave 122)" section (Architect, pending)
- [x] AC11: Mandatory deliverable frontmatter spec defined (BA, this wave)
- [ ] AC12: Autonomous role standard — `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` in all 8 subagent bodies (Architect, pending Wave 122)
- [ ] AC13: Regression — Wave 122 regression test + all prior tests green (QA, pending)

---

## Status history

| Date | Wave | Status | Note |
|---|---|---|---|
| 2026-06-04 | 122 | draft → active | BA authored convention + this seed file + INDEX.md. Requirements phase complete. Implementation dispatched to Architect (workspace-conventions.md) + QA (test-type skill amendment). |
| 2026-06-04 | 122 (amend) | active | Wave 122 amendment: per-role ticket prefixes ratified (FEAT/ARCH/UX/TEST/FE/BE/OPS); mandatory frontmatter spec added (AC11); autonomous-standard AC added (AC12) with exact anchor phrase `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)`; per-role INDEX.md convention added; features/INDEX.md updated to new column shape. Architect + QA dispatches expanded accordingly. |
