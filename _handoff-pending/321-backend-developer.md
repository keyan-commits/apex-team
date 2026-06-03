## Done
- `src/lib/skills/_shared/user-directive-supremacy.ts` — shared skill with 5 clauses (Directive supremacy, No fake choices, Verify against user-stated requirement, When in doubt re-read, Surface conflicts)
- Wired `USER_DIRECTIVE_SKILL` into all 8 role skill files (architect, backend-developer, business-analyst, devsecops, product-owner, qa, ui-developer, ux-designer) — prepended before role-specific content
- Role-specific reinforcements: BA (directive-vs-plan conflict tracking + `requirements/INDEX.md` supersession log), QA (`regression against later user directive: <quote>` gate format), PO (last 5 user messages in triad dispatch)
- `src/lib/skills/__tests__/user-directive-supremacy.test.ts` type errors fixed (skills `?? ""` null-safety, removed jest-style 2-arg `toBe`)
- `LESSONS.md` entry for Wave 321 pattern
- type-check 0 errors; all 26 user-directive-supremacy tests pass; 8/8 roles covered

## In flight
- Awaiting Architect code review + QA final smoke gate

## Next
- Architect PASS → QA smoke → DevSecOps merge

## Notes
- Failing tests (`qa-321/tests/api/agent-route.test.ts`, `qa-321/tests/api/scout-trigger.test.ts`, `qa-321/tests/ops/bootstrap-workspace.test.ts`) are pre-existing failures that existed before this wave (confirmed via stash test)
- PR: `feat(skills): user-directive supremacy shared across all roles (closes #321)`
- LESSONS.md entry filed (AC5 of #321), workspace-portable per Wave 87 durable-cross-user-learning convention
