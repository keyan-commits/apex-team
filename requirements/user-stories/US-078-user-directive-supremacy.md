# US-078 — User-directive supremacy as a shared skill across all roles

**Status:** done
**Owner role:** backend-developer (skill + wiring + tests), architect (ADR-011), qa (regression test), business-analyst (INDEX + LESSONS)
**Created:** 2026-06-03
**Story ID:** US-078

---

## Narrative

As a user, I want every agent role to treat my explicit directives as authoritative over earlier plans or ACs, so that I never have to repeat myself and the team never ships the wrong thing after I've corrected course.

## Context

Incident on 2026-06-03 (Mac-2 LFM b2b-portal): user directed "favor/keep that clean PO-Label value" after an earlier plan said "count badge + management-in-tab." Team implemented the original plan, ignored the directive, then offered a fake choice: "(a) restore what you asked for OR (b) the deviation is fine." User: "Why would I choose the option I didn't ask for?" Root cause: no role's system prompt encoded directive supremacy explicitly; BA had no mandatory conflict-tracking workflow; QA verified against the original AC, not the latest stated requirement.

## Acceptance Criteria

- **AC1:** A shared skill file `src/lib/skills/_shared/user-directive-supremacy.ts` exports `USER_DIRECTIVE_SKILL` (string constant). Content covers five directives: (a) later user directive wins over earlier plan/AC, (b) no fake choices where one option is what the user already asked for, (c) gates verify against the user's latest stated requirement not the original AC, (d) re-read last 5 user messages before drafting/dispatching/reviewing, (e) emit HANDOFF block to PO + BA when a conflict is detected (no silent absorption). _(Testable: file exists and exports the string with all 5 directives)_

- **AC2:** All 8 role skill files (`product-owner`, `business-analyst`, `architect`, `ui-developer`, `backend-developer`, `qa`, `devsecops`, `ux-designer`) include `USER_DIRECTIVE_SKILL` prepended before role-specific content. Index-0 placement confirmed: the shared skill appears at the very start of the composed system prompt. _(Testable: unit test asserts each role's compiled prompt starts with / contains directive key phrases)_

- **AC3:** A CI unit test `src/lib/skills/__tests__/user-directive-supremacy.test.ts` loops over every role imported from `roles.ts` and asserts each contains the key phrases ("Directive supremacy", "No fake choices", "Verify against the user-stated requirement"). A new role added without the skill causes CI to fail. _(Testable: mutation test — temporarily remove skill from one role; test suite fails)_

- **AC4 (BA reinforcement):** BA role explicitly records every detected directive-vs-plan conflict in `requirements/INDEX.md` under a "Directive supersessions" section before answering or forwarding the work. _(Testable: INDEX.md contains the section after any conflict is surfaced)_

- **AC5 (QA reinforcement):** QA gate fails when the artifact matches the original AC but not the latest stated user directive. Failure reason must use the format: `"regression against later user directive: <quote>"`. _(Testable: gate review for any directive-supersession scenario produces this exact failure format)_

- **AC6 (PO reinforcement):** PO includes the last 5 user messages verbatim in every requirements-triad dispatch. _(Testable: HANDOFF text from a triad dispatch contains the quoted user messages)_

- **AC7 (regression test):** `__tests__/incidents/2026-06-03-po-label-directive.test.ts` seeds fixture: plan = "count badge", user directive = "favor clean PO-Label value". Asserts (a) clean PO-Label value is visible in output and (b) BA recorded the directive-vs-plan conflict. _(Testable: test passes green with the shared skill in place)_

- **AC8 (ADR-011):** `architecture/decisions/ADR-011-user-directive-supremacy.md` encodes user-directive supremacy as a foundational invariant of the agentic workflow. Architect is author. _(Testable: file exists, is linked from architecture index, states the invariant)_

## Out of Scope

- UI surface changes (no dashboard elements added).
- Workspace-specific directive-tracking (AC4 covers apex-team's `requirements/INDEX.md` only; workspace-specific tracking deferred).
- Automated directive extraction from user messages (manual / BA-triggered for now).

## Links

- impl: `2ea18a2` (PR #323 — `feat(skills): user-directive supremacy shared across all roles`)
- test: `src/lib/skills/__tests__/user-directive-supremacy.test.ts`
- regression test: `__tests__/incidents/2026-06-03-po-label-directive.test.ts`
- adr: `architecture/decisions/ADR-011-user-directive-supremacy.md`
- lessons: `LESSONS.md` § 2026-06-03 (Wave 321)
- closes: #321
