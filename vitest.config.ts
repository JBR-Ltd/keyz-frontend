// vitest.config.ts
//
// Runs the pure-logic tests under src/**/__tests__. No DOM, no Next.js
// runtime — the modules under test are pure TypeScript. The "@" alias
// matches tsconfig so imports resolve the same way the app sees them.

import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/__tests__/**/*.test.ts"],
    reporters: "default",
  },
});
