import { defineConfig, envField } from 'astro/config';
import netlify from '@astrojs/netlify';
import alpinejs from '@astrojs/alpinejs';
import tailwindcss from '@tailwindcss/vite';

// ICJIA flagship — live-data SSR migration.
// output: 'server' (on-demand SSR per request) with @astrojs/netlify.
// Content pages fetch Strapi server-side per request; a short
// stale-while-revalidate CDN cache (set per-route via Astro.response.headers)
// keeps perf high while content stays live. CMS-independent routes opt into
// `export const prerender = true` per page.
export default defineConfig({
  site: 'https://icjia.illinois.gov',
  output: 'server',
  adapter: netlify(),
  trailingSlash: 'always',
  build: { inlineStylesheets: 'auto' },
  vite: { plugins: [tailwindcss()] },
  integrations: [alpinejs()],
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
