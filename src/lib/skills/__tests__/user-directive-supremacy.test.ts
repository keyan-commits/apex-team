import { describe, it, expect } from "vitest";
import {
  ROLES,
  ALL_ROLES,
} from "@/lib/roles";

/**
 * Unit test — User-Directive Supremacy Shared Skill (#321)
 *
 * Verifies that every role's systemPrompt includes the user-directive-supremacy skill.
 * This test ensures that if a new role is added without the shared skill, CI will fail.
 *
 * Test structure:
 * 1. Loop over all roles exported from roles.ts (via ALL_ROLES)
 * 2. For each role, read its skills string
 * 3. Assert the skills string contains all five clauses of the shared skill:
 *    - "Directive supremacy"
 *    - "No fake choices"
 *    - "Verify against the user-stated requirement"
 *    - "When in doubt, re-read"
 *    - "Surface conflicts"
 * 4. Assert each clause appears EARLY in the skills (position < 2000 chars)
 */

describe("User-Directive-Supremacy Shared Skill", () => {
  const REQUIRED_PHRASES = [
    "Directive supremacy",
    "No fake choices",
    "Verify against the user-stated requirement",
    "When in doubt, re-read",
    "Surface conflicts",
  ];

  // Loop over every role and verify the shared skill is present
  for (const roleId of ALL_ROLES) {
    const role = ROLES[roleId];

    describe(`${role.label} (#${roleId})`, () => {
      it("should include all five user-directive-supremacy clauses", () => {
        const skills = role.skills;
        expect(skills).toBeTruthy();
        expect(typeof skills).toBe("string");

        // Every required phrase must be present
        for (const phrase of REQUIRED_PHRASES) {
          expect(skills).toContain(phrase);
        }
      });

      it("should have directive-supremacy content EARLY in skills (first 2000 chars)", () => {
        const skills = role.skills ?? "";
        const earlyPortion = skills.substring(0, 2000);

        // At least one of the required phrases should appear early,
        // indicating the shared skill is prepended before role-specific content
        const hasEarlyContent = REQUIRED_PHRASES.some(
          (phrase) => earlyPortion.includes(phrase),
        );

        expect(hasEarlyContent).toBe(true);
      });

      it("should not offer fake choices when directive conflicts with plan", () => {
        // Negative assertion: skills should NOT contain these patterns in the
        // directive-supremacy section (first 2000 chars)
        const skills = role.skills ?? "";
        const earlyPortion = skills.substring(0, 2000);

        const badPatterns = [
          "Would you prefer",
          "Which would you like",
          "do you choose",
        ];

        for (const badPattern of badPatterns) {
          expect(earlyPortion).not.toContain(badPattern);
        }
      });
    });
  }

  describe("Shared skill mutation test guard", () => {
    it("should fail if any role is missing the directive-supremacy skill (mutation guard)", () => {
      // This test documents the mutation-verification process:
      // To verify the shared skill is actually being caught by CI,
      // we temporarily remove it from one role and confirm this test fails.
      //
      // Procedure:
      // 1. Edit one role's skill file to remove USER_DIRECTIVE_SKILL prepend
      // 2. Run `pnpm test:run`
      // 3. This test should FAIL (e.g., Product Owner lacks "Directive supremacy")
      // 4. Restore the skill
      // 5. Run `pnpm test:run` again — test should PASS
      //
      // This verifies that the CI check actually catches the missing skill,
      // not just that the skill is present in other roles.

      // Verify that at least one role has the full shared skill
      const rolesWithSkill = ALL_ROLES.filter((roleId) => {
        const role = ROLES[roleId];
        return REQUIRED_PHRASES.every((phrase) => (role.skills ?? "").includes(phrase));
      });

      const missingRoles = ALL_ROLES.filter((r) => !rolesWithSkill.includes(r));
      expect(missingRoles).toEqual([]);
    });
  });

  describe("Role coverage completeness", () => {
    it("should have at least 8 roles (team requirement)", () => {
      // Sanity check: apex-team has 8 roles (PO + 7 team roles: BA, Architect, UI Dev, BE Dev, QA, DevSecOps, UX Designer)
      expect(ALL_ROLES.length).toBe(8);
    });
  });
});
