# Requirements Index

_Auto-maintained by Business Analyst. Last updated: 2026-05-31._

| File | Summary | Last Modified |
|------|---------|---------------|
| [scope.md](scope.md) | What's in / out / deferred + constraints (8 roles, MCP, phased workflow, single-user) | 2026-05-31 |
| [glossary.md](glossary.md) | 22 domain terms: AC, ADR, DISPATCH, FAIL, gate, HANDOFF, instance, NOTES, PASS, protocol, REVISE, skill, spec, story, turn, wave, worktree, workspace, and more | 2026-05-31 |
| [open-questions.md](open-questions.md) | OQ-001 RESOLVED (worktrees, Wave 9c); OQ-002 RESOLVED (GitHub Actions + Dependabot + gitleaks, Wave 10); OQ-003 open — manual repo override (blocking US-003 AC5); OQ-004 open — caching strategy for git remote lookup (blocking US-003 BE scope); OQ-005 open — SSE heartbeat (non-blocking, future) | 2026-05-31 |
| [user-stories/_TEMPLATE.md](user-stories/_TEMPLATE.md) | Story template — copy this to create a new US-NNN file | 2026-05-31 |
| [user-stories/US-001-multi-phase-workflow-foundation.md](user-stories/US-001-multi-phase-workflow-foundation.md) | US-001: mandatory phased workflow — status in-dev; impl 2a81587 + 5802292 + 3d2a933 (worktrees) | 2026-05-31 |
| [user-stories/US-002-devsecops-pipeline-ownership.md](user-stories/US-002-devsecops-pipeline-ownership.md) | US-002: DevSecOps owns all pipeline/IaC/DevSecOps tasks — status done; shipped Wave 10b-d (88fd8d1 + 93015c7), merged 6eaab70 | 2026-05-31 |
| [user-stories/US-003-workspace-scoped-issues.md](user-stories/US-003-workspace-scoped-issues.md) | US-003: Issues panel shows issues from active workspace's GitHub repo, not hardcoded apex-team — status proposed; 5 ACs; OQ-003 + OQ-004 open | 2026-05-31 |
| [user-stories/US-004-mcp-transport-reliability.md](user-stories/US-004-mcp-transport-reliability.md) | US-004: MCP transport survives long agent turns without dropping — status proposed; 4 ACs; fixes #31; OQ-005 open (heartbeat, non-blocking) | 2026-05-31 |
| [user-stories/US-005-wave-11c-carry-forwards.md](user-stories/US-005-wave-11c-carry-forwards.md) | US-005: Issues panel polish — drop attribution prefix, per-repoStatus copy, :visited style fix, no stale-attribution flicker — status proposed; 4 ACs; owner UI Dev + BE Dev | 2026-05-31 |
| [user-stories/US-006-main-branch-enforcement.md](user-stories/US-006-main-branch-enforcement.md) | US-006: Main-branch enforcement for apex-team — GitHub branch protection + local pre-commit/pre-push hooks + CODEOWNERS advisory — status proposed; 6 ACs; owner DevSecOps | 2026-05-31 |
| [user-stories/US-007-portable-workspace-bootstrap.md](user-stories/US-007-portable-workspace-bootstrap.md) | US-007: Portable workflow bootstrap for external workspaces — single command installs hooks + CI stub + branch protection on any git repo — status proposed; 5 ACs; owner DevSecOps; depends on US-006 | 2026-05-31 |
| [user-stories/US-008-team-page-density.md](user-stories/US-008-team-page-density.md) | US-008: Team page density redesign — 4 surgical CSS/constant fixes: HANDOFF body max-height, messages area clamp, tighter bubble threshold, outbound bubbles collapsed by default — status proposed; 6 ACs; owner UI Dev | 2026-05-31 |
