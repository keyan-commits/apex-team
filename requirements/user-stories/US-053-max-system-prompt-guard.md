---
id: US-053
title: MAX_SYSTEM_PROMPT_CHARS guard — bound augmented system prompt to 100k chars (Wave 97)
status: done
wave: 97
closes: "#204"
owner: BE Dev
created: 2026-06-02
accepted: 2026-06-02
impl: "8875ce4"
---

## Story

As the team, I want a hard ceiling on the augmented system prompt so that unbounded HANDOFF doc growth cannot silently blow Claude's context budget mid-wave, causing the model to silently drop tool calls or produce malformed responses.

## Acceptance criteria

1. `augmentSystemPrompt()` in `src/lib/providers.ts` enforces a `MAX_SYSTEM_PROMPT_CHARS = 100_000` ceiling.

2. Truncation is 3-pass in priority order: (a) oldest inbox messages first, (b) HANDOFF doc tail, (c) peer states. The agent's core `role.systemPrompt` is NEVER truncated.

3. A `[truncated N chars]` marker is injected so agents know content was dropped and can request re-send or escalate.

4. 5 unit tests cover: no truncation below ceiling, truncation triggers at ceiling, priority ordering of truncation passes, marker injection, role.systemPrompt preserved.

## Out of scope

- Per-role ceiling configuration (single constant for Wave 97).
- Streaming partial system prompts (synchronous truncation only).
- UX warning when a role's HANDOFF exceeds threshold (separate enhancement).

## Implementation

- impl: `8875ce4` (PR #228 `feature/204-max-system-prompt-guard`, Architect PASS received Wave 97)
- Tests: `tests/lib/providers.test.ts` (5 new unit tests)

## Notes

- Tracked as GH issue #204 rather than by US number in the original implementation commit.
- Story number US-053 assigned retroactively during Wave 97 audit-trail backfill (2026-06-02).
- Architect PASS confirmed by inline HANDOFF in this session; merge pending DevSecOps train.
