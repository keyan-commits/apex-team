## Done
- US-062: added `@media (prefers-reduced-motion: reduce)` guards to both `AgentPane.tsx` pill animation blocks (expanded + folded panes) and `MessageBubble.tsx` pending-dot. Defective `.pane { transition:none }` guard replaced with correct pill-selector guard. `rm-pending-dot-pulse` keyframes (0.6–1 opacity, 1.5s) added. PR #284 merged. Closes #276 + #277.
- US-063: removed dead `.stall-drawer` slide-in transition (`transform: translateX(100%)` + `transition: transform 250ms ease-in-out`). Conditional render (US-060) means the element always mounts with `.open` — the transition was inert. No RM guard needed. Closes #281 + #282.
- Both: type-check 0, 433/433 tests passing. All gates (Architect + UX + QA) PASS.

## In flight
- US-063 PR #285 re-updated onto main HEAD `e8ae6c2` post-#284 merge. Awaiting both concurrent build jobs verification.

## Next
- After #285 build jobs both SUCCESS → merge #285 → restart server → verify health.

## Notes
- #284 merge SHA: `e8ae6c2`
- US-063 leaves `.stall-drawer.open { transform: translateX(0) }` as explicit final-state anchor.
- Design specs: `design/US-062-reduced-motion-guard-remediation.md`, `design/US-064-mcp-rebind-banner.md` (AC4 path).
