## Wave 95 (US-049) — backend-developer

**Status:** Implementation complete. PR open, awaiting Architect gate.

**Deliverables:**
- `src/lib/pricing.ts`: `claude-opus-4-7` removed from `MODEL_PRICING`; `claude-opus-4-8` retained
- `src/lib/db.ts`: `migrateRetiredModels()` exported + called at boot — updates `thread_config.agent_models` JSON rows idempotently
- `tests/lib/pricing.test.ts`: snapshot updated (`opus-4-7` absent assertion)
- `tests/lib/db-opus47-migration.test.ts`: 4 tests covering happy-path, idempotency, untouched models, empty-table no-op

**Pre-HANDOFF checklist:** `pnpm type-check` 0 ✓ · `pnpm test:run` green ✓

**Out-of-scope filed:** UI `KNOWN_MODELS` in `AgentPane.tsx` + `dashboard/page.tsx` still reference `claude-opus-4-7` — separate GH issue filed per US-049 scope boundary.

**Gate sequence:** Architect PASS → QA Wave-64 smoke → DevSecOps merge
