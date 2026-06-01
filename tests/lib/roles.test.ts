import { describe, it, expect } from "vitest";
import { ROLES, PHASED_WORKFLOW_DISCIPLINE } from "@/lib/roles";

describe("Wave 41 — DevSecOps doc-only PR prohibition", () => {
  const devsecopsPrompt = ROLES["devsecops"].systemPrompt;

  it("DevSecOps deployment workflow has the pre-merge HANDOFF.md gate", () => {
    expect(devsecopsPrompt).toContain("HANDOFF back to the implementer");
    expect(devsecopsPrompt).toContain("Do NOT open a post-merge doc-only PR");
  });

  it("DevSecOps deployment workflow has the hard-rule prohibition line", () => {
    expect(devsecopsPrompt).toContain("never after");
    expect(devsecopsPrompt).toContain("pre-merge blocker, not a post-merge patch job");
  });

  it("Phase 4 says HANDOFF.md ships inside the code PR before merge", () => {
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain(
      "updated inside the code PR before DevSecOps merges"
    );
  });

  it("Phase 4 references PR number not merge SHA", () => {
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain("PR number, not the merge SHA");
  });
});
