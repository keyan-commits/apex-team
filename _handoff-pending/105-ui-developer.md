## Done
- Wave 105 US-062: added `@media (prefers-reduced-motion: reduce)` guards to both `AgentPane.tsx` pill animation blocks (expanded + folded panes) and `MessageBubble.tsx` pending-dot. Closes #276 + #277.
- Defective `.pane { transition:none }` guard replaced with correct pill-selector guard.
- `rm-pending-dot-pulse` keyframes (0.6–1 opacity, 1.5s) added so the dot pulses gently instead of freezing at near-invisible 0.3.
- type-check 0, 433/433 tests pass.

## In flight
- PR open; waiting on UX design-correctness gate, then Architect code gate.

## Next
- After both gates PASS: HANDOFF DevSecOps for merge.

## Notes
- Branch: `feature/105-us062-reduced-motion-guards`
- NFR-MOTION-002 co-location rule satisfied in both files.
