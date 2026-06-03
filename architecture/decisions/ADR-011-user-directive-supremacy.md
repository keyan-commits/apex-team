# ADR-011 — User-Directive Supremacy as a Foundational Agentic Invariant

**Date:** 2026-06-03
**Status:** Accepted
**Requirement:** Issue #321 — User-directive supremacy shared skill

## Context

On 2026-06-03, during a Mac-2 LFM b2b-portal session, the team shipped a "count badge" feature that directly contradicted an explicit later user directive to "favor/keep that clean PO-Label value." The root failure cascade was:

1. **Plan primacy over directive.** The original acceptance criteria described a count badge. The user later stated a different requirement. The team continued executing against the earlier AC instead of the later directive.
2. **Fake choice offered.** After the deviation was discovered, the team presented the user with two options: (a) restore what they had asked for, (b) accept the deviation. Offering option (a) implies the user's requirement is negotiable — it is not.
3. **No conflict surface.** No agent emitted a HANDOFF or conflict signal when the later directive diverged from the plan. The conflict was silently absorbed.

These three failure modes are structural, not incidental. They can recur on any task unless encoded as a shared invariant.

**Forces at play:**

- **Multi-phase planning creates time gaps.** A user directive issued during requirements may be semantically overridden by an acceptance criterion written minutes later — or vice versa. Without an explicit recency rule, agents default to whichever artifact is most "authoritative" by convention (often the written AC), not the most recent expression of user intent.
- **Gate reviews compare artifact to AC, not to directive.** QA and Architect review against written ACs. If the AC is stale relative to a later directive, a gate can PASS a deviation.
- **Choice framing is an agency assumption.** Presenting "restore what you asked for" as an option implies the current deviation is a legitimate alternative worth evaluating. For a requirement the user already stated, it is not.

**Options considered:**

- **(a) Training / documentation only** — documents the principle in LESSONS.md but leaves no enforcement surface.
- **(b) Per-role reinforcement in individual skill files** — addresses each role in isolation; a future new role is unprotected by default.
- **(c) Shared skill constant prepended to every role's `skills` string (chosen)** — single source of truth; CI test catches any role added without the skill; applies uniformly across all providers via the existing `augmentSystemPrompt` injection path.
- **(d) Encode in `systemPrompt` directly** — `systemPrompt` is role-specific prose; a cross-cutting invariant does not belong there; harder to test for coverage.

## Decision

**User-directive supremacy is a foundational invariant encoded as a shared TypeScript string constant (`USER_DIRECTIVE_SKILL`) prepended to every role's `skills` string.** The constant lives at `src/lib/skills/_shared/user-directive-supremacy.ts`. Each role's skill file imports and prepends it before role-specific content. A CI unit test loops over every role exported from `roles.ts` and asserts the invariant key phrases are present — a new role added without the skill causes CI failure.

The invariant has five clauses:

1. **Directive supremacy** — the most recent user message expressing intent or constraint is authoritative; a later directive WINS over an earlier plan or AC.
2. **No fake choices** — never present a choice where one option is what the user already asked for; restore it without asking.
3. **Verify against the user-stated requirement, not the original AC** — if the latest directive and the written AC diverge, the directive wins; BA must update the AC before the gate passes.
4. **When in doubt, re-read** — scan the last 5 user messages before drafting, dispatching, or reviewing.
5. **Surface conflicts** — when a plan/AC conflicts with a later directive, emit a HANDOFF to PO and BA; never silently absorb.

## Placement contract (for review and testing)

`augmentSystemPrompt()` (`providers.ts:119`) assembles the final system prompt as:

```
role.systemPrompt  →  role.skills  →  [volatile: cwd, HANDOFF, inbox]
```

`role.skills` is the concatenation: `USER_DIRECTIVE_SKILL + "\n\n" + <role-specific skills>`.

**Placement rule:** `USER_DIRECTIVE_SKILL` MUST be the first content within `role.skills`. It must not be appended after role-specific content or buried mid-prompt. The CI test verifies this via substring-position check, not just contains-check.

## Consequences

**Positive:**
- The invariant is enforced at the only place where all agent prompts are assembled, covering all seven providers uniformly.
- CI catches drift: any future role missing the skill fails the unit test.
- The motivating incident is documented here and in LESSONS.md as a durable cross-user lesson (Wave 87 `[[durable-cross-user-learning]]` format).

**Negative:**
- Every role prompt grows by ~600 characters. At the current `MAX_SYSTEM_PROMPT_CHARS = 100_000` ceiling this is negligible (~0.6%), but it is a non-zero addition to the fixed section.
- The shared skill is a static string; dynamic updates (e.g., injecting the actual last 5 user messages) are not covered here and would require a separate volatile-section mechanism.

**Follow-ups:**
- BA reinforcement (AC for detecting + recording directive-vs-plan conflicts in `requirements/INDEX.md`).
- QA reinforcement (gate failure reason format: `regression against later user directive: <quote>`).
- PO reinforcement (include last 5 user messages verbatim in requirements-triad dispatches).
- ADR-012 (if warranted): extend `AgentTurnContext` with `lastUserMessages: string[]` so the volatile section can surface them automatically rather than relying on role-level instruction to re-read.
