# Changelog — ICJIA Astro migration

All notable changes to the Astro (`astro/`) rewrite of `icjia.illinois.gov`.
This is the live-data SSR migration tracked on the `feat/astro-migration` branch.

## [0.1.0] — 2026-05-29 — Phase 0 scaffold

### Added
- Scaffolded Astro 6.4 app under `astro/` with `output: 'server'` (on-demand SSR)
  and the `@astrojs/netlify` adapter — the live-data-at-view-time architecture.
- Tailwind CSS 4 via `@tailwindcss/vite` (CSS-first `@theme`); breakpoints
  **redefined to Vuetify 2 px values** (sm 600 / md 960 / lg 1264 / xl 1904) for
  pixel-parity with the legacy layout. Brand `--color-primary: #1565c0` token.
- Alpine.js 3 via `@astrojs/alpinejs`.
- Staged the data-layer dependencies: `linkedom` (server DOM shim), `dompurify`,
  the legacy `markdown-it` stack (v12 + plugins, parity-first), `lodash-es`.
- `sharp` as an explicit dep + `pnpm.onlyBuiltDependencies` allowlist (Astro 6 /
  pnpm 10 requirement).
- `BaseLayout.astro`, scaffold `index.astro`, `global.css` token stub.

### Verified
- SSR build emits the Netlify SSR function + `_redirects` cleanly.
- Homepage renders **server-side** (content in HTML), Tailwind 4 compiles the
  custom `text-primary` token, Alpine is wired.

### Notes
- Layout uses Tailwind utilities (incl. the grid) per project preference.
- Netlify branch-deploy wiring (`netlify.toml` context + first push) is pending.
