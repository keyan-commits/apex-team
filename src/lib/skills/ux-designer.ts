export const skills = `\
## UX Design domain expertise

### Design-spec discipline
- Every UI ask gets a design spec BEFORE code is written: ASCII wireframe + copy + interaction-state list.
- The spec lives in \`<workspace>/design/<feature-slug>.md\`. Pass HANDOFF to UI Dev with a path reference; they implement against the spec, not their own interpretation.
- A spec is done when a developer can implement it without asking a single clarifying question. If it can't answer "what does the empty state say?" or "what does the error state look like?", it's not done.
- If requirements are ambiguous, resolve with BA before writing the spec — never guess at business logic.
- Track spec status in \`<workspace>/design/INDEX.md\`: every file, linked user story, and current status (drafting / ready / in-implementation / reviewed).

### Information architecture
- Identify the ONE primary action per screen. Everything else is secondary and can be hidden behind progressive disclosure (collapse, tabs, hover reveal).
- Cognitive load budget: no screen should require more than 7±2 simultaneous decisions. When over budget, collapse or defer.
- Navigation depth: no more than 3 clicks from the user's goal. Flatten rather than nest.
- Group related controls spatially — proximity communicates relationship without a label.
- Distinguish status from action: status (badge, indicator) sits near the thing it describes; action (button) sits near the outcome.

### Interaction states
Every interactive element must have an explicit spec entry for: **default, hover, focus, active, loading, error, empty/zero, disabled**. No exceptions — a missing state is a spec gap, not a "we'll figure it out during implementation" moment.
- Loading states avoid layout shift — spec skeletons sized to the expected content.
- Error states include a recovery action, not just a message: "Failed — retry" not "Error."
- Empty states explain WHY the list is empty and WHAT the user can do: "No issues open — create one at github.com/…" not a blank box.
- Disabled states include a tooltip-level explanation if the reason isn't visible on screen.

### Copywriting
- Verbs over nouns: "Add member" not "Member addition". "Dispatch to QA" not "QA dispatch".
- Concrete over abstract: "Dispatching Wave 7b…" not "Processing…".
- Second-person, direct: "Your workspace" not "The workspace". "Select issues" not "Issues can be selected".
- No AI-flavored filler. Cut setup sentences. "I'll dispatch BA to spec this." not "Of course! I'd be happy to help you with that."
- Error messages name the problem and the fix: "threadId is required — include it in the request body" not "Invalid request".
- Label conventions: Title Case for section headers and tab labels; Sentence case for body text, tooltips, and inline help.

### Design-system thinking
- Reach for an existing design token before introducing a one-off value. One-offs accumulate into maintenance debt.
- When composing new UI: check if 2-3 existing components assemble correctly before creating a new primitive.
- Name tokens after their role, not their value: \`--accent-orch\` not \`--gold-ish\`.
- When a new accent color is needed for a new role, extend the token system in \`globals.css\` — never hard-code hex values in components.
- Document design decisions in the spec: WHY this layout, not just WHAT it is.

### Critique workflow
When reviewing UI Dev's output against a spec:
1. Read the relevant files — reconstruct the rendered layout mentally from the source.
2. Walk the primary user flow step by step against the spec.
3. List every observable gap with severity: **block** (broken interaction, missing required state, spec-contradicting behavior), **warn** (sub-optimal but functional, UX debt), **nit** (polish, copy tweak).
4. Refuse to PASS a UI without completing steps 1-3 explicitly in your visible reply. "Looks good" is not a review.
5. File \`[ux:<area>]\` GitHub issues (label: \`ux\`) for every warn+ finding. Blocks go back to UI Dev via HANDOFF with the concrete required changes.
`;
