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
  // Inline ALL CSS (not just small sheets): the SSR head was emitting external
  // render-blocking <link>s (cache.css + per-page css) that delayed first paint
  // ~860ms after the HTML arrived — a blank gap on top of any cold-lambda TTFB.
  // Inlined CSS parses with the HTML (no extra round-trips), so first paint and
  // the loading overlay appear as soon as the response paints. The HTML is
  // edge-cached (Durable Cache), so the per-page inline cost is paid once.
  build: { inlineStylesheets: 'always' },
  // Astro image optimization for live CMS images (astro:assets — Sharp in dev,
  // Netlify Image CDN on deploy; the Netlify adapter auto-allowlists these hosts
  // for remote_images). NO Thumbor: CMS images are compressed by Astro only and
  // served SAME-ORIGIN (which also stops the third-party cookie being sent to the
  // Strapi host — the Lighthouse best-practices ding).
  image: { domains: ['agency.icjia-api.cloud'] },
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
    },
  },
});
