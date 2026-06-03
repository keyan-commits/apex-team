import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Hoisted mocks — must precede imports that load fold-handoff.ts
vi.mock("child_process", () => ({ execSync: vi.fn() }));
vi.mock("fs/promises", () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

import { foldFragments, run, type Fragment } from "../../scripts/fold-handoff";
import { execSync } from "child_process";
import * as fsP from "fs/promises";

const EXISTING = "## Old content\n\nSome old notes.";
const DATE = "2026-06-02";

// ---------------------------------------------------------------------------
// Pure function tests (F1, F3) — no filesystem or git involvement
// ---------------------------------------------------------------------------

describe("foldFragments — pure fold logic", () => {
  it("F1: 3 fragments produce 1 NOW block in sorted (deterministic) order", () => {
    const fragments: Fragment[] = [
      { name: "93-qa", content: "## Done\n- smoke\n## In flight\n- none\n## Next\n- nothing\n## Notes\n- n/a" },
      { name: "93-architect", content: "## Done\n- ADR-014\n## In flight\n- none\n## Next\n- nothing\n## Notes\n- n/a" },
      { name: "93-backend-developer", content: "## Done\n- fold script\n## In flight\n- tests\n## Next\n- none\n## Notes\n- n/a" },
    ];
    // Sort mirrors what run() does
    const sorted = [...fragments].sort((a, b) => a.name.localeCompare(b.name));
    const result = foldFragments(sorted, EXISTING, DATE);

    // Exactly one NOW block
    expect((result.match(/^## ⏭️ NOW/gm) ?? []).length).toBe(1);
    expect(result).toContain(`## ⏭️ NOW — ${DATE}`);
    expect(result).toContain("3 fragments folded");

    // Deterministic order: architect < backend-developer < qa
    const archIdx = result.indexOf("### 93-architect");
    const beIdx = result.indexOf("### 93-backend-developer");
    const qaIdx = result.indexOf("### 93-qa");
    expect(archIdx).toBeGreaterThan(-1);
    expect(archIdx).toBeLessThan(beIdx);
    expect(beIdx).toBeLessThan(qaIdx);

    // Existing content preserved
    expect(result).toContain("---");
    expect(result).toContain(EXISTING);
  });

  it("F3: fold with zero fragments is a no-op — returns existing content unchanged", () => {
    const result = foldFragments([], EXISTING, DATE);
    expect(result).toBe(EXISTING);
  });

  it("F1b: single fragment uses singular label and preserves structure", () => {
    const fragments: Fragment[] = [
      { name: "93-backend-developer", content: "## Done\n- fold script\n## In flight\n- none\n## Next\n- none\n## Notes\n- n/a" },
    ];
    const result = foldFragments(fragments, EXISTING, DATE);

    expect(result).toContain("1 fragment folded");
    expect(result).toContain("### 93-backend-developer");
    expect(result).toContain("fold script");
    expect(result).toContain(EXISTING);
  });
});

// ---------------------------------------------------------------------------
// run() tests (F2) — mocked fs/promises + child_process
// ---------------------------------------------------------------------------

describe("run() — filesystem + git rm integration (F2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fsP.readdir as any).mockResolvedValue(["93-architect.md", ".gitkeep"]);
    vi.mocked(fsP.readFile as any)
      .mockResolvedValueOnce("## Done\n- ADR-014\n## In flight\n- none\n## Next\n- none\n## Notes\n- n/a")
      .mockResolvedValueOnce("## Old HANDOFF\n\nContent.");
    vi.mocked(fsP.writeFile as any).mockResolvedValue(undefined);
    vi.mocked(execSync as any).mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("F2: git rm is called for each .md fragment (not .gitkeep) after fold", async () => {
    await run();

    // writeFile should be called once with the folded content
    expect(fsP.writeFile).toHaveBeenCalledOnce();
    const [writePath, writeContent] = vi.mocked(fsP.writeFile).mock.calls[0] as [string, string];
    expect(writePath).toBe("HANDOFF.md");
    expect(writeContent).toContain("## ⏭️ NOW");
    expect(writeContent).toContain("### 93-architect");
    expect(writeContent).toContain("Old HANDOFF");

    // execSync called only for the .md fragment, not .gitkeep
    expect(execSync).toHaveBeenCalledOnce();
    const callArg = vi.mocked(execSync).mock.calls[0][0] as string;
    expect(callArg).toContain("_handoff-pending");
    expect(callArg).toContain("93-architect.md");
  });
});
