# Workspace Conventions — directory contract for the apex-team subagent runtime

<!-- Tracked by US-086 (Wave 107) — see requirements/user-stories/US-086-workspace-conventions.md -->

- **Status:** Accepted
- **Date:** 2026-06-04
- **Wave:** 107 (first wave under Plan C subagent runtime)
- **Owner:** Architect
- **Authority:** This document is the **single source of truth** for where every deliverable in this repo lives. Every subagent reads this; deviations require a follow-up PR that updates this doc first.
- **Companion docs:** `CLAUDE.md` §"Engineering standards" item 2; `architecture/INDEX.md`.
- **Resolves:** OQ-085-001 (test artifact retention policy), OQ-085-002 (skill-slot rescoping under subagent runtime).

---

## Why this exists

Under the Plan C runtime (`ebc83c5`, Wave 106) the apex-team monolith is retired — no Next.js server, no MCP server, no SQLite `agent_state` table. The 8 Claude Code subagents under `.claude/agents/*.md` coordinate **exclusively through files on disk**. The instant two subagents disagree about where a deliverable belongs, the discipline collapses — chat-bubble artifacts become indistinguishable from "real" ones, gates can't find what they're gating, and the dogfooding loop breaks.

This doc encodes the directory contract once so the eight subagents — and any future ninth — read the same map.

## The contract — what lives where

Authoritative path → owning role → contents → notes.

| Path | Owner | Contents | Notes |
|---|---|---|---|
| `requirements/` | business-analyst | Functional requirements: user stories, scope, glossary, open questions, business rules, domains, data sources, samples. | `requirements/INDEX.md` indexes every artifact. `requirements/open-questions.md` holds open questions in `OQ-NNN-NNN` form. |
| `requirements/user-stories/US-NNN-<slug>.md` | business-analyst | One user story per file. File naming **MUST** match `US-NNN-<kebab-slug>.md`; NNN is a zero-padded monotonically increasing integer. | Body **MUST** open with `## Story` + `## Acceptance criteria` + `## Out of scope`. Other sections (Notes, OQs, etc.) optional. |
| `architecture/` | architect | NFRs, coding standards, system design, ADRs, plus this workspace-conventions doc. | `architecture/INDEX.md` indexes ADRs + flat docs. |
| `architecture/decisions/ADR-NNN-<slug>.md` | architect | One ADR per file. NNN is monotonically increasing; gaps allowed (deletions are forbidden — supersede instead). | ADR template: Status / Date / Wave / Context / Decision / Consequences / Fitness functions (where applicable). Status transitions: Proposed → Accepted → Superseded. |
| `architecture/nfr.md` | architect | Quantified non-functional requirements with measurement methods. | Vague NFR = wish. Every NFR carries its fitness function or a `tests/qa/` smoke pointer. |
| `architecture/operations/` | architect | Operational runbooks owned by Architect (e.g. mcp-client-rebind.md). | Distinct from `ops/` — these are architectural-level concerns, not CI/CD recipes. |
| `architecture/coding-standards.md` | architect | Naming, layout, patterns the team **MUST** follow. | Cited by code reviews — "this violates §X of coding-standards.md." |
| `design/` | ux-designer | Per-feature design specs, wireframes, interaction-state inventories, a11y / motion / contrast call-outs. | One spec per US or per issue. `design/INDEX.md` indexes. |
| `tests/` | qa | All test code — unit, smoke, regression, UI, backend, security. | Vitest is the runner; per-test layout is QA's call within the conventions below. |
| `tests/qa/wave-NNN/` | qa | The canonical per-wave home for tests authored during wave NNN. | Test **code** committed; **evidence** (screenshots, console logs, traces) gitignored — see OQ-085-001 resolution below. |
| `ops/` | devsecops | CI/CD recipes, secrets policy, deploy scripts, supply-chain manifests, branch-protection payloads, ops README. | **Carveout:** GitHub Actions workflows live at the repo root under `.github/workflows/*.yml`, NOT under `ops/`. GitHub requires this path. `ops/README.md` cross-references the workflow files. |
| `.github/workflows/*.yml` | devsecops | CI workflows enforced by GitHub Actions. | Repo-root carveout; conventionally owned by DevSecOps but path is fixed by GitHub. Pre-commit hooks at `scripts/git-hooks/` likewise live outside `ops/` for the same path-dependence reason. |
| `coordination/handoffs/<role-id>.md` | each subagent owns its own file | Per-role working state ("HANDOFF doc"). Files-on-disk replacement for the retired SQLite `agent_state` table. | One file per subagent. Naming **MUST** match the subagent's role-id exactly (see role-id list below). |
| `HANDOFF.md` (repo root) | rotates per wave; PO consolidates | Wave-level NOW block + recent session history. | Composed via towncrier-style fragments at `_handoff-pending/<wave>-<role>.md`, folded by PO with `pnpm fold-handoff` (ADR-014). |
| `LESSONS.md` (repo root) | shared | Append-only "we hit X, it broke for Y, we now do Z." | Explains WHY conventions exist. Never edited in place — only appended. |
| `_handoff-pending/<wave>-<role>.md` | each role authors its own fragment | Per-wave HANDOFF fragment; folded into `HANDOFF.md` at wave close. | ADR-014. PO writes no fragment — the fold commit IS PO's state update. |
| `INDEX.md`, `INDEX.yaml` (repo root) | shared | Machine-readable doc index. Edit `INDEX.yaml`; the human view regenerates. | Per the `/handoff-init` global convention. |

