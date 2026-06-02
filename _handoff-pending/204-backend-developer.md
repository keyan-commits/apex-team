## Done
- `src/lib/providers.ts`: exported `MAX_SYSTEM_PROMPT_CHARS = 100_000`; refactored `augmentSystemPrompt` to apply a 3-pass guard (inbox oldest-first → HANDOFF tail → peer states) with `[truncated N chars]` markers; role.systemPrompt is never truncated
- `tests/lib/providers.test.ts`: 5 new tests — under-limit passthrough, over-limit fit, marker present, role prompt untouched, oldest-inbox-first priority

## In flight
- PR open on `feature/204-max-system-prompt-guard`; awaiting Architect gate

## Next
- Architect PASS → HANDOFF QA → DevSecOps merge

## Notes
- Truncation is lazy (assemble() closure over mutable `let` vars); O(N) loop over inbox items is fine for typical inbox sizes (<100 items)
- `truncateWithMarker` output length = exactly `maxChars` bytes; marker says approxDropped (slightly understates actual because marker overhead not subtracted)
- Scope: `src/lib/providers.ts` + `tests/lib/providers.test.ts` only — zero collision with cleared train
