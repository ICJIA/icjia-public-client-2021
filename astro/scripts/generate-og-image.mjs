// One-time branded Open Graph image generator (1200×630, the social-share standard).
// Per the conversion checklist's "OG image build pipeline" (SVG → PNG via Sharp, with
// font-family="sans-serif" so librsvg actually renders the text). This is a STATIC
// brand asset — run once, commit the PNG; it does NOT regenerate per build (unlike the
// content-derived searchIndex/sitemap). Re-run with `pnpm og-image` if the brand changes.
//
//   pnpm og-image   →   public/icjia-og.png  (1200×630)
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../public/icjia-og.png", import.meta.url));

// Navy → deep-navy gradient (site primary #0a3a60), the ICJIA wordmark + full agency
// name in white, a #1565c0 accent rule, and the canonical host. All text (no raster
// logo — the only logo asset is navy and would vanish on the navy field).
const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a3a60"/>
      <stop offset="100%" stop-color="#062138"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="14" fill="#1565c0"/>
  <text x="100" y="250" font-family="sans-serif" font-size="170" font-weight="800" fill="#ffffff" letter-spacing="6">ICJIA</text>
  <rect x="106" y="290" width="150" height="8" fill="#4a90d9"/>
  <text x="104" y="372" font-family="sans-serif" font-size="50" font-weight="700" fill="#ffffff">Illinois Criminal Justice</text>
  <text x="104" y="432" font-family="sans-serif" font-size="50" font-weight="700" fill="#ffffff">Information Authority</text>
  <text x="104" y="556" font-family="sans-serif" font-size="30" font-weight="400" fill="#9fc3e8">icjia.illinois.gov</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(OUT);
const meta = await sharp(OUT).metadata();
console.log(`[og-image] wrote public/icjia-og.png (${meta.width}×${meta.height}, ${meta.format})`);
