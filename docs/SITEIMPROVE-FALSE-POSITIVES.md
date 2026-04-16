# SiteImprove False Positives — Running Log

SiteImprove's proprietary rule engine is stricter than WCAG and the W3C ACT Rules in several places. Pages that pass axe-core cleanly (the industry-standard open-source tool used by Google, Microsoft, and most accessibility consultancies) sometimes continue to appear in SiteImprove reports under `failed` or `failed cantTell` (cantTell = "can't auto-verify, needs manual review").

This document is a running log of confirmed false-positive patterns on this site — flags that SiteImprove keeps reporting but that represent correct accessibility practice (or at worst, stricter-than-spec rule interpretations). Each entry includes the pattern, why it is a false positive, verification evidence, and the recommended action in SiteImprove.

**How to use this document:**
- When a new SiteImprove report arrives, check the rule against this table before remediating.
- If the flag matches a documented false-positive pattern, mark the occurrence as "Accepted" in SiteImprove's inspector with a short comment citing the entry here.
- If the flag is a new pattern (not in this table), triage it — run the targeted axe-core audit scripts in `scripts/audit-siteimprove-*.js` and compare results. If axe-core also flags it, remediate. If axe-core is clean and the rule is one of the known stricter-than-spec rules, add a new entry here.

For background on why the two tools differ, see the "axe-core vs. SiteImprove" section at the top of [CHANGELOG.md](../CHANGELOG.md).

---

## False-positive patterns

| # | Rule | Issue name | Pattern | Why it's a false positive | Verified clean by | First reported | Action |
|---|---|---|---|---|---|---|---|
| 1 | sia-r14 | Visible label and accessible name do not match | `<nav>` landmarks with sr-only `aria-labelledby` labels (e.g. `<nav aria-labelledby="nav-section-label">` where the labelledby target has `class="sr-only"` and text like "Section navigation") | WCAG 2.5.3 "Label in Name" applies to **interactive widgets**, not landmarks — see [ACT Rule 2ee8b8 "Visible label is part of accessible name"](https://www.w3.org/WAI/standards-guidelines/act/rules/2ee8b8/), which scopes the rule to widgets. sia-r14 applies it more broadly to landmark `<nav>` elements, which produces `failed cantTell` on every page with multiple navs. Using sr-only labels on `<nav>` landmarks is required a11y practice when the page has more than one navigation landmark, so they can be distinguished in screen reader landmark menus. Removing the labels would actively harm screen reader users. | axe-core WCAG 2.1 AA (0 violations) on all 6 reported pages — `scripts/audit-siteimprove-labelname.js` | 2026-04-16 (SiteImprove crawl) | Mark each occurrence as "Accepted" in SiteImprove inspector. Suggested comment: *"Landmark `<nav>` with sr-only aria-labelledby for screen reader distinction. WCAG 2.5.3 and ACT Rule 2ee8b8 scope 'Label in Name' to interactive widgets; landmarks are out of scope. Verified clean by axe-core WCAG 2.1 AA."* |

---

## Other audit-tool false positives

This table covers false positives from other auditors (axe-core Needs Review, Lighthouse, contrastcap, etc.) that are **not** SiteImprove but may appear in the same audit trail. Documenting them here prevents re-investigation.

| # | Tool | Rule / check | Pattern | Why it's a false positive | Verified by |
|---|---|---|---|---|---|
| A | contrastcap | pixel-sample-over-image contrast "failures" on Vuetify v-tabs | `.v-tab` elements sampled and reported as `foreground: #000000, background: #000000, ratio: 1:1` | contrastcap's pixel sampler reads the underlying pixel under the text, but Vuetify tabs have transparent parent backgrounds that allow the tool to hit black pixels outside the visible tab chrome. The tool flags this explicitly via `backgroundSource: "pixel-sample-over-image"`. Actual computed styles: `color: rgb(0, 0, 0)` on `background-color: rgb(238, 238, 238)` → **~18:1 contrast, passes WCAG AA by a wide margin**. | Chrome DevTools `getComputedStyle` on the flagged `.v-tab` elements (2026-04-16) |
| B | axe-core | `color-contrast` Needs Review on Vuetify v-tabs | `(17 el) .v-slide-group__content > .v-tab` on pages with v-tabs widgets | Same underlying cause as #A: axe-core cannot auto-verify contrast when the background involves dynamic CSS (tab active/hover states, slide-group transitions). It correctly classifies these as Needs Review, not Violation. Live inspection confirms contrast is fine. | axe-core Needs-Review classification (not a Violation); live-DOM verification |

---

## Verification commands

Each targeted audit script runs the full axe-core WCAG 2.1 AA rule set against a specific list of pages. Use these to verify that a reported SiteImprove issue is (or is not) a false positive:

```bash
# sia-r14 "Label in Name" — landmark nav pages
node scripts/audit-siteimprove-labelname.js

# sia-r77 "Table cell missing context" — table-rich article pages
node scripts/audit-siteimprove-tables.js

# Other targeted audits
node scripts/audit-siteimprove-contrast.js
node scripts/audit-siteimprove-empty.js
node scripts/audit-siteimprove-textclip.js
```

A full-site audit (~4 hours, all 2,356 pages) is available via `npm run audit -- all --sample 9999`. A faster sampled audit (~20 min) uses `npm run audit -- all --sample 20`.

---

## Updating this document

When adding a new false-positive pattern:

1. Add a row to the table above with all 8 columns filled in.
2. If a targeted audit script does not already exist for the rule, create one in `scripts/audit-siteimprove-<rule>.js` modeled on the existing ones.
3. Reference this document in the relevant CHANGELOG entry.
4. Keep the table sorted by SiteImprove rule ID (`sia-rXX`) ascending.
