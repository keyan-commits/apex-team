# ops/features — OPS ticket allocation log

DevSecOps-owned. Monotonically allocated `OPS-NNNN` ticket numbers, one row per deliverable.
This is NOT a copy of `requirements/features/INDEX.md` (BA-owned). It tracks DevSecOps pipeline
artifacts scoped to specific features.

## Columns

`Ticket | Parent FEAT | Parent US | Status | Description`

## Allocation table

| Ticket   | Parent FEAT | Parent US | Status    | Description                                           |
|----------|-------------|-----------|-----------|-------------------------------------------------------|
| OPS-0001 | FEAT-0003   | US-100    | in-flight | `ops/pipelines/dev.sh` — dev environment template     |
| OPS-0002 | FEAT-0003   | US-100    | in-flight | `ops/pipelines/staging.sh` — staging environment template |
| OPS-0003 | FEAT-0003   | US-100    | in-flight | `ops/pipelines/prod.sh` — production environment template |
| OPS-0004 | FEAT-0005   | US-102    | in-flight | `scripts/feat-backfill.mjs` — retroactive FEAT backfill CLI script + `pnpm run feat:backfill` wrapper |

## Allocation rules

- Numbers are zero-padded 4-digit (`OPS-0001`, `OPS-0002`, …). Never reuse a number.
- Allocate monotonically from the next unused number in this table.
- Before a wave closes, add a row for every new OPS deliverable shipped that wave.
- Cross-workspace applicability: each project gets its OWN `ops/features/INDEX.md`; OPS
  numbers are per-project, not globally unique across all workspaces.
