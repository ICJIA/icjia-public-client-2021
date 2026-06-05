// getViteConfig (not bare defineConfig) so tests can import .astro components via
// the Astro Container API — needed by the live-detail twin-renderer parity suites
// (e.g. src/lib/live/renderers/*.parity.test.ts), which render the real .astro
// component and assert the client twin matches. Astro's Vite plugins are additive;
// the pure .ts suites keep running exactly as before (node env preserved).
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    // node env: globalThis.DOMParser is undefined by default, so the parity
    // suite controls which engine (linkedom / jsdom) is installed per call.
    // (Per-file `// @vitest-environment jsdom` opts specific suites into a DOM.)
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
