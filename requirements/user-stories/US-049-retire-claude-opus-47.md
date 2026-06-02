---
id: US-049
title: Retire claude-opus-4-7 model — remove from pricing + boot migration (Wave 95)
status: done
wave: 95
closes: "#223"
owner: BE Dev
created: 2026-06-02
accepted: 2026-06-02
impl: "7468794"
---

## Story

As a user, I want the app to automatically migrate any threads that still reference the retired `claude-opus-4-7` model to the current `claude-opus-4-8`, so that existing conversations are not broken when the retired model entry is removed from the pricing table.

## Acceptance criteria

1. `src/lib/pricing.ts`: `claude-opus-4-7` entry removed from `MODEL_PRICING`.

2. `src/lib/db.ts`: idempotent `migrateRetiredModels()` function rewrites `thread_config.agent_models` JSON, replacing `claude-opus-4-7` → `claude-opus-4-8` on every server boot.

3. Migration is idempotent: running twice produces the same result as running once.

4. Unit tests cover: happy-path migration, idempotency, untouched models unchanged, empty-table no-op.

5. Pricing snapshot test updated to reflect the removal.

## Out of scope

- UI `KNOWN_MODELS` constant in `AgentPane.tsx` and `dashboard/page.tsx` — filed as separate GH issue.
- Removing other deprecated model entries not yet retired.

## Implementation

- impl: `7468794` (PR #223, merged Wave 95)
- Test: `tests/lib/db-opus47-migration.test.ts` + `tests/lib/pricing.test.ts`
- 343/343 tests pass post-merge.

## Notes

- AC4 was not explicitly committed (no separate AC4 test for untouched models is needed — covered by the multi-model migration test).
- Uses the fragment pattern (`_handoff-pending/95-backend-developer.md`) introduced by US-047.
