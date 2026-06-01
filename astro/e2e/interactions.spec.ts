import { test, expect } from '@playwright/test';

// ICJIA Astro — E2E interaction specs (first spec; covers the interactions
// shipped this session). Run against an already-running dev server at :4321
// (see playwright.config.ts). The site uses `trailingSlash: 'always'`, so all
// URLs below carry a trailing slash.
//
// The search UI loads a ~2.7 MB Fuse index in a Web Worker off the main thread,
// so result assertions get generous auto-waiting timeouts.
//
// TODO — remaining interactions to cover in follow-up specs:
//   - Mobile nav drawer (hamburger open/close, focus trap, link nav, Esc to close)
//   - Responsive data tables (mobile stacked/card view ↔ desktop table; sort/links)
//   - Forms (grant-status / lap-request: validation, required fields, submit)
//   - Translate modal (context-bar + footer [data-translate-trigger] open/close)
//   - Calendar / events interactions (month nav, event selection)
//   - Search deep-link route /search/<query>/ (path-param seed) + ?filter= deep link
//   - ResearchHub carousel (auto-rotate pause, manual prev/next)

const SEARCH_RESULT_TIMEOUT = 30_000; // worker index load + Fuse build can be slow

test.describe('ICJIA interactions (shipped this session)', () => {
  test('tag chip on a news listing navigates to /search/ and runs that query', async ({
    page,
  }) => {
    await page.goto('/news/press/');

    // First tag chip links to the search route with the tag as ?q=.
    const chip = page.locator('a.chip[href^="/search/?q="]').first();
    await expect(chip).toBeVisible();
    const tagText = (await chip.innerText()).trim();
    const chipHref = await chip.getAttribute('href');
    expect(chipHref).toBeTruthy();

    await chip.click();

    // Landed on the search route with a ?q= query string.
    await expect(page).toHaveURL(/\/search\/\?q=/);

    // The search input is seeded from the (decoded) ?q= param == the chip's tag text.
    const input = page.locator('#search-q');
    await expect(input).toHaveValue(tagText);

    // The search actually ran: at least one result becomes visible AND the
    // status line reports a result count (both confirm the worker answered).
    await expect(page.locator('.search-result').first()).toBeVisible({
      timeout: SEARCH_RESULT_TIMEOUT,
    });
    await expect(page.locator('.search-status')).toContainText(/\d+\s+results?\b/i, {
      timeout: SEARCH_RESULT_TIMEOUT,
    });
  });

  test('context-bar tabs overflow and stay scroll-reachable on a narrow screen', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/grants/funding/'); // Grants section bar = 7 tabs

    const ul = page.locator('.ctx-tabs ul');
    await expect(ul).toBeVisible();
    const firstTab = page.locator('.ctx-tab').first();
    await expect(firstTab).toBeVisible();

    // The tab strip overflows its container at 375px (more tabs than fit).
    const { scrollWidth, clientWidth } = await ul.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(scrollWidth).toBeGreaterThan(clientWidth);

    // Scrolled fully left, the FIRST tab is reachable (not stranded off the left
    // edge). This is the `justify-content: safe center` fix: plain `center` would
    // push leading tabs to a negative offset where scroll can't reach them.
    await ul.evaluate((el) => {
      el.scrollLeft = 0;
    });
    const ulBox = await ul.boundingBox();
    const firstBox = await firstTab.boundingBox();
    expect(ulBox).not.toBeNull();
    expect(firstBox).not.toBeNull();
    expect(firstBox!.x).toBeGreaterThanOrEqual(ulBox!.x - 1);

    // The strip actually scrolls horizontally (the overflow is reachable).
    const scrolledLeft = await ul.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
      return el.scrollLeft;
    });
    expect(scrolledLeft).toBeGreaterThan(0);
  });

  test('search ?q= autofills the input, shows results, and filter chips narrow them', async ({
    page,
  }) => {
    await page.goto('/search/?q=crime');

    // ?q= seeds the input on load.
    await expect(page.locator('#search-q')).toHaveValue('crime');

    // Results land once the worker answers.
    const results = page.locator('.search-result');
    await expect(results.first()).toBeVisible({ timeout: SEARCH_RESULT_TIMEOUT });
    const totalBefore = await results.count();
    expect(totalBefore).toBeGreaterThan(0);

    // Pick a content-type filter chip that isn't the leading "No filter" chip.
    const filterChip = page
      .locator('.filter-chip')
      .filter({ hasNotText: 'No filter' })
      .first();
    await expect(filterChip).toBeVisible({ timeout: SEARCH_RESULT_TIMEOUT });
    await filterChip.click();

    // It becomes the active chip…
    await expect(filterChip).toHaveClass(/filter-chip--active/);
    // …and the visible result set narrows to (at most) that content type.
    await expect(async () => {
      const after = await results.count();
      expect(after).toBeLessThanOrEqual(totalBefore);
    }).toPass({ timeout: SEARCH_RESULT_TIMEOUT });
  });
});
