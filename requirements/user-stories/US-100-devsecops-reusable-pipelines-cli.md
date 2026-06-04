---
ticket: US-100
parent_feat: FEAT-0003
role: business-analyst
status: accepted
---

# US-100 — DevSecOps Reusable Pipelines + CLI Runner

**Status:** accepted
**Wave:** 124
**FEAT:** FEAT-0003
**Triggered by:** User directive (Wave 122 follow-up) — "The DevSecOps output folder should show the CI/CD pipelines for all applicable environments, it should be reusable. I should be able to run both the DevSecOps pipeline and QA tests on my own if I wanted to."

---

## Story

As a user working on any project that uses apex-team's subagents,
I want reusable DevSecOps pipeline templates per environment (dev/staging/prod), per-feature overlays, AND CLI runners to invoke DevSecOps pipelines and QA tests locally without going through Claude Code,
so that I can iterate on pipelines and tests independently of agent dispatch.

---

## Acceptance criteria

### AC1 — `ops/pipelines/<env>.sh` reusable environment templates

At minimum three template files are created:
- `ops/pipelines/dev.sh`
- `ops/pipelines/staging.sh`
- `ops/pipelines/prod.sh`

Each template:
- Is a valid POSIX shell script (`#!/bin/sh` shebang).
- Accepts a single positional argument `$1` = `FEAT-XXXX` identifier (may be empty — script runs base steps only if omitted).
- Defines an ordered sequence of base pipeline steps specific to the environment tier (e.g. dev: lint + test; staging: lint + test + build + deploy-preview; prod: all stages + approval gate comment).
- Sources the feature overlay file if present: `[ -f "ops/features/${FEAT}/${FEAT}-overlay.sh" ] && . "ops/features/${FEAT}/${FEAT}-overlay.sh"`. Skips cleanly (no error) if the overlay is absent.
- Exits non-zero (`exit 1`) on any step failure. No silent swallowing of step errors.
- Is marked executable (`chmod +x`).

### AC2 — Per-feature overlay shape

Feature-scoped pipeline customisation lives at:
```
ops/features/FEAT-XXXX-<slug>/OPS-NNNN-<slug>.sh
```

Per the Wave 122 per-role directory convention (FEAT-0001 AC3). Mandatory frontmatter:
```yaml
---
ticket: OPS-NNNN
parent_feat: FEAT-XXXX
parent_us: US-NNN
role: devsecops
status: proposed | accepted | in-flight | done
---
```

The pipeline template `source`s (`.`) the overlay file after the base steps complete. The overlay can override variables, add steps, or skip steps via guard flags. If the overlay file is absent, the template proceeds with base steps only — no error.

### AC3 — CLI runners in `package.json`

Two npm scripts are added to the root `package.json`:

```json
{
  "scripts": {
    "ops:run": "sh ops/pipelines/$npm_config_env.sh $npm_config_feat",
    "qa:feat": "pnpm vitest run tests/qa/features/$npm_config_feat-*/"
  }
}
```

Or equivalent using a wrapper script if `$npm_config_*` is insufficient for the shell. Invocation documented in `ops/README.md`:

```sh
pnpm run ops:run --env=dev --feat=FEAT-0001
pnpm run qa:feat --feat=FEAT-0001
```

The user must be able to run these from the workspace root without any Claude Code involvement.

### AC4 — Independent execution documented in `ops/README.md`

`ops/README.md` (new file or rewrite of existing) documents:

1. How to invoke each env pipeline directly: `sh ops/pipelines/dev.sh FEAT-0001`
2. How to invoke via pnpm runners: `pnpm run ops:run --env=dev --feat=FEAT-0001`
3. How to run QA tests for a feature: `pnpm run qa:feat --feat=FEAT-0001` or `pnpm vitest run tests/qa/features/FEAT-0001-*/`
4. How to create a feature overlay: copy the shape from `ops/pipelines/_template.sh`, place at `ops/features/FEAT-XXXX-<slug>/OPS-0001-<slug>.sh`, fill in the frontmatter.
5. A note clarifying that scaffolding ≠ pipeline-on-day-one (see AC8).

### AC5 — `ops/pipelines/_template.sh` bootstrap skeleton

`ops/pipelines/_template.sh` is a copy-paste skeleton for new environments:

```sh
#!/bin/sh
# Template: ops/pipelines/_template.sh
# Copy this file to ops/pipelines/<env>.sh and customize.
#
# Usage: sh ops/pipelines/<env>.sh [FEAT-XXXX]
FEAT="${1:-}"

# --- Base steps (customize per environment) ---
# step_lint() { ... }
# step_test() { ... }
# step_build() { ... }

# --- Feature overlay (do not remove) ---
if [ -n "$FEAT" ] && [ -f "ops/features/${FEAT}/${FEAT}-overlay.sh" ]; then
  . "ops/features/${FEAT}/${FEAT}-overlay.sh"
fi

echo "Pipeline complete for env=$(basename $0 .sh) feat=${FEAT:-none}"
```