### Role-id list (canonical, exact spelling)

`product-owner`, `business-analyst`, `architect`, `ux-designer`, `ui-developer`, `backend-developer`, `qa`, `devsecops`.

Subagent definition files: `.claude/agents/<role-id>.md`. HANDOFF files: `coordination/handoffs/<role-id>.md`. Role-ids **MUST** match across both surfaces; renaming a role requires updating both (plus this doc).

## OQ-085-001 — Test artifact retention policy (RESOLVED)

**Question (original framing, Wave 106):** Are artifacts under `tests/qa/wave-NNN/` gitignored, retained, or pruned after N waves?

**Resolution (this doc, Wave 107):**

**Test code is retained (committed) indefinitely. Evidence artifacts are gitignored.**

Concretely:

1. **Test code** — `*.test.ts`, `*.test.tsx`, fixture builders, helper modules under `tests/qa/wave-NNN/` — **committed**. Treated like any other source artifact. Never pruned by wave age; only deleted when the code under test is deleted (in which case the deletion travels in the same PR).
2. **Evidence artifacts** — screenshots (`*.png`), console logs (`*.log`), browser traces (`*.zip`, `*.har`), Playwright videos, vitest snapshots-as-binary — **gitignored** under `tests/qa/wave-NNN/evidence/`. A `README.md` at that path (committed) records *what was captured*, *when*, *for which gate verdict*, and a *short reproduction recipe* so any future reader can regenerate the evidence on demand.
3. **Snapshot files** (e.g. Vitest `__snapshots__/` text snapshots) — **committed** with the test code; they ARE the assertion. Distinct from "evidence" above.

**Rationale:**

- Test code is durable: it documents intent and regression coverage long after the wave that birthed it. Pruning would erase regression history. Disk cost is negligible (text).
- Evidence binaries inflate the repo without proportional value — they're outputs of running the tests, not the tests themselves. The `README.md` at `evidence/` keeps the *audit trail* (what gate this evidence supported, on what date, for which PR) without the binary weight.
- The wave-NNN directory boundary is a per-wave scratchpad for **organization**, not a retention horizon. A wave-203 test continues to live at `tests/qa/wave-007/` if that's where it was authored — moving tests after the fact churns history for no gain.

**Gitignore entry (DevSecOps owns the actual `.gitignore` edit):**

```
# Evidence artifacts (screenshots, logs, traces) — README.md at each evidence dir
# explains what was captured. Test code itself is committed.
tests/qa/wave-*/evidence/*
!tests/qa/wave-*/evidence/README.md
```

**Migration of old waves:** N/A. Wave 107 is the first wave under this convention. Pre-wave-107 test artifacts don't exist (the monolith's testing approach was different and is retired with `src/`).

