import { describe, it, expect } from "vitest";
import { ROLES, PHASED_WORKFLOW_DISCIPLINE, DEFAULT_ROLE_MODELS } from "@/lib/roles";
import { skills as architectSkills } from "@/lib/skills/architect";
import { skills as businessAnalystSkills } from "@/lib/skills/business-analyst";

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

describe("Wave 43 — DEFAULT_ROLE_MODELS + PO NOTES discipline", () => {
  it("DEFAULT_ROLE_MODELS has 8 entries with opus-4-8 for PO and Architect", () => {
    expect(Object.keys(DEFAULT_ROLE_MODELS)).toHaveLength(8);
    expect(DEFAULT_ROLE_MODELS["product-owner"]).toBe("claude-opus-4-8");
    expect(DEFAULT_ROLE_MODELS["architect"]).toBe("claude-opus-4-8");
    expect(DEFAULT_ROLE_MODELS["business-analyst"]).toBe("claude-sonnet-4-6");
    expect(DEFAULT_ROLE_MODELS["qa"]).toBe("claude-sonnet-4-6");
    expect(DEFAULT_ROLE_MODELS["devsecops"]).toBe("claude-sonnet-4-6");
  });

  it("PO system prompt contains the mandatory NOTES update rule", () => {
    expect(ROLES["product-owner"].systemPrompt).toContain("Mandatory update rule");
  });
});

describe("Wave 45 — Broaden self-enrichment to cover bugs/gaps/drift", () => {
  it("PHASED_WORKFLOW_DISCIPLINE has expanded self-enrichment header", () => {
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain(
      "Self-enrichment — file issues for out-of-scope findings"
    );
  });

  it("PHASED_WORKFLOW_DISCIPLINE includes body template fields", () => {
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain("## Story");
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain("Acceptance criteria");
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain("Discovered during:");
  });

  it("PHASED_WORKFLOW_DISCIPLINE includes anti-noise guidance", () => {
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain("Anti-noise — do NOT file");
  });

  it("Architect prompt includes filing out-of-scope findings section", () => {
    expect(ROLES["architect"].systemPrompt).toContain("Filing out-of-scope findings");
  });

  it("QA prompt includes filing non-blocking observations section with pre-PASS gate", () => {
    expect(ROLES["qa"].systemPrompt).toContain("Filing non-blocking observations");
    expect(ROLES["qa"].systemPrompt).toContain("BEFORE you emit the PASS");
  });

  it("PO prompt includes filing what peers surface section", () => {
    expect(ROLES["product-owner"].systemPrompt).toContain("Filing what peers surface");
  });
});

describe("Wave 51 — PO prompt bundle (#112 #117 #128 #129)", () => {
  it("PHASED_WORKFLOW_DISCIPLINE contains user-story template marker (#117)", () => {
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain("## Story");
  });

  it("PHASED_WORKFLOW_DISCIPLINE contains repo routing guidance (#129)", () => {
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain("apex-team-internal finding");
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain("Workspace-project finding");
  });

  it("PO system prompt contains auto-assign idle peers section (#128)", () => {
    expect(ROLES["product-owner"].systemPrompt).toContain("Auto-assign backlog to idle peers");
  });

  it("PO system prompt contains per-dispatch model selection section (#112)", () => {
    expect(ROLES["product-owner"].systemPrompt).toContain("Per-dispatch model selection");
  });
});

describe("Wave 65 — BA competency upgrade (#143)", () => {
  it("BA skills contain Discovery-first rule", () => {
    expect(businessAnalystSkills).toContain("Discovery-first");
  });

  it("BA skills contain Promote-to-MD discipline and reply format", () => {
    expect(businessAnalystSkills).toContain("Promote-to-MD");
    expect(businessAnalystSkills).toContain("Promoted to requirements/");
  });

  it("BA skills contain canonical source for business-logic", () => {
    expect(businessAnalystSkills).toContain("canonical source for business-logic");
  });

  it("BA skills contain Onboarding scan", () => {
    expect(businessAnalystSkills).toContain("Onboarding scan");
  });

  it("BA skills contain requirements/ tree files", () => {
    expect(businessAnalystSkills).toContain("business-rules.md");
    expect(businessAnalystSkills).toContain("data-sources.md");
  });

  it("Architect skills contain BA business-logic deferral", () => {
    expect(architectSkills).toContain("never synthesize business rules from observed code");
    expect(architectSkills).toContain("Defer business-logic questions to BA");
  });
});
