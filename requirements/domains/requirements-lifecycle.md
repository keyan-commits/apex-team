# Requirements Lifecycle — From User Request to Merged PR

## Full flow

```
User request (via talk_to_product_owner or talk_to_role)
  └─▶ PO runs mandatory parallel triad
        ├─▶ BA writes US-NNN → requirements/user-stories/US-NNN-<slug>.md
        ├─▶ Architect returns NFR + structural design
        └─▶ UX Designer returns UI-impact analysis (or "no UI impact, skip UX gate")
  └─▶ PO files GH issue on active workspace repo (Wave 67, US-022)
  └─▶ PO dispatches implementer(s) referencing US-NNN
        ├─▶ UI Dev: feature branch feature/<wave>-<short>
        └─▶ BE Dev: same or coordinated branch
  └─▶ Implementer: pnpm type-check + pnpm test:run + pnpm build + boot smoke (:3100 /api/health)
  └─▶ Implementer opens PR on GitHub (HANDOFF.md update in same PR — mandatory)
  └─▶ Gate sequence (all must PASS before merge):
        ├─▶ UI changes → UX Designer gates visual + a11y + responsive
        ├─▶ Non-UI changes → Architect gates abstraction + naming + patterns + dead code
        ├─▶ Mixed PRs → UX + Architect in parallel; neither blocks the other
        └─▶ QA gates LAST (after all design gates PASS)
  └─▶ DevSecOps merges (squash-merge; sole agent authorized to push to main)
  └─▶ PR merge closes the GH issue(s) via "Closes #NNN" in commit body
  └─▶ BA updates US-NNN status → done; adds impl commit SHA link
```

## Story file conventions

- **Location:** `requirements/user-stories/US-NNN-<slug>.md`
- **Status lifecycle:** `proposed → accepted → in-dev → done | deferred`
- **Ownership rules:**
  - Only BA moves a story to `accepted`
  - Only PO moves a story to `deferred`
  - Implementer sets `in-dev` at branch creation
  - BA sets `done` when the PR merges, adding `impl:` + `test:` links
- **Session-continuity rule:** US file must be committed in the **SAME PR** as the wave referencing it. Never forward-reference a story before it's on disk.

## Open questions

Open questions that arise during requirements writing go in `requirements/open-questions.md` with an `OQ-<PREFIX>-NNN` ID. Examples: `OQ-APX-001` (apex-team), `OQ-LFM-001` (lfm-b2b). Status: `open → answered → closed-by-US-NNN`.

## Source of truth

`requirements/user-stories/*.md`; `requirements/INDEX.md` — current backlog + statuses; `src/lib/protocols.ts` — `PHASED_WORKFLOW_DISCIPLINE`.

## Related

- [[orchestrator-protocol]] — mandatory triad + exception tags
- [[verification-and-smoke]] — gate rubric
- [[agents]] — who owns each phase step
