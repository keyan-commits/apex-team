import { describe, it, expect } from "vitest";
import { ROLES, PHASED_WORKFLOW_DISCIPLINE, DEFAULT_ROLE_MODELS } from "@/lib/roles";
import {
  REQUIREMENTS_PHASE_PROTOCOL,
  CONSULTATION_PROTOCOL,
} from "@/lib/protocols";
import { skills as qaSkills } from "@/lib/skills/qa";
import { skills as backendDeveloperSkills } from "@/lib/skills/backend-developer";
import { skills as uiDeveloperSkills } from "@/lib/skills/ui-developer";
import { skills as architectSkills } from "@/lib/skills/architect";
import { skills as uxDesignerSkills } from "@/lib/skills/ux-designer";
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

describe("Wave 55 — Mandatory requirements triad + role-boundary + Wave 53b/54a amendments", () => {
  it("PHASED_WORKFLOW_DISCIPLINE Phase 1 names the parallel triad", () => {
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain("MANDATORY, parallel triad");
  });

  it("PHASED_WORKFLOW_DISCIPLINE Phase 3 names the routing rule", () => {
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain("UI changes route to UX Designer");
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain("QA always gates after");
  });

  it("PO system prompt contains Requirements phase (mandatory triad) section", () => {
    expect(ROLES["product-owner"].systemPrompt).toContain("Requirements phase (mandatory triad)");
  });

  it("PO system prompt contains the seven exception tags", () => {
    expect(ROLES["product-owner"].systemPrompt).toContain("[exception: trivial-ops]");
    expect(ROLES["product-owner"].systemPrompt).toContain("[exception: gate-verdict]");
    expect(ROLES["product-owner"].systemPrompt).toContain("[exception: security-hotfix]");
  });

  it("QA skills contain the refusal clause", () => {
    expect(qaSkills).toContain("Refuse work without a user-story reference");
    expect(qaSkills).toContain("Requirements phase incomplete");
    expect(qaSkills).toContain("[exception: trivial-ops]");
  });

  it("Backend Developer skills contain the refusal clause", () => {
    expect(backendDeveloperSkills).toContain("Refuse work without a user-story reference");
    expect(backendDeveloperSkills).toContain("Requirements phase incomplete");
  });

  it("UI Developer skills contain the refusal clause", () => {
    expect(uiDeveloperSkills).toContain("Refuse work without a user-story reference");
    expect(uiDeveloperSkills).toContain("Requirements phase incomplete");
  });

  it("Architect skills contain the Review-lane boundary section", () => {
    expect(architectSkills).toContain("Review-lane boundary");
    expect(architectSkills).toContain("I DO NOT gate — defer to UX Designer");
    expect(architectSkills).toContain("Mixed PRs (touches both UI and non-UI files)");
    expect(architectSkills).toContain("Routing to ux-designer");
  });

  it("UX Designer skills contain the UI-review lane claim", () => {
    expect(uxDesignerSkills).toContain("Review-lane boundary");
  });

  it("UX Designer skills contain Proactive gate coverage (Wave 54a)", () => {
    expect(uxDesignerSkills).toContain("Proactive gate coverage");
  });

  it("UX Designer skills contain Full-page review rule (Wave 53b)", () => {
    expect(uxDesignerSkills).toContain("Full-page review rule");
    expect(uxDesignerSkills).toContain("≥1280px AND ≥390px");
  });

  it("QA skills contain Anti-pattern: mocking the component under visual test (Wave 53b)", () => {
    expect(qaSkills).toContain("Anti-pattern: mocking the component under visual test");
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

describe("Wave 64 — mandatory build smoke before PASS (closes #141)", () => {
  it("QA skills contain mandatory build smoke subsection", () => {
    expect(qaSkills).toContain("Mandatory build smoke before PASS");
  });

  it("QA skills cite the incident SHA e7d4ba6", () => {
    expect(qaSkills).toContain("e7d4ba6");
  });

  it("QA skills explain tsc limitation", () => {
    expect(qaSkills).toContain("tsc");
  });

  it("QA skills explain vitest limitation", () => {
    expect(qaSkills).toContain("vitest");
  });
});

describe("Wave 88 — US-041 protocol injection wiring (closes #140)", () => {
  it("PO system prompt contains full REQUIREMENTS_PHASE_PROTOCOL exception table", () => {
    const po = ROLES["product-owner"].systemPrompt;
    expect(po).toContain(REQUIREMENTS_PHASE_PROTOCOL);
    expect(po).toContain("[exception: trivial-ops]");
    expect(po).toContain("[exception: security-hotfix]");
    expect(po).toContain("When it applies");
  });

  it("PHASED_WORKFLOW_DISCIPLINE contains full REQUIREMENTS_PHASE_PROTOCOL exception table", () => {
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain(REQUIREMENTS_PHASE_PROTOCOL);
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain("| `[exception: trivial-ops]`");
    expect(PHASED_WORKFLOW_DISCIPLINE).toContain("| `[exception: security-hotfix]`");
  });

  it("non-PO role prompts contain full exception table via PHASED_WORKFLOW_DISCIPLINE", () => {
    for (const role of ["architect", "backend-developer", "qa", "devsecops", "ux-designer", "business-analyst", "ui-developer"] as const) {
      const prompt = ROLES[role].systemPrompt;
      expect(prompt, `${role} prompt missing exception table`).toContain("[exception: trivial-ops]");
      expect(prompt, `${role} prompt missing security-hotfix tag`).toContain("[exception: security-hotfix]");
    }
  });

  it("all non-PO role prompts include CONSULTATION_PROTOCOL via PEER_PROTOCOL", () => {
    const consultationSnippet = "Any role may HANDOFF to BA at any time";
    for (const role of ["architect", "backend-developer", "qa", "devsecops", "ux-designer", "business-analyst", "ui-developer"] as const) {
      expect(ROLES[role].systemPrompt, `${role} prompt missing consultation protocol`).toContain(consultationSnippet);
    }
  });

  it("CONSULTATION_PROTOCOL constant is non-empty and contains key phrase", () => {
    expect(CONSULTATION_PROTOCOL).toContain("Any role may HANDOFF to BA at any time");
    expect(CONSULTATION_PROTOCOL).toContain("Never guess at functional intent");
  });
});

describe("Wave 107 — US-017 PO auto-compact peer HANDOFF docs (#131)", () => {
  const poPrompt = ROLES["product-owner"].systemPrompt;

  it("PO prompt has compaction pre-check step in auto-assign section", () => {
    expect(poPrompt).toContain("Compaction pre-check");
  });

  it("PO prompt references the 8000-char threshold", () => {
    expect(poPrompt).toContain("8000");
  });

  it("PO prompt references needsCleanup flag", () => {
    expect(poPrompt).toContain("needsCleanup");
  });

  it("PO prompt enforces 1-hour cooldown", () => {
    expect(poPrompt).toContain("1 hour");
  });

  it("PO prompt carries [exception: housekeeping] on compaction DISPATCH", () => {
    expect(poPrompt).toContain("[exception: housekeeping]");
  });

  it("PO prompt tracks last_compacted per role in NOTES", () => {
    expect(poPrompt).toContain("last_compacted");
  });

  it("PO prompt requires one DISPATCH per peer per turn during compaction", () => {
    expect(poPrompt).toContain("one DISPATCH per peer per turn");
  });
});
