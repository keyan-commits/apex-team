# QA Features Index

_Owned by QA. Updated when a new TEST-XXXX ticket is allocated._
_Last updated: 2026-06-04 (Wave 125 — TEST-0004 for FEAT-0004 / US-101 AC6)._

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
| TEST-0002 | FEAT-0003 | US-100 | in-flight | AC7 regression: pipeline existence + executability + shebang + syntax + CLI scripts + README phrases + overlay-skip |
| TEST-0003 | FEAT-0002 | US-099 | in-flight | AC8 regression: FEAT-grouped /api/artifacts shape (positive/negative/edge/iterate-all; malformed-frontmatter; BA feat: field; multi-FEAT sort; devsecops pipelines field; search filter presence) |
| TEST-0004 | FEAT-0004 | US-101 | in-flight | AC6 regression: viewer a11y polish (AC1 .search:focus-visible; AC2 solid focus ring .feat-card-header + .badge-btn; AC3 .file-open keyboard reach; AC4 .feat-card-body landmark; AC5 outline:none sweep; iterate-all 4 focus-visible selectors) |

---

## TEST ticket numbering allocation log

| Ticket | Allocated | Allocated by | Context |
|---|---|---|---|
| TEST-0001 | 2026-06-04 | QA (Wave 122) | US-098 AC13 regression test — FEAT-XXXX grouping convention. First TEST ticket; dogfooding the Wave 122 path convention. |
| TEST-0002 | 2026-06-04 | QA (Wave 124) | US-100 AC7 regression test — FEAT-0003 DevSecOps reusable pipelines + CLI runner. Positive (4) + negative (3) + edge (3) + iterate-all (3 env templates). |
| TEST-0003 | 2026-06-04 | QA (Wave 123) | US-099 AC8 regression test — FEAT-0002 viewer FEAT-grouped rendering. 51 tests: positive (7) + negative (9) + edge (5) + DevSecOps-pipelines (3) + iterate-all (9) + fixture/metadata (18). |
| TEST-0004 | 2026-06-04 | QA (Wave 125) | US-101 AC6 regression test — FEAT-0004 viewer a11y polish. 24 tests: static-parse against public/style.css + app.js; AC1 .search:focus-visible; AC2 solid focus ring (negative: no #6a8cd640); AC3 .file-open keyboard reach; AC4 .feat-card-body landmark; AC5 outline:none sweep; iterate-all 4 :focus-visible selectors; metadata self-reference. |
