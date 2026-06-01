import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("lint script regression guard", () => {
  it('package.json has a lint script set to "eslint ."', () => {
    const pkg = JSON.parse(readFileSync(resolve("package.json"), "utf-8"));
    expect(pkg.scripts?.lint).toBe("eslint .");
  });
});
