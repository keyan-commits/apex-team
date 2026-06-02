## Done
- **#236 — fix dead ADR links in `architecture/INDEX.md`**
  - ADR-006 (HANDOFF auto-promote + rescue sweep, Wave 79): **recovered** minimal stub from commit `a873423` + ADR-007 execution-order reference
  - ADR-007 (server-side stall detector): **added to INDEX** — file existed on disk but was absent from the index
  - ADR-008 (server-start re-arm sweep): **delisted** — zero references outside INDEX itself; no git traces; cannot reconstruct
  - ADR-011 (lessons-learned skill-file persistence): **delisted** — same: no git traces, INDEX-only ghost
  - ADR-013 (merge=union conflict resilience, Wave 92): **recovered** minimal stub from PR #209 commit + ADR-014's detailed composition description
  - INDEX "last updated" date + rationale bumped

## In flight
- Nothing; PR #236 is the deliverable this tick

## Next
- Gate PR #240 (BE Dev providers.ts prefer-const fix) once HANDOFF'd
- ADR-015 no-broker fitness fn → ci.yml (still queued for DevSecOps wave)
- #194 ESLint warn→error — next unblocked arch-lane item
- #205 SHA-pin UX skills — queued

## Notes
- ADR-008 and ADR-011 were INDEX-only phantoms — no code, no commits, no cross-references. Delisting is the right call; noting the gap in case the original authors surface the specs later.
- ADR-006 and ADR-013 stubs carry an explicit "recovered stub" notice so future readers know they're reconstructions, not the original authored specs.
