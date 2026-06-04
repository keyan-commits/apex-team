# Architect Features Index

_Owned by Architect. Updated at ARCH ticket creation, status change, or retirement._
_Last updated: 2026-06-04 (Wave 126 — ARCH-0002 allocated for FEAT-0005 feat-backfill command — NFR posture + orchestration protocol)._

---

## How to read this index

This is the Architect's allocation log for `ARCH-XXXX` tickets. Each row represents one feature-scoped Architect deliverable. `ARCH-XXXX` is feature-scoped; cross-cutting decisions stay under `architecture/decisions/ADR-NNNN-<slug>.md`.

Columns:

- **Ticket** — the `ARCH-NNNN` identifier (zero-padded 4-digit, allocated monotonically per Architect; never reused).
- **Parent FEAT** — the BA's `FEAT-NNNN` this deliverable belongs to.
- **Parent US** — the BA's `US-NNN` driving story (if applicable).
- **Status** — `proposed` | `accepted` | `in-flight` | `done` | `superseded`.
- **Description** — short title / scope of the ARCH deliverable.

ADR allocations are tracked separately in `architecture/INDEX.md`; this index is for the feature-scoped `ARCH-XXXX` lane only.

---

## Registry

| Ticket | Parent FEAT | Parent US | Status | Description |
|---|---|---|---|---|
| ARCH-0001 | FEAT-0004 | US-101 | accepted | Viewer a11y polish — WCAG 2.1 AA ratification + `:focus-visible` pattern ratification + code-review pre-commitment for Lane 2 viewer PR. |
| ARCH-0002 | FEAT-0005 | US-102 | accepted | FEAT backfill command — NFR posture (idempotence, dry-run-first, audit-log) + orchestration protocol (script does FS IO, subagents return proposal JSON, dispatch-plan markdown over CLI invocation) + cross-workspace portability + forbidden-surface list + conflict-resolution rule. |

---

## ARCH numbering allocation log

Architect updates this table when a new `ARCH-NNNN` is assigned. Numbers are allocated in declaration order, never in implementation order. A deferred or cancelled ticket retains its number (never reused) but changes status to `superseded`.

| ARCH | Allocated | Allocated by | Context |
|---|---|---|---|
| ARCH-0001 | 2026-06-04 | Architect (Wave 125) | First Architect feature ticket. Light NFR ratification for FEAT-0004 viewer a11y polish (WCAG 2.1 AA binding + `:focus-visible` pattern). No novel architecture; pre-commits to gating UI Dev's Lane 2 viewer PR. |
| ARCH-0002 | 2026-06-04 | Architect (Wave 126) | Second Architect feature ticket. NFR posture + orchestration protocol for FEAT-0005 retroactive backfill command. Eight NFRs ratified (idempotence, dry-run-first, subagent-orchestration boundary, cross-workspace portability, audit log, forbidden surfaces, conflict resolution, test posture). Critical design call codified in §3: dispatch-plan markdown over CLI invocation. |

---

## Cross-references

- `requirements/features/INDEX.md` — BA's feature registry (the parent index this lane links into).
- `requirements/features/FEAT-NNNN-<slug>.md` — per-feature parent documents.
- `architecture/INDEX.md` — Architect's top-level index (ADRs + flat docs).
- `architecture/decisions/` — cross-cutting `ADR-NNNN` decisions (separate lane from `ARCH-XXXX`).
- `architecture/workspace-conventions.md` §"FEAT-XXXX feature grouping (Wave 122)" — convention spec.
