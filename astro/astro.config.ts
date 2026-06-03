import { defineConfig, envField } from 'astro/config';
import alpinejs from '@astrojs/alpinejs';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

// ICJIA flagship — fully static build (de-serverless, 2026-06-03).
// output: 'static' + NO adapter: every route is prerendered to HTML at build
// (getStaticPaths on dynamics) and served from the CDN with ZERO Netlify
// functions. Content stays live via client-side Alpine "live-islands" that poll
// Strapi in the browser and swap in fresh data on load; new pages (new slugs)
// appear on a rebuild (Strapi publish webhook → Netlify build hook).
// See docs/STATIC-ISLANDS-MIGRATION.md.
export default defineConfig({
  site: 'https://icjia.illinois.gov',
  // Pure static — NO adapter. Every route is prerendered (getStaticPaths on dynamics);
  // content stays live via client-side Alpine islands polling Strapi; new pages appear on
  // a rebuild (publish webhook → build hook). Dropping @astrojs/netlify removes the SSR
  // catch-all function + the adapter's edge-middleware + the auto-provisioned Netlify DB —
  // zero serverless. astro:assets images optimize at BUILD (Sharp) instead of the Netlify
  // Image CDN. `astro dev` + `astro build` both run adapterless in static mode.
  output: 'static',
  trailingSlash: 'always',
  // Inline ALL CSS (not just small sheets): the SSR head was emitting external
  // render-blocking <link>s (cache.css + per-page css) that delayed first paint
  // ~860ms after the HTML arrived — a blank gap on top of any cold-lambda TTFB.
  // Inlined CSS parses with the HTML (no extra round-trips), so first paint and
  // the loading overlay appear as soon as the response paints. The HTML is
  // edge-cached (Durable Cache), so the per-page inline cost is paid once.
  build: { inlineStylesheets: 'always' },
  // Astro image optimization for CMS images (astro:assets — Sharp at BUILD; there
  // is no adapter/Image CDN now, so images are optimized into dist/ at build time).
  // `domains` allowlists the remote Strapi host. NO Thumbor: CMS images are
  // optimized by Astro only and served SAME-ORIGIN (which also stops the
  // third-party cookie being sent to the Strapi host — the Lighthouse ding).
  image: { domains: ['agency.icjia-api.cloud'] },
  vite: { plugins: [tailwindcss()] },
  integrations: [alpinejs(), icon()],
  env: {
    schema: {
      // Strapi endpoints — public read, no token. Server-context = consumed at
      // BUILD by the data layer. (The Alpine live-islands fetch Strapi directly in
      // the browser, so the Strapi hosts ARE in the CSP connect-src — see _headers.)
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
