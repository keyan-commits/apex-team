# US-098 — FEAT-XXXX Grouping Convention

- **Status:** accepted
- **Wave:** 122
- **Created:** 2026-06-04
- **Main SHA at creation:** 0b4f7bd
- **Owners:**
  - BA: defines this story + FEAT-0001 seed file + features/INDEX.md; ratifies per-role ticket prefix scheme + mandatory frontmatter spec + per-role INDEX.md convention
  - Architect: ratifies per-feature directory layout; updates `architecture/workspace-conventions.md`; **amends ALL 8 role subagent bodies** (`.claude/agents/<role>.md`) with `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` section (Wave 122 amendment)
  - QA: regression test asserting (a) autonomous-standard clause present in all 8 subagent bodies with role-specific ticket prefix, (b) canonical anchor phrase is grep-stable, (c) FEAT-0001 + features/INDEX.md exist with correct shape, (d) all prior tests green
  - UI Dev + BE Dev: viewer rendering changes (deferred — separate waves US-099+)
  - DevSecOps: pipeline scaffolding (deferred — separate wave)
- **Scope:** apex-team + apex-team-viewer (implementation of viewer rendering deferred to US-099+). The autonomous-standard amendment (AC12) applies to ALL downstream projects (LFM, bidshop, etc.) — each role's subagent body carries the convention so it is followed in any workspace without extra instruction.

---

## Story

As a team member and product owner, I want all deliverables (requirements, tests, architecture docs, design specs, code, and CI pipelines) organized under a shared FEAT-XXXX feature identifier so that every artifact for a given feature is discoverable, cross-linked, and groupable in the viewer without hunting across flat file lists.

---

## Acceptance criteria

### Convention definition

**AC1 — FEAT-XXXX naming format**

The FEAT-XXXX identifier MUST conform to the pattern `FEAT-` followed by a zero-padded 4-digit decimal (0001–9999). The BA assigns a FEAT number at requirement-doc creation time. Allocation is monotonically increasing; numbers are never reused after retirement. The first feature is FEAT-0001.

Rationale for suffix-in-filename over frontmatter-only: both are valid, but filename inclusion makes the feature grouping visible in `ls`, `find`, diff views, and the viewer's file-system poll without parsing file content. Frontmatter is additive (see AC2) but not the primary anchor.

**AC2 — FEAT frontmatter block**

Every FEAT-XXXX file MUST open with a YAML frontmatter block containing at minimum:

```yaml
---
feat: FEAT-XXXX
title: "<human-readable title>"
status: draft | active | done | deferred
created: YYYY-MM-DD
wave: NNN
---
```

Additional fields (`owner`, `related-us`, `related-adr`, `related-design`, `related-tests`, `related-ops`) are optional but encouraged.

**AC3 — Per-role per-feature artifact layout and ticket prefixes**

