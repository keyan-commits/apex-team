import { describe, it, expect } from "vitest";
import { ROLES, TEAM_ROLES } from "@/lib/roles";

describe("skills injection", () => {
  it("ui-developer role has a non-empty skills string", () => {
    const role = ROLES["ui-developer"];
    expect(role.skills).toBeDefined();
    expect(typeof role.skills).toBe("string");
    expect(role.skills!.length).toBeGreaterThan(0);
  });

  it("ui-developer skills block contains expected section headings", () => {
    const skills = ROLES["ui-developer"].skills!;
    expect(skills).toContain("## UI/UX domain expertise");
    expect(skills).toContain("### Visual hierarchy");
    expect(skills).toContain("### Accessibility-first");
    expect(skills).toContain("### Performance budget");
  });

  it("all 6 peer roles have skills defined and non-empty", () => {
    for (const roleId of TEAM_ROLES) {
      const role = ROLES[roleId];
      expect(role.skills, `${roleId} is missing a skills field`).toBeDefined();
      expect(
        role.skills!.length,
        `${roleId} skills field is empty`,
      ).toBeGreaterThan(0);
    }
  });

  it("product-owner has no skills field (PO is the orchestrator, not a domain expert)", () => {
    expect(ROLES["product-owner"].skills).toBeUndefined();
  });
});
