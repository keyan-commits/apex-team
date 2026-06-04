# QA Features Index

_Owned by QA. Updated when a new TEST-XXXX ticket is allocated._
_Last updated: 2026-06-04 (Wave 122 — first entry; QA features/INDEX.md scaffold)._

---

## How to read this index

Each row represents one QA test ticket filed under a FEAT-XXXX parent.
Columns follow the AC11 of US-098 allocation-log schema:

- **Ticket** — the QA ticket identifier (`TEST-NNNN`, zero-padded 4-digit, monotonically increasing).
- **Parent FEAT** — the BA FEAT-XXXX this test belongs to.
- **Parent US** — the BA US-NNN this test was authored under (if applicable).
- **Status** — `proposed` | `accepted` | `in-flight` | `done` | `superseded`.
- **Description** — brief one-line description of what the test covers.

This is QA's allocation log. It is NOT a copy of `requirements/features/INDEX.md`
(which aggregates counts across all role indexes). QA's index tracks TEST-XXXX
ticket allocations only.

---

## Registry

| Ticket | Parent FEAT | Parent US | Status | Description |
|---|---|---|---|---|
| TEST-0001 | FEAT-0001 | US-098 | in-flight | AC13 regression: anchor heading in all 8 bodies + role prefixes + FEAT-0001 file + INDEX column headers |

---

## TEST ticket numbering allocation log

| Ticket | Allocated | Allocated by | Context |
|---|---|---|---|
| TEST-0001 | 2026-06-04 | QA (Wave 122) | US-098 AC13 regression test — FEAT-XXXX grouping convention. First TEST ticket; dogfooding the Wave 122 path convention. |