Every role has its own ticket prefix for its deliverable files. Ticket numbers are allocated monotonically per role, independently of other roles (ARCH-0001 is the Architect's first ticket regardless of which FEAT it belongs to). `ADR-NNNN` stays for cross-cutting Architect decisions; `ARCH-XXXX` is feature-scoped Architect work. Each role maintains its own allocation index at `<role-dir>/features/INDEX.md`.

Ratified prefix table (canonical — no deviation permitted):

| Role | Ticket prefix | Example filename | Artifact root | Per-role INDEX |
|---|---|---|---|---|
| BA | `FEAT-XXXX` | `requirements/features/FEAT-0001-add-po-to-order-sheet.md` | `requirements/features/` | `requirements/features/INDEX.md` |
| Architect | `ARCH-XXXX` | `architecture/features/FEAT-0001-add-po-to-order-sheet/ARCH-0001-effective-delivery-date.md` | `architecture/features/FEAT-XXXX-<slug>/` | `architecture/features/INDEX.md` |
| UX | `UX-XXXX` | `design/features/FEAT-0001-add-po-to-order-sheet/UX-0001-shift-picker-spec.md` | `design/features/FEAT-XXXX-<slug>/` | `design/features/INDEX.md` |
| QA | `TEST-XXXX` | `tests/qa/features/FEAT-0001-add-po-to-order-sheet/TEST-0001-slide-route-rule.test.ts` | `tests/qa/features/FEAT-XXXX-<slug>/` | `tests/qa/features/INDEX.md` |
| FE Dev | `FE-XXXX` | `src/features/FEAT-0001-add-po-to-order-sheet/FE-0001-shift-picker.tsx` | `src/features/FEAT-XXXX-<slug>/` (target project repo) | `src/features/INDEX.md` (or project-equivalent) |
| BE Dev | `BE-XXXX` | `src/features/FEAT-0001-add-po-to-order-sheet/BE-0001-po-inject-service.ts` | `src/features/FEAT-XXXX-<slug>/` (target project repo) | same as FE |
| DevSecOps | `OPS-XXXX` | `ops/features/FEAT-0001-add-po-to-order-sheet/OPS-0001-deploy.sh` | `ops/features/FEAT-XXXX-<slug>/` | `ops/features/INDEX.md` |

Notes:
- FE Dev and BE Dev share the `src/features/FEAT-XXXX-<slug>/` tree but have separate ticket prefixes (`FE-` vs `BE-`). Their files coexist in the same directory.
- A role MUST create its per-feature subdirectory or file only when it has an artifact to deliver. Empty placeholder directories are discouraged — use a `README.md` noting "no artifacts yet" if the directory must exist for structural reasons.
- The `requirements/features/INDEX.md` row (AC4) tracks counts of linked tickets per role so discoverability does not depend on directory traversal.
- Each role's INDEX at `<role-dir>/features/INDEX.md` tracks that role's own ticket allocations (ticket id, parent_feat, parent_us, status, brief description). It is that role's allocation log — not a copy of the BA's features/INDEX.md.

**AC4 — `requirements/features/INDEX.md` registry**

`requirements/features/INDEX.md` is the top-level feature registry. It MUST be updated by BA every time a FEAT-XXXX file is created, changed in status, or retired. Canonical row format:

```markdown
| FEAT | Slug | Status | ARCH | UX | TEST | FE | BE | OPS |
|---|---|---|---|---|---|---|---|---|
| FEAT-0001 | feat-grouping-convention | accepted | 0 | 0 | 1 | 0 | 0 | 0 |
```

Columns:
- **FEAT** — identifier.
- **Slug** — human-readable short name (from the FEAT file's title, lowercase-hyphenated).
- **Status** — `draft` | `active` | `accepted` | `done` | `deferred`.
- **ARCH / UX / TEST / FE / BE / OPS** — count of linked tickets per role, derived by grepping `parent_feat: FEAT-XXXX` across each role's `features/` directory. BA updates these counts when a peer notifies BA that a new role ticket has been filed, or on any wave-close sweep.

Note: Wave and US-NNN refs columns are dropped from the canonical table shape. Full context lives in the FEAT-XXXX file itself. Wave + US refs are findable via the FEAT file's frontmatter.

**AC5 — Relationship between US-NNN and FEAT-XXXX**

Option B is the canonical relationship: US-NNN files coexist with FEAT-XXXX documents. A FEAT-XXXX document is the feature parent that groups one or more US-NNN user stories as children. Existing US-NNN files are NOT retired or renamed; they carry a `parent-feat:` frontmatter field referencing their FEAT-XXXX parent when one is assigned. New features ALWAYS start with a FEAT document; the associated US-NNN stories link back to it.

Rationale: option A (retire US-NNN) loses story-level granularity and breaks traceability.md which links US-NNN → BR-NNN → test cells. Option C (retroactive migration) churns file history for no immediate functional gain. Option B preserves both layers: feature-level grouping for the viewer and story-level granularity for ACs and traceability.

**AC6 — QA test-type decision discipline**

QA selects test types for each FEAT-XXXX grouping based on the feature's requirements and ACs, NOT on how the developer implemented the feature. The test-type decision is QA's professional judgment. Test types available (non-exhaustive): unit, integration, smoke, regression, end-to-end (e2e), UI (visual regression), performance, security (static analysis + DAST). QA MUST document the rationale for type selection in a `TEST-PLAN.md` at the root of `tests/qa/features/FEAT-XXXX-<slug>/`.

The Wave 118 comprehensive-testing discipline (positive + negative + edge + all-known-samples) applies per test TYPE within the feature grouping — not just per story. If a feature has 3 unit tests and 2 smoke tests, each of those test categories must cover positive/negative/edge and iterate over all known sample inputs relevant to that test's ACs.

**AC7 — Reusable DevSecOps pipelines**

`ops/pipelines/<environment>.yml` templates are parameterized (e.g. via environment variables, shell function arguments, or YAML anchors). Each template covers one deployment environment (dev / staging / prod at minimum). Per-feature overlays at `ops/features/FEAT-XXXX-<slug>/pipeline.yml` MUST compose the env template using a clear composition mechanism (e.g. `source` / `include` / `.` invocation for shell scripts, `extends` or YAML anchors for YAML pipelines).

The user MUST be able to run both a pipeline template and a per-feature overlay from the command line without a CI system:

```bash
# Run the staging pipeline for FEAT-0001
bash ops/features/FEAT-0001-feat-grouping-convention/pipeline.yml staging

# Or equivalent invocation per the DevSecOps-chosen runner format
```

Execution by a human without CI tooling is a first-class use case — not a nice-to-have.

**AC8 — QA tests independently runnable per feature**

The user MUST be able to run tests for a single feature without running the full test suite:

```bash
# Run all tests for FEAT-0001
pnpm vitest run tests/qa/features/FEAT-0001-feat-grouping-convention/

# Or with pnpm script shorthand
pnpm run qa:feat FEAT-0001
```

`pnpm run qa:feat` (or equivalent script) is a first-class `package.json` script addition (DevSecOps + QA jointly own this script).

**AC9 — Viewer rendering (deferred — ship in US-099+)**

The apex-team-viewer MUST render per-role output tabs grouped by FEAT-XXXX card rather than as flat file lists. Each card displays:
- FEAT identifier and title
- Status badge
- Linked artifacts for the role (BA: feature doc; QA: test-type breakdown with counts; Architect: dir link; UX: design spec links; DevSecOps: pipeline links with run button)

The QA Output tab MUST show tests grouped by FEAT with test-type breakdown (unit / smoke / regression / e2e / etc. counts per FEAT).

This AC is explicitly deferred to implementation wave US-099+ (viewer rendering). The viewer implementation spans both `apex-team` (subagent body amendments) and `apex-team-viewer` (rendering code at `../apex-team-viewer/`). No viewer code changes ship in the US-098 wave.

**AC10 — `architecture/workspace-conventions.md` updated**

Architect adds a "FEAT-XXXX feature grouping (Wave 122)" section to `architecture/workspace-conventions.md` documenting AC3's directory layout + ticket-prefix table, the AC5 US-NNN coexistence rule, the AC6 QA test-type decision discipline, the AC11 mandatory frontmatter spec, and the AC12 autonomous-standard rule. This section becomes the canonical reference for all roles.

**AC11 — Mandatory deliverable frontmatter**

Every role deliverable file MUST include a frontmatter or header-comment block linking it back to its parent FEAT and US. The canonical format for Markdown files is:

```yaml
---
ticket: ARCH-0001
parent_feat: FEAT-0001
parent_us: US-098
role: architect
status: proposed | accepted | in-flight | done | superseded
---
```

For non-Markdown files (`.ts`, `.tsx`, `.java`, `.sh`, `.py`, etc.), the equivalent is a top-of-file header comment in the file's native comment syntax:

```
// ticket: BE-0001
// parent_feat: FEAT-0001
// parent_us: US-098
// role: backend-developer
// status: in-flight
```

Required fields:
- `ticket` — the role's own ticket identifier (e.g. `ARCH-0001`, `TEST-0002`). Prefix must match the role (see AC3 table).
- `parent_feat` — the BA's FEAT-XXXX this deliverable belongs to. Required on every non-BA deliverable.
- `parent_us` — the BA's US-NNN this deliverable was authored under (if applicable; omit if no US exists for the work unit).
- `role` — the role-id that authored the file (lowercase hyphenated, matching the `.claude/agents/<role-id>.md` filename stem). Valid values: `business-analyst`, `architect`, `ux-designer`, `qa`, `ui-developer`, `backend-developer`, `devsecops`.
- `status` — current lifecycle state. Valid values: `proposed`, `accepted`, `in-flight`, `done`, `superseded`.

The `parent_feat` field is the primary cross-link. It is what the viewer uses to group artifacts by FEAT card and what `grep parent_feat: FEAT-XXXX` uses to compute the count columns in `requirements/features/INDEX.md`.

BA's FEAT-XXXX files carry their own identity in the `feat:` frontmatter field (AC2) and do NOT carry a `parent_feat:` field (they ARE the parent).

**Per-role INDEX.md maintenance rule:** each role MUST maintain an allocation index at `<role-dir>/features/INDEX.md` (see AC3 table for paths). When a role creates a new ticket file, it MUST add a row to its own INDEX before finishing the wave. Row format:

```markdown
| Ticket | Parent FEAT | Parent US | Status | Description |
|---|---|---|---|---|
| ARCH-0001 | FEAT-0001 | US-098 | in-flight | workspace-conventions.md FEAT-XXXX section |
```

The BA's `requirements/features/INDEX.md` aggregates counts across all role INDEXes (count columns in AC4) — it does not replace them.

**AC12 — Autonomous role standard (applies in any workspace)**

Each role's subagent body (`.claude/agents/<role-id>.md`) carries a section with the EXACT heading:

```
### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)
```

This heading is the canonical grep anchor. QA regression tests grep for this exact string. The section MUST codify, role-specifically:

1. **Ticket prefix** — the role's own ticket prefix (exactly one of: `FEAT`, `ARCH`, `UX`, `TEST`, `FE`, `BE`, `OPS` — from the AC3 table). Stated explicitly, not as a reference.
2. **Directory layout** — the canonical artifact root for this role's per-feature files (from AC3), stated as a concrete path pattern, not a table reference.
3. **Frontmatter rule** — "every deliverable file MUST include `ticket:`, `parent_feat:`, `parent_us:` (if applicable), `role:`, and `status:` per AC11 of US-098". The rule is stated inline — not just a cross-reference — so the subagent carries it without needing to read US-098.
4. **INDEX maintenance rule** — "allocate ticket numbers monotonically; add a row to `<role-dir>/features/INDEX.md` before the wave closes".
5. **Cross-workspace applicability** — "This convention applies in ANY workspace, not just apex-team. When invoked on LFM, bidshop, or any downstream project, follow the same convention — create the per-feature directories in that project's directory structure and link deliverables to the BA's FEAT-XXXX allocation in that project."

Architect owns the implementation of this AC (amending all 8 subagent bodies). Each role body gets the section with its own role-specific content, not a generic template. The section heading must be byte-for-byte `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` for grep-stability across workspaces.

The autonomous-standard section is the mechanism that makes the convention self-propagating: a role subagent invoked fresh in a new workspace applies the convention without needing explicit instruction from the outer orchestrator or user. The Wave 121 viewer auto-follow means a single subagent body edit on apex-team propagates to every project using user-scope subagents.

**AC13 — Regression**

QA authors a Wave 122 regression test at `tests/qa/wave-122/feat-grouping-convention.test.ts` asserting:

1. All 8 subagent body files contain the exact anchor phrase `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)`.
2. Each subagent body's section contains the role-specific ticket prefix (e.g. `ARCH-XXXX` in `architect.md`, `TEST-XXXX` in `qa.md`, etc.) — confirming per-role specialization, not a copy-paste.
3. `requirements/features/FEAT-0001-feat-grouping-convention.md` exists with `feat: FEAT-0001` frontmatter.
4. `requirements/features/INDEX.md` exists and contains the canonical column headers (`FEAT | Slug | Status | ARCH | UX | TEST | FE | BE | OPS`).
5. All prior `pnpm test:run` tests pass (no regression).

---

## Out of scope

The following are explicitly deferred to follow-up waves. They must NOT be implemented in the US-098 wave:

- **Subagent body amendments** are now IN scope for Wave 122 (Architect's lane — Wave 122 amendment added AC12). Architect adds `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` to all 8 subagent bodies in the same wave as the workspace-conventions.md update.
- **Viewer rendering changes** (UI Dev + BE Dev, apex-team-viewer repo). Target wave: US-099 or a dedicated viewer wave.
- **DevSecOps pipeline scaffolding** (DevSecOps lane; generates `ops/pipelines/` templates and `ops/features/` overlays for FEAT-0001). Target wave: separate DevSecOps wave after Architect ratification.
- **Retroactive migration of existing US-NNN files** into FEAT groupings. Option B coexistence means this is not required. Individual projects (LFM etc.) may assign FEAT numbers retroactively to existing work at their own pace.
- **`pnpm run qa:feat` script** addition to `package.json`. Deferred to the DevSecOps + QA implementation wave.
- **`TEST-PLAN.md` for FEAT-0001** itself. FEAT-0001 is the convention-definition meta-feature; its tests are the regression tests written by QA in the implementation wave, not a separate test plan authored by BA.
- **LFM project FEAT assignments.** The LFM "Add PO to Order Sheet" feature is the motivating example (FEAT-0002 or whatever number is next in the LFM workspace's allocation). LFM runs as a separate workspace; its FEAT numbering is independent of apex-team's FEAT-0001.

---

## Open questions

None blocking ratification. The following have working assumptions that the Architect should confirm:

- **OQ-098-001:** Should `architecture/features/FEAT-XXXX-<slug>/` use a flat `README.md` or a structured template with required sections (NFR overlay, ADR-cross-refs, system-design notes)? Working assumption: a `README.md` with a defined template that Architect specifies. Architect's call — not a BA decision.
- **OQ-098-002:** For the `ops/pipelines/<environment>.yml` composition mechanism, should it be shell scripts (`.sh`) or YAML with anchors? Working assumption: shell scripts for maximum portability (no YAML pipeline engine required on the user's machine). DevSecOps's call.
- **OQ-098-003:** Does the apex-team-viewer's existing workspace-switcher (US-095 / Wave 119, `in-flight`) need to be aware of the FEAT-XXXX directory structure at `requirements/features/`, or will the viewer's FEAT rendering (AC9) build on US-095 as a prerequisite? Working assumption: US-095 is a prerequisite for the viewer rendering wave. UI Dev / BE Dev to confirm at implementation time.
