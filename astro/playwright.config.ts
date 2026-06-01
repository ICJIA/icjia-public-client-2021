import { defineConfig, devices } from '@playwright/test';

// Playwright E2E (interaction) config for the ICJIA Astro app.
//
// NOTE: there is intentionally NO `webServer` block here — the dev server is
// expected to be ALREADY RUNNING at http://localhost:4321 (`pnpm dev`, or a
// built `astro preview`) before tests are invoked. CI must start that server
// itself (e.g. `pnpm dev &` then wait for :4321, or `pnpm build && pnpm preview &`)
// BEFORE `pnpm test:e2e`. Because there is no webServer block, the
// `reuseExistingServer` option does not apply.
//
// The site uses `trailingSlash: 'always'`, so every spec uses trailing-slash URLs.
//
// Separate from the visual-regression harness (scripts/vr/*), which drives the
// raw `playwright` library directly for pixel-diff screenshots. This config is
// for behavioral interaction specs under ./e2e and uses `@playwright/test`.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
