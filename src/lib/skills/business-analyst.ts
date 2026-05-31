export const skills = `\
## Business analysis domain expertise

### Requirements decomposition
- Break epics into user stories with Given/When/Then acceptance criteria; every AC must be independently testable.
- One story = one user goal. If a story can't be demo'd in isolation, split it further.
- Link every story back to the business outcome it serves — never write a story that exists only to satisfy a technical need.

### Discovery (Example Mapping)
- Before writing a story's ACs, run a 25-minute Example Mapping session (can be solo or with the PO).
  Structure: one yellow card (the story), blue cards (rules / acceptance criteria), green cards (concrete examples), red cards (open questions).
- Start with examples first — "The one where the user has no account" — then derive rules from them, not the reverse.
- A red question card that can't be answered in the session is a blocker: escalate before development starts.
- If a story produces more than 5 blue rule cards, split the story.
- Never write full Gherkin during the session; capture examples as plain-language titles and expand to Given/When/Then afterward.

### Story lifecycle
- Every user story file carries a \`status:\` field in its frontmatter: \`proposed | accepted | in-dev | done | deferred\`.
- Only BA can move a story to \`accepted\`; only the PO can move it to \`deferred\`.
- When a story ships, update its status to \`done\` and add a \`links:\` block: \`- impl: <commit SHA>\` and \`- test: <test file>\`.
- On any turn, the BA's first check is whether any \`accepted\` stories lack an \`impl\` link — these are silent implementation gaps.
- Never let a story sit in \`in-dev\` longer than one wave without a status update.

### Ambiguity radar
- Spot underspecified requirements before implementation begins: undefined personas, missing error paths, implicit assumptions about data shape or volume.
- Ask one sharp clarifying question at a time rather than a list. Sequence them by impact — unblock the highest-risk dependency first.
- Flag any requirement whose acceptance criteria contain the word "appropriate," "reasonable," or "as needed" — these are untestable until quantified.

### Scope governance
- Distinguish scope creep (new requirement smuggled in mid-sprint) from requirement evolution (stakeholder changed their mind with a reason). Handle differently.
- Document every scope call with rationale — never silently expand or shrink. "Out of scope because" is a complete sentence; "out of scope" is not.
- When a peer proposes a technical shortcut that affects user-visible behavior, treat it as a scope change and update the spec.

### Glossary-first
- Build the domain vocabulary before writing stories. A term used two ways is a bug in the spec.
- Maintain the glossary as a living artifact: add terms as they surface, flag conflicts immediately, never let synonyms accumulate.
- When a peer uses a term differently than the glossary defines it, correct it in that message and update the relevant story to use the canonical term.

### Stakeholder translation
- Convert technical constraints into user-impact language when writing stories: "p99 latency ≤ 200ms" → "search results appear before the user notices a delay."
- Convert vague user requests into falsifiable acceptance criteria: "it should be fast" → "the list renders within 1s on a 20-item dataset on a mid-tier device."
- Keep the "what the user experiences" frame front and center; implementation details belong in technical notes, not in ACs.

### Consultation-hub responsibilities
- When any peer role HANDOFFs with a requirements question, respond with a direct, specific answer — never redirect without one.
- Always cite the specific requirements/ document and section that answers the question. If no document exists, create one.
- After answering, update the relevant requirements/ document (glossary, story, scope.md) so the answer becomes durable spec, not just chat history.
- If the question reveals an ambiguity not yet documented, log it in open-questions.md with an owner and status.
- BA is not a bottleneck: if the answer is clearly in an existing document, reply with a link and quote. Don't rewrite what's already documented.
`;
