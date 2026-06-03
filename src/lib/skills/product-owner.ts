export interface GithubIssue {
  number: number;
  title: string;
  labels: Array<{ name: string }>;
  createdAt: string;
}

const PRIORITY_RANK: Record<string, number> = {
  blocker: 0,
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

const TYPE_RANK: Record<string, number> = {
  bug: 0,
  enhancement: 1,
  "self-improvement": 2,
  "skill-proposal": 3,
  "mcp-proposal": 4,
};

function labelRank(
  map: Record<string, number>,
  labels: Array<{ name: string }>
): number {
  const ranks = labels.map((l) => map[l.name]).filter((r) => r !== undefined);
  return ranks.length > 0 ? Math.min(...ranks) : 5;
}

export function rankIssues(issues: GithubIssue[]): GithubIssue[] {
  const now = Date.now();
  return [...issues].sort((a, b) => {
    const prA = labelRank(PRIORITY_RANK, a.labels);
    const prB = labelRank(PRIORITY_RANK, b.labels);
    if (prA !== prB) return prA - prB;

    const trA = labelRank(TYPE_RANK, a.labels);
    const trB = labelRank(TYPE_RANK, b.labels);
    if (trA !== trB) return trA - trB;

    const ageA = now - new Date(a.createdAt).getTime();
    const ageB = now - new Date(b.createdAt).getTime();
    // older issue = larger ageMs = higher priority = sort first
    if (ageA !== ageB) return ageB - ageA;

    return a.number - b.number;
  });
}

import { USER_DIRECTIVE_SKILL } from "./_shared/user-directive-supremacy";

export const skills = `\
${USER_DIRECTIVE_SKILL}

## Auto-start next wave when team is clear

Every PO turn — including AUTO-CONTINUE ticks — MUST run this precedence check before anything else:

1. **Open PRs?** → drive their gates (Architect / UX / QA as appropriate). Do not start a new wave.
2. **Peer inboxes > 0?** → drain them: dispatch the relevant peer(s) to process their inbox. Do not start a new wave.
3. **Requirements triad in flight?** → wait for it. Pre-stage Lane A N+1 if not already staged.
4. **None of the above AND backlog > 0?** → **MUST auto-start the next-priority backlog issue**: run \`gh issue list --repo keyan-commits/apex-team --state open --limit 50 --json number,title,labels,createdAt\`, pick the top issue by the deterministic \`rankIssues\` sort key (priorityRank → typeRank → ageMs → issueNumber, ascending), fire the mandatory parallel triad (DISPATCH \`architect\` + \`ux-designer\` + \`business-analyst\`) for that issue AND pre-stage the N+1 issue in the same turn, then update NOTES. **Acknowledging quiet state without auto-starting is a workflow failure.**
5. **Backlog genuinely empty AND no in-flight work?** → execute one fallback from the catalog (never "just wait"):
   - Self-scout: propose a prompt-improvement issue against apex-team (\`gh issue create\`).
   - Retrospective: summarise recently completed waves and file a lessons-learned issue.
   - Housekeeping: trigger a HANDOFF compaction pass for oversized peer docs (per US-017).
   - Dependency audit: check for outdated or vulnerable packages.
   - Token-spend review: inspect top-spending roles and propose compaction or model-tier adjustments.
   Skip any fallback whose underlying event is < 24 h old (e.g. a retrospective filed less than 24 h ago).

**Wave 68 pipeline parallelism is mandatory on auto-start:** when you fire the triad for Wave N, also include in the same reply a pre-stage DISPATCH to Architect + BA + UX for the next-priority Wave N+1 issue. Single-wave dispatch without N+1 pre-staging is a Lane A stall and is not permitted.

### Include last 5 user messages in every requirements-triad dispatch (AC4 of #321)

When running the mandatory requirements triad, include the last N (default 5) user messages verbatim as a **"User-directive context"** block in every DISPATCH to BA, Architect, and UX Designer. Format:

\`\`\`
User-directive context (last 5 user messages — read these before drafting; the most recent wins):
1. [msg text]
2. [msg text]
…
\`\`\`

This ensures every triad member sees the actual user-stated constraints, not just the original ticket text. A requirements-triad DISPATCH without this block is incomplete when the thread has ≥1 user message after the first.
`;
