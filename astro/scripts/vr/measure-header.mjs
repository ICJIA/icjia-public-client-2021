// One-off: measure where page content starts on prod vs the Astro branch, at desktop,
// to root-cause the VR vertical offset. Reports the <h1> top (the offset signal) + the
// header/main geometry so we can see WHICH region is taller on Astro.
import { chromium } from "playwright";

const ROUTE = process.env.MR_ROUTE || "/about/about-the-authority/";
const SITES = [
  ["prod ", "https://icjia.illinois.gov"],
  ["astro", process.env.MR_ASTRO || "https://feat-astro-migration--icjia-public.netlify.app"],
];

const browser = await chromium.launch();
for (const [name, base] of SITES) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1024 });
  await page.goto(base + ROUTE, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1800);
  const m = await page.evaluate(() => {
    const r = (el) => (el ? el.getBoundingClientRect() : null);
    const top = (el) => { const b = r(el); return b ? Math.round(b.top + window.scrollY) : null; };
    const ht = (el) => { const b = r(el); return b ? Math.round(b.height) : null; };
    const h1 = document.querySelector("h1");
    // Dump wide elements in the header region (Y 86–185) to find the context bar parts.
    const band = [...document.querySelectorAll("*")]
      .map((el) => {
        const b = el.getBoundingClientRect();
        return { el, t: Math.round(b.top + window.scrollY), h: Math.round(b.height), w: Math.round(b.width) };
      })
      .filter((o) => o.t >= 86 && o.t <= 185 && o.h >= 10 && o.w >= 300)
      .map((o) => `${o.t}+${o.h} <${o.el.tagName.toLowerCase()}.${(o.el.className || "").toString().trim().split(/\s+/)[0] || "-"}>`)
      .slice(0, 16);
    return { h1Top: top(h1), band };
  });
  console.log(`${name}  ${JSON.stringify(m)}`);
  await page.close();
}
await browser.close();