It is NOT executable (no `chmod +x`) to signal it is a template, not an executable pipeline.

### AC6 — DevSecOps subagent body section for pipeline authoring standard

`.claude/agents/devsecops.md` gains a section with the heading:

```
### ops/pipelines standard (Wave 124 — MANDATORY)
```

This section states (verbatim-greppable anchor required):
- When adding a new environment pipeline: copy `ops/pipelines/_template.sh`, name it `<env>.sh`, mark executable, parameterize for `$1 = FEAT-XXXX`.
- When adding a feature overlay: create `ops/features/FEAT-XXXX-<slug>/OPS-NNNN-<slug>.sh` with the mandatory frontmatter block.
- Per-feature overlays use role prefix `OPS-NNNN`; numbers allocated monotonically per feature.
- This convention applies in ANY workspace, not just apex-team.

### AC7 — Regression test under `tests/qa/features/FEAT-0003-devsecops-pipelines/`

QA must author tests at `tests/qa/features/FEAT-0003-devsecops-pipelines/TEST-NNNN-*.test.ts`. Per Wave 118 comprehensive-coverage discipline, tests must cover:

- **Template existence**: `ops/pipelines/dev.sh`, `ops/pipelines/staging.sh`, `ops/pipelines/prod.sh`, and `ops/pipelines/_template.sh` all exist on disk.
- **Executability**: `dev.sh`, `staging.sh`, `prod.sh` are executable (`fs.statSync().mode` check); `_template.sh` is NOT executable.
- **Shebang correctness**: each env template starts with `#!/bin/sh` (first line).
- **Syntax validity**: `sh -n ops/pipelines/<env>.sh` exits 0 (no syntax errors) for each of the 3 env templates.
- **CLI runners exist**: `package.json` contains `ops:run` and `qa:feat` scripts.
- **ops/README.md existence**: file exists and contains documentation strings for both runners (assert presence of key phrases: `pnpm run ops:run`, `pnpm run qa:feat`).
- **Overlay skip**: running a template with no overlay file present exits 0 (not 1) — base-steps-only path.

All existing `pnpm test:run` tests remain green after this wave ships.

### AC8 — Scaffolding ≠ pipeline-on-day-one

The templates are scaffolding: placeholder step comments, not real CI vendor commands. Existing features (FEAT-0001 Grouping Convention, FEAT-0002 Viewer Rendering) do NOT need real pipeline overlays until there is something to deploy. Document this explicitly in `ops/README.md` under a "Scaffolding vs live pipeline" section.

When a project needs real pipelines (cloud deploy, artifact publish, etc.), DevSecOps authors feature overlays at that time. The templates provide the skeleton; the overlays provide the substance.

---

## Out of scope

- Specific cloud or CI vendor wiring (GitHub Actions YAML, GitLab CI, AWS Pipelines). The templates are bash-based and portable. If a project needs GitHub Actions integration, that is a per-feature overlay authored when the deployment target is known.
- Wave 123's viewer rendering hook for pipelines — US-099 AC9 owns the viewer surface; this story owns the data the viewer reads.
- Automated CI triggering of `ops/pipelines/*.sh` from GitHub Actions. The scripts can be called from CI steps, but wiring that is a separate wave.

---

## HANDOFF routing (Wave 124 auto-routing)

- **DevSecOps** — owns `ops/pipelines/*.sh` template scaffolding (AC1, AC5), per-feature overlay shape docs (AC2), `package.json` CLI runners (AC3), `ops/README.md` (AC4), and `.claude/agents/devsecops.md` body section (AC6).
- **QA** — authors regression tests under `tests/qa/features/FEAT-0003-devsecops-pipelines/TEST-NNNN-*.test.ts` (AC7). Can run in parallel with DevSecOps.

---

## Traceability

- **Parent FEAT:** FEAT-0003 — DevSecOps Reusable Pipelines (see `requirements/features/FEAT-0003-devsecops-reusable-pipelines.md`)
- **Spawned from:** US-098 AC7 + AC8 (deferred DevSecOps pipelines and CLI runner)
- **Peer:** US-099 (Viewer rendering — its AC9 renders `ops/pipelines/` in the DevSecOps Output tab)
- **Wave:** 124
- **Main SHA at authoring:** a4ce3c752aa3cd75d25030ca47ec964038aee8a3
