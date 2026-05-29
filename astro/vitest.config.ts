import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // node env: globalThis.DOMParser is undefined by default, so the parity
    // suite controls which engine (linkedom / jsdom) is installed per call.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
