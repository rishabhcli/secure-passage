import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/**", "e2e/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage/frontend",
      include: [
        "src/App.tsx",
        "src/components/NavLink.tsx",
        "src/components/auth/**/*.tsx",
        "src/components/crossings/**/*.tsx",
        "src/components/observability/**/*.tsx",
        "src/components/receipts/**/*.tsx",
        "src/components/review/**/*.tsx",
        "src/components/shell/**/*.tsx",
        "src/components/status/**/*.tsx",
        "src/hooks/**/*.ts",
        "src/hooks/**/*.tsx",
        "src/lib/**/*.ts",
        "src/pages/**/*.tsx",
      ],
      exclude: [
        "src/components/ui/**",
        "src/integrations/supabase/**",
        "src/main.tsx",
        "src/test/**",
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
