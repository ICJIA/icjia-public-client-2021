import { defineConfig, envField } from 'astro/config';
import netlify from '@astrojs/netlify';
import node from '@astrojs/node';
import alpinejs from '@astrojs/alpinejs';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

// ICJIA flagship — live-data SSR migration.
// output: 'server' (on-demand SSR per request) with @astrojs/netlify.
// Content pages fetch Strapi server-side per request; a short
// stale-while-revalidate CDN cache (set per-route via Astro.response.headers)
// keeps perf high while content stays live. CMS-independent routes opt into
// `export const prerender = true` per page.
// Local `astro dev` uses @astrojs/node; the build / Netlify branch-deploy uses
// @astrojs/netlify. Why: the Netlify adapter's dev integration reads the root
// netlify.toml and mis-resolves the branch context's `base = "astro"` relative
// to the Astro root (looks for astro/astro) — there is no per-cwd fix. The node
// adapter never touches netlify.toml, so dev just works. Both are interchangeable
// because the data layer + pages are adapter-agnostic — this is also the
// @astrojs/node escape hatch the plan keeps for a possible DigitalOcean move.
const isDevServer = process.argv.includes('dev');

export default defineConfig({
  site: 'https://icjia.illinois.gov',
  output: 'server',
  adapter: isDevServer ? node({ mode: 'standalone' }) : netlify(),
  trailingSlash: 'always',
  build: { inlineStylesheets: 'auto' },
  vite: { plugins: [tailwindcss()] },
  integrations: [alpinejs(), icon()],
  env: {
    schema: {
      // Strapi endpoints — public read, no token. Server-context (fetched
      // server-side under SSR, so they need not appear in CSP connect-src).
      PUBLIC_API_BASE: envField.string({
        context: 'server',
        access: 'public',
        default: 'https://agency.icjia-api.cloud',
      }),
      PUBLIC_API_GRAPHQL: envField.string({
        context: 'server',
        access: 'public',
        default: 'https://agency.icjia-api.cloud/graphql',
      }),
      PUBLIC_HUB_GRAPHQL: envField.string({
        context: 'server',
        access: 'public',
        default: 'https://researchhub.icjia-api.cloud/graphql',
      }),
      PUBLIC_IMAGE_SERVER: envField.string({
        context: 'server',
        access: 'public',
        default: 'https://image.icjia.cloud',
      }),
    },
  },
});