**Fitness function (QA owns; tracked separately):** a vitest pre-flight check that any directory matching `tests/qa/wave-*/evidence/` contains a `README.md` and that no committed file in such a directory matches the binary-extension allow-list. Wire into CI alongside `pnpm test:run`. Filed as a follow-up if not in scope this wave.

## OQ-085-002 — Skill-slot question (CLOSED, re-scoped)

**Question (original framing, Wave 106):** Which section of `src/lib/skills/qa.ts` holds the "tests are files on disk" discipline (AC4 of US-085)?

**Resolution (this doc, Wave 107):** **The original framing no longer makes sense.** `src/lib/skills/qa.ts` was deleted as part of the Plan C cutover (PR #373; monolith retirement) — there is no shared skill file under the subagent runtime to slot a section into.

Under the subagent runtime, **`.claude/agents/qa.md` IS the skill file** for the QA role. The "tests are files on disk, not chat artifacts" discipline was absorbed directly into that file during the port. The "skill slot" abstraction is gone — each subagent's `.md` is one self-contained document; sections inside it are organized for human readability, not for slot-based composition.

**Closing with that reasoning.** No follow-up needed. The discipline is enforced by:

1. The text of `.claude/agents/qa.md` itself.
2. This workspace-conventions doc, which names `tests/` as QA's canonical home and chat-bubble code as not counting.
3. Code reviews — Architect FAILs a review if QA delivered test artifacts only in chat without landing files at the conventional paths.

## Enforcement model

The contract is **enforced at three layers**, weakest to strongest:

1. **Subagent prompts** (`.claude/agents/*.md`) — each role's prompt declares its lane. Soft enforcement; depends on the model honoring the prompt.
2. **Code review** (Architect) — a PR that lands deliverables outside their canonical path FAILs the design gate with a citation to this doc. Strong enforcement on the PR boundary.
3. **Pre-commit hooks + CI** (DevSecOps) — `scripts/git-hooks/` and `.github/workflows/` mechanically reject violations. Strongest enforcement; only feasible for patterns expressible as a static check (e.g. "every PR that touches source MUST include a HANDOFF fragment").

When a new constraint earns enough recurrence to deserve hard enforcement, DevSecOps adds it at layer 3 and this doc is updated with a citation.

## How to evolve this contract

1. **Open an ADR.** Proposed change → `architecture/decisions/ADR-NNN-<slug>.md` with Context / Decision / Consequences. Cite this doc as the contract being amended.
2. **Update this doc** in the same PR that lands the ADR. Single PR, two artifacts — never an ADR without the contract update, never a contract change without the ADR rationale.
3. **Update `CLAUDE.md` §"Engineering standards" item 2** if the change reshapes the top-level lane map.
4. **Update `architecture/INDEX.md`** to reflect the ADR + any new flat docs.
5. **Announce in `HANDOFF.md` NOW block** for the wave that lands the change so every subagent picks it up on next session pickup.

Renames or deletions of an entire convention class (e.g. removing `coordination/handoffs/` in favor of some new mechanism) are **Rule 6 destructive actions** under the global agentic workflow — they require explicit separate user approval, not bundled inside a larger wave.

## Out of scope (this doc / Wave 107)

- **Per-subagent prompt edits.** Out of scope per the PO's brief. If a subagent's `.claude/agents/<role>.md` references retired paths or stale conventions, that's a separate wave's work — file as `self-improvement` if found.
- **Viewer repo conventions.** `keyan-commits/apex-team-viewer` is a separate codebase with its own conventions. Cross-repo coordination is a future wave's concern.
- **Historical migration** of pre-Wave-107 artifacts. The cutover is a hard reset; we do not retroactively reorganize anything authored before this doc landed.

## Cross-references

- `CLAUDE.md` — "Engineering standards" item 2 cites this doc as the source of truth.
- `architecture/INDEX.md` — lists this doc in its flat-docs section.
- `requirements/open-questions.md` — OQ-085-001 + OQ-085-002 resolution lines point here.
- `requirements/user-stories/US-085-qa-disk-artifacts.md` — superseded marker references this doc as the ratified home of the QA path convention.
- `architecture/decisions/ADR-014-handoff-fragment-pattern.md` — defines the `_handoff-pending/<wave>-<role>.md` fragment mechanism cited above.
