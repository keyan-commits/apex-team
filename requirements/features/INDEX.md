# Features Index

_Owned by Business Analyst. Updated at FEAT creation, status change, or retirement._
_Last updated: 2026-06-04 (Wave 122 amendment — column shape updated to canonical form; per-role ticket prefixes ratified)._

---

## How to read this index

Each row represents one feature. Columns:

- **FEAT** — the canonical identifier (`FEAT-NNNN`, zero-padded 4-digit). Never reused.
- **Slug** — human-readable feature name (lowercase-hyphenated from FEAT file title).
- **Status** — `draft` | `active` | `accepted` | `done` | `deferred`.
- **ARCH / UX / TEST / FE / BE / OPS** — count of linked tickets per role, derived by grepping `parent_feat: FEAT-XXXX` across each role's `features/` directory. BA updates these counts when a peer notifies BA of a new role ticket, or on any wave-close sweep.

Full context (wave, US-NNN refs, open questions) lives in the FEAT-XXXX file itself.

## Registry

| FEAT | Slug | Status | ARCH | UX | TEST | FE | BE | OPS |
|---|---|---|---|---|---|---|---|---|
| FEAT-0001 | feat-grouping-convention | active | 0 | 0 | 0 | 0 | 0 | 0 |

---

## FEAT numbering allocation log

BA updates this table when a new FEAT number is assigned. Numbers are allocated in
declaration order, never in implementation order. A deferred or cancelled feature
retains its number (never reused) but changes status to `deferred`.

| FEAT | Allocated | Allocated by | Context |
|---|---|---|---|
| FEAT-0001 | 2026-06-04 | BA (Wave 122) | Meta-feature: the FEAT-XXXX grouping convention itself. Dogfooding example + template. |

---

## Per-role ticket prefix reference

All roles follow this prefix table. Numbers are independent per role.

| Role | Prefix | Per-role INDEX |
|---|---|---|
| BA | `FEAT-XXXX` | `requirements/features/INDEX.md` (this file) |
| Architect | `ARCH-XXXX` | `architecture/features/INDEX.md` |
| UX Designer | `UX-XXXX` | `design/features/INDEX.md` |
| QA | `TEST-XXXX` | `tests/qa/features/INDEX.md` |
| FE Developer | `FE-XXXX` | `src/features/INDEX.md` (or project-equivalent) |
| BE Developer | `BE-XXXX` | same as FE |
| DevSecOps | `OPS-XXXX` | `ops/features/INDEX.md` |

Note: `ADR-NNNN` stays for cross-cutting Architect decisions; `ARCH-XXXX` is feature-scoped work.

---

## Directive supersessions

_(BA records any user directive that changes a ratified AC or feature scope here.)_

| Date | FEAT | Changed item | Prior wording | User directive (verbatim) |
|---|---|---|---|---|
| 2026-06-04 | FEAT-0001 / US-098 | features/INDEX.md column shape | `FEAT | Title | Status | Wave | US-NNN refs | Feature doc | Other artifacts` | "The respective deliverables of each role should have their own ticket formats, they should properly link to the BA's FEATURE ticket/US so that I will know what is the requirement" + ratified prefix table (Wave 122 amendment) |
| 2026-06-04 | FEAT-0001 / US-098 | AC12 anchor phrase | `### FEAT-XXXX feature grouping standard (Wave 122)` | `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` (user added `— MANDATORY` to make grep anchor distinct) |
