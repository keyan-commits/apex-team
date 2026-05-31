export const REQUIREMENTS_PHASE_PROTOCOL = `
Requirements phase (mandatory for any new feature or significant change):
- PO dispatches Architect + UX Designer + BA in parallel with the user's ask before dispatching any implementer.
- BA writes (or updates) a user story in <workspace>/requirements/user-stories/US-XXX-<slug>.md with acceptance criteria.
- Architect gives feasibility + NFR input; UX Designer reviews design approach and produces an initial spec outline.
- PO waits for all three to return before scoping the implementation wave.
- No UI Dev / BE Dev dispatch until a BA-written requirement doc exists and is referenced in the dispatch.
`.trim();

export const IMPLEMENTATION_PHASE_PROTOCOL = `
Implementation phase (after requirements are documented):
- UI Dev and BE Dev each work on a feature branch from main: feature/<wave>-<short>.
- Each runs their own isolated dev instance: pnpm dev:test:ui (port 3110, DB data/test-ui.db) or pnpm dev:test:be (port 3120, DB data/test-be.db).
- Each writes unit tests in tests/ui/ or tests/be/ covering their acceptance criteria.
- Each runs pnpm test:run locally; all tests must pass before HANDOFF to QA.
- Never HANDOFF to QA on code that hasn't been locally unit-tested.
`.trim();

export const VERIFICATION_PHASE_PROTOCOL = `
Verification phase (after implementation):
- If the change touches UI: UX Designer reviews the implementation against <workspace>/design/<slug>.md FIRST. Returns PASS or REVISE with concrete deltas. Only after UX PASS does QA proceed.
- QA exercises the change on the :3100 test instance (pnpm dev:test, DB data/apex-team-test.db).
- QA verifies against BA's acceptance criteria (from <workspace>/requirements/user-stories/) AND the UX spec (for UI changes).
- QA returns PASS with evidence (test output / Playwright snapshot) or FAIL with repro steps.
- Never return PASS without actually exercising the change on :3100.
`.trim();

export const DEPLOYMENT_PHASE_PROTOCOL = `
Deployment phase (after QA PASS and UX PASS if UI):
- DevSecOps is the SOLE agent authorized to merge feature branches to main and push to origin/main.
- Implementers (UI Dev, BE Dev) do NOT push directly. They commit to their feature branch and HANDOFF to DevSecOps with QA PASS + UX PASS (if UI) evidence.
- DevSecOps merges the feature branch, pushes to origin/main, and deploys to the user-facing instance (pnpm dev, port 3000).
- HANDOFF.md refresh travels INSIDE the same PR as the code change — never as a separate doc-only follow-up PR. The implementer updates HANDOFF on their feature branch before pushing; the SHA-backfill chore commit pattern is retired.
- All commits — including doc-only HANDOFF / README / requirements / design markdown — go through the same feature-branch + PR pipeline. The pre-push hook blocks direct main pushes; do not use --no-verify to bypass it without explicit per-incident user authorization.
`.trim();

export const CONSULTATION_PROTOCOL = `
Consultation protocol (any phase):
- Any role may HANDOFF to BA at any time for requirements clarification or to surface a new functional question.
- BA's <workspace>/requirements/ directory is the authoritative source of truth for what the product does.
- Never guess at functional intent — consult BA instead.
- If BA cannot answer (external stakeholder, deferred decision), BA opens-questions.md captures it and routes to the user via PO.
`.trim();

export const SKILLS_SELF_ENRICHMENT_PROTOCOL = `
Skills self-enrichment protocol:
- If you identify a missing skill or MCP tool that would materially improve your output quality, file a GitHub issue on keyan-commits/apex-team with label skill-proposal (for skills) or mcp-proposal (for MCP tools).
- Title format: [skill:<role-id>] Short description or [mcp:<role-id>] Short description.
- Body: current gap / proposed addition / why it matters / source URL if applicable.
- You may also search mcpmarket.com or the Anthropic skill marketplace for ready-made solutions before proposing a custom one.
- Don't block your current turn waiting for the skill — file the issue and continue with what you have.
`.trim();
