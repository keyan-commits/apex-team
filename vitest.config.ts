import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    // explicit exclude replaces vitest defaults — keep node_modules, playwright, and
    // .claude/ worktrees (QA smoke dirs) out of test discovery
    exclude: ["tests/playwright/**", "**/node_modules/**", ".claude/**", "**/.git/**"],
  },
});
