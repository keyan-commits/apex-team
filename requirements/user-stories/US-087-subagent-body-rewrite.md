# US-087 — Subagent prompt bodies reference only the Plan C runtime

**Status:** done
**Wave:** 108
**Shipped:** Wave 108 PR #379 (`586ed8d` / merge `79edd1e`)
**Owner:** Architect (ADR authorship) + DevSecOps/all roles (body edits) + QA (regression test)
**Closes:** Wave 108 work item (subagent body legacy-ref elimination)

---

## Story

As a subagent author / runtime, I want subagent prompt bodies to reference only
the Plan C runtime (files-on-disk + Agent-tool invocation +
`coordination/handoffs/<role>.md`), so that subagents don't slip into legacy
monolith patterns at execution time.

---

## Acceptance criteria

1. Architect delivers ADR-NNN (Wave 108) that codifies the rewrite rules:
   a. Enumerates every legacy-monolith reference pattern that must not appear
      in subagent bodies (e.g. `pnpm dev:test*`, `pnpm dev:supervised`,
      `/api/health`, `.restart-trigger`, `agent_state` SQLite table,
      `mcp__apex-team__*` tools, `talk_to_product_owner`, `talk_to_role`,
      `DEPLOYMENT_GATES_PROTOCOL` references to `:3100` test instance as a
      verification step).
   b. Defines any allowlist exceptions (patterns that may remain because they
      are still live under Plan C — e.g. `mcp__apex-engine__*` tools).
   c. Records the rationale for keeping, removing, or condensing the Plan C
      runtime adapter header that currently appears at the top of each agent
      file.

2. `architecture/workspace-conventions.md` is cross-linked from the ADR (and
   vice versa) so that the canonical artifact-home map and the runtime-pattern
   rules are navigable together.

3. All 8 `.claude/agents/*.md` files contain zero references to the legacy
   patterns named in the ADR (verified by the QA regression test in AC4).

4. A regression test exists at `tests/qa/wave-108/no-legacy-refs.test.ts` (or
   `.js`) that:
   a. Reads all 8 `.claude/agents/*.md` files.
   b. Asserts that none contain any of the forbidden pattern strings enumerated
      in the ADR.
   c. Passes in CI on the `feature/c1-plan-c-subagent-extraction` branch (or
      its Wave 108 successor) and must not regress on `main`.

5. The Plan C runtime adapter header decision (keep as-is / remove / condense)
   is recorded in the ADR with rationale, and the 8 agent files reflect
   whichever option is ratified.

---

## Out of scope

- Viewer-repo subagent bodies (separate codebase; re-file when viewer repo is
  created).
- apex-engine MCP tools (`mcp__apex-engine__*`) — these are still live under
  Plan C and must NOT be removed.
- Changes to `.github/workflows/` (CI workflow authorship belongs to
  DevSecOps; the QA test from AC4 may be added to CI in a separate DevSecOps
  sub-task within Wave 108).

---

## Technical notes (for Architect / implementers — not ACs)

- Concrete failure that motivates this story: PR #376's
  `_handoff-pending/107-devsecops.md` referenced `pnpm fold-handoff`, a
  monolith `package.json` script that no longer exists under Plan C.
- The Plan C runtime adapter header (lines 6–19 of each `.claude/agents/*.md`)
  was added in Wave 106 to translate legacy blocks. If it accurately translates
  them, keeping it is safe; if the body prose already causes slippage despite
  the header, condensing or removing it may be warranted — Architect decides in
  the ADR.
- ~105 legacy references survive across the 8 body files per Wave 108 analysis;
  ADR should quantify the pre/post count as a verification metric.
