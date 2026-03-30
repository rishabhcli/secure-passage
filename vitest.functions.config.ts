import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/functions/**/*.test.ts"],
    setupFiles: ["./tests/functions/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@functions": path.resolve(__dirname, "./supabase/functions"),
    },
  },
});
