---
id: US-046
title: DevSecOps conflict-resolution playbook for union-merge files (Wave 92)
status: in-dev
wave: 92
closes: "#230"
owner: DevSecOps
created: 2026-06-02
accepted: 2026-06-02
---

## Story

As the team, I want a documented playbook in the DevSecOps skill for resolving CONFLICTING PRs that touch union-merge coordination files (HANDOFF.md, LESSONS.md, etc.), so that any role can recover a CONFLICTING branch without accidentally bypassing the `merge=union` driver or clobbering concurrent pushes.

## Background

ADR-013 (PR #209) established the `.gitattributes` union-merge driver for HANDOFF.md and LESSONS.md. The driver fires only on LOCAL rebase — GitHub's "Update branch" button bypasses it, leaving PRs CONFLICTING. Without a canonical playbook, roles either force-resolved incorrectly or blocked indefinitely on CONFLICTING branches.

## Acceptance criteria

1. `src/lib/skills/devsecops.ts` contains a `### Conflict resolution playbook — union-merge files` section documenting: (a) the invariant that the union driver fires on local rebase only, (b) the full worktree-based resolution procedure, (c) `--force-with-lease` discipline to prevent concurrent-push clobbering.

2. The playbook covers HANDOFF.md, LESSONS.md, and any other files listed under `merge=union` in `.gitattributes`.

3. Procedure is sufficient for any team role to recover a CONFLICTING branch to MERGEABLE without escalation.

## Out of scope

- Automating the conflict-resolution procedure via CI.
- Fixing the root cause (GitHub bypassing the driver) — that is a platform limitation.
- Adding union-merge entries for files beyond what ADR-013 covers (separate wave).

## Implementation

- impl: `dfd3ea7` (`feat(devsecops): add conflict-resolution playbook for union-merge files`)
- PR: #230 (`feature/92-devsecops-playbook`, CONFLICTING — rebase onto main in progress as of Wave 97)

## Notes

- US-047 (Wave 93) builds on this: the fragment pattern eliminates new HANDOFF.md collision classes so the playbook is invoked less frequently.
- The Wave 93 section (`### HANDOFF state updates — fragment pattern`) must also appear in `devsecops.ts` alongside this playbook; the rebase resolution in Wave 97 handles both sections.
