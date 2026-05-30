// ESLint flat config — DEV-ONLY accessibility hygiene for .astro templates.
// Scoped to the jsx-a11y rules eslint-plugin-astro exposes for Astro markup; this
// is a CI lint, NOT the primary a11y gate (axe-core + Lighthouse remain authoritative
// and catch the CMS-content + Alpine-dynamic issues a static linter can't see).
//   pnpm lint        — report a11y findings (warnings don't fail; genuine errors do)
//   pnpm lint:fix    — auto-fix the fixable ones
import eslintPluginAstro from "eslint-plugin-astro";

export default [
  // Lint ONLY .astro templates — a11y rules don't apply to .js/.ts/.mjs, and linting
  // them here just surfaces stale graphql disable-comments + parser noise.
  {
    ignores: [
      "dist/**",
      ".astro/**",
      ".netlify/**",
      "node_modules/**",
      "public/**",
      "scripts/**",
      "**/*.js",
      "**/*.mjs",
      "**/*.cjs",
      "**/*.ts",
      "**/*.d.ts",
    ],
  },
  // Astro parser/processor + the jsx-a11y rule set for .astro templates.
  ...eslintPluginAstro.configs.recommended,
  ...eslintPluginAstro.configs["jsx-a11y-recommended"],
  {
    files: ["**/*.astro"],
    rules: {
      // OFF for the 4 rules that can't see this app's dynamic bindings, so they only
      // produce false positives here (axe-core + Lighthouse, which DO see the rendered
      // DOM, are the authoritative gate for these — both pass 100):
      //   anchor-is-valid / anchor-has-content  → Alpine `:href` + `x-text` anchors
      //   heading-has-content                   → `set:html` / `x-text` headings
      //   no-noninteractive-element-interactions → `<img onerror>` (hide-on-404, benign)
      // Every OTHER jsx-a11y rule stays an ERROR — so this lint still catches genuinely
      // STATIC violations (e.g. a literal `<img>` with no alt, an unlabeled control).
      "astro/jsx-a11y/anchor-is-valid": "off",
      "astro/jsx-a11y/anchor-has-content": "off",
      "astro/jsx-a11y/heading-has-content": "off",
      "astro/jsx-a11y/no-noninteractive-element-interactions": "off",
    },
  },
];
