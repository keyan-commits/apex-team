---
id: US-019
title: Mandatory dev-server smoke before QA PASS
slug: mandatory-dev-smoke-before-pass
status: superseded
owner: BE Dev (Wave 64-impl); DevSecOps coordinates on ci.yml
closes: "#141"
created: 2026-06-01
last_modified: 2026-06-01
---

## Resolution — superseded by Plan C cutover

All ACs target `src/lib/protocols.ts` VERIFICATION_PHASE_PROTOCOL, `src/lib/skills/qa.ts`, `pnpm dev:test`, and `:3100/api/health` — all monolith surfaces retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). The two-leg smoke gate (pnpm build + server health) was replaced by a subagent-runtime QA discipline encoded in `.claude/agents/qa.md` (Wave 108, PR #379).

## Story

As the user driving apex-team via MCP, I want QA's PASS rubric to require a TWO-LEG smoke — `pnpm build` (catches route-graph parse errors via SWC/Turbopack) AND a boot+health check on `:3100` (catches `server.ts`/`src/mcp/*` which run via tsx/esbuild outside the build graph) — so that parse errors which slip past `tsc` and `vitest` cannot ship to deployment.

## Acceptance criteria

1. `src/lib/protocols.ts` `VERIFICATION_PHASE_PROTOCOL` is amended to encode: every QA PASS requires BOTH legs — (a) `pnpm build` must succeed (catches Next route-graph parse errors including all `src/lib/skills/*.ts` and `src/lib/roles.ts` which are transitively imported by the chat API route — this is the `e7d4ba6` class of failure), AND (b) boot `:3100` (`pnpm dev:test`) + `GET /api/health` → 200 (catches `server.ts` + `src/mcp/*.ts`, which run via tsx/esbuild and are NOT in the next-build graph). Neither leg alone is sufficient: `pnpm build` does not compile `server.ts`; the boot check does not eagerly compile the route graph. No PR passes QA without BOTH legs passing.

2. `src/lib/skills/qa.ts` gains a `### Mandatory build smoke before PASS (Wave 64)` section with exact wording: (a) `pnpm build` must succeed before PASS; (b) if build fails, reply REVISE with the exact error; (c) for UI surfaces, browser exercise (Wave 53b rule) is additive — not replaced; (d) for pure non-UI PRs, `pnpm build` IS the runtime smoke — no browser needed. Section cites the incident: "Wave 55-roles `e7d4ba6` shipped with a parse error that bypassed tsc/vitest; build catches it."

3. `.github/workflows/ci.yml` adds a `pnpm build` step on every PR push, running parallel to type-check + test:run — CI parity with QA's local gate. DevSecOps owns the YAML change; Architect specifies the contract (step name, position, failure semantics).

4. The new rubric applies retroactively to PR #138 (Wave 55-roles hotfix SHA): QA re-gates by running `pnpm build` on the committed hotfix SHA before issuing the final PASS. Self-dogfooding — the first PR to exercise the new rule is the one that introduced it.

5. `LESSONS.md` retro entry is added for Wave 64, citing commit `e7d4ba6`, the exact SWC error (`Expected a semicolon at 24:217`), and the rule: "`tsc` and `vitest` do NOT invoke Turbopack/SWC — they load `.ts` files as string constants. Any template-literal content with em-dashes, escaped backticks, or SWC-rejected syntax passes both checks and crashes the live server. `pnpm build` is the definitive gate."

6. Regression-guard tests in `tests/lib/protocols.test.ts` + `tests/lib/roles.test.ts` assert that the new rule text exists in `VERIFICATION_PHASE_PROTOCOL` (protocols.ts) and in QA's skill prompt — so the gate cannot silently regress in a future PR.

## Out of scope

- The PR #138 hotfix commit itself (UI Dev — Wave 55-roles emergency, parallel this turn).
- Architect's design for the exact `VERIFICATION_PHASE_PROTOCOL` text and `qa.ts` section wording (Architect's lane, parallel — exact text drops into this story's AC1/AC2 slot before implementation begins).
- Any changes to QA's browser-verification discipline (Wave 53b rule preserved, not replaced).
- Turbopack-specific `--turbo` flag investigation (Architect's design determines whether `pnpm build` or `pnpm dev`+healthcheck is the right smoke — see AC1 note).
- Phase D / search / envs-visibility features — all parked until Wave 64 merges per user mandate.
