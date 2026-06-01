import { describe, it, expect } from "vitest";
import {
  REQUIREMENTS_PHASE_PROTOCOL,
  IMPLEMENTER_REFUSAL_CLAUSE,
  VERIFICATION_PHASE_PROTOCOL,
} from "@/lib/protocols";

describe("Wave 55 — REQUIREMENTS_PHASE_PROTOCOL", () => {
  it("contains the parallel-triad mandate", () => {
    expect(REQUIREMENTS_PHASE_PROTOCOL).toContain("Parallel DISPATCH to all three");
  });

  it("contains trivial-ops exception tag", () => {
    expect(REQUIREMENTS_PHASE_PROTOCOL).toContain("[exception: trivial-ops]");
  });

  it("contains gate-verdict exception tag", () => {
    expect(REQUIREMENTS_PHASE_PROTOCOL).toContain("[exception: gate-verdict]");
  });

  it("contains scout-issue exception tag", () => {
    expect(REQUIREMENTS_PHASE_PROTOCOL).toContain("[exception: scout-issue]");
  });

  it("contains housekeeping exception tag", () => {
    expect(REQUIREMENTS_PHASE_PROTOCOL).toContain("[exception: housekeeping]");
  });

  it("contains revise-redispatch exception tag", () => {
    expect(REQUIREMENTS_PHASE_PROTOCOL).toContain("[exception: revise-redispatch]");
  });

  it("contains emergency-rollback exception tag", () => {
    expect(REQUIREMENTS_PHASE_PROTOCOL).toContain("[exception: emergency-rollback]");
  });

  it("contains security-hotfix exception tag", () => {
    expect(REQUIREMENTS_PHASE_PROTOCOL).toContain("[exception: security-hotfix]");
  });
});

describe("Wave 55 — IMPLEMENTER_REFUSAL_CLAUSE", () => {
  it("contains the refusal section header", () => {
    expect(IMPLEMENTER_REFUSAL_CLAUSE).toContain("Refuse work without a user-story reference");
  });

  it("contains the refusal reply text", () => {
    expect(IMPLEMENTER_REFUSAL_CLAUSE).toContain("Requirements phase incomplete");
  });

  it("contains the trivial-ops exception tag reference", () => {
    expect(IMPLEMENTER_REFUSAL_CLAUSE).toContain("[exception: trivial-ops]");
  });

  it("contains the Wave 55 attribution", () => {
    expect(IMPLEMENTER_REFUSAL_CLAUSE).toContain("Wave 55");
  });
});

describe("Wave 55 — VERIFICATION_PHASE_PROTOCOL routing rule", () => {
  it("routes UI changes to UX Designer", () => {
    expect(VERIFICATION_PHASE_PROTOCOL).toContain("UI changes route to UX Designer");
  });

  it("states QA always gates after design gates", () => {
    expect(VERIFICATION_PHASE_PROTOCOL).toContain("QA always gates after");
  });
});

describe("Wave 64 — mandatory build+boot smoke gate regression guards", () => {
  it("VERIFICATION_PHASE_PROTOCOL contains BUILD SMOKE mandate", () => {
    expect(VERIFICATION_PHASE_PROTOCOL).toContain("BUILD SMOKE");
  });

  it("VERIFICATION_PHASE_PROTOCOL contains BOOT SMOKE mandate", () => {
    expect(VERIFICATION_PHASE_PROTOCOL).toContain("BOOT SMOKE");
  });

  it("VERIFICATION_PHASE_PROTOCOL contains pnpm build gate", () => {
    expect(VERIFICATION_PHASE_PROTOCOL).toContain("pnpm build");
  });

  it("VERIFICATION_PHASE_PROTOCOL contains /api/health gate", () => {
    expect(VERIFICATION_PHASE_PROTOCOL).toContain("/api/health");
  });
});
