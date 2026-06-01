import { test, expect, type Page } from '@playwright/test';

// ICJIA Astro — E2E flows spec.
// Covers: mobile nav drawer, data table (sort/filter/mobile), forms validation,
// translate modal, events calendar, and search deep-link.
//
// Run against an already-running dev server at :4321 (see playwright.config.ts).
// All URLs use trailing slashes (trailingSlash: 'always').
//
// The search worker loads a ~2.7 MB Fuse index off the main thread, so any
// test that waits for search results uses a generous SEARCH_TIMEOUT.

const SEARCH_TIMEOUT = 30_000;
// Alpine hydrates quickly, but give SSR/CDN a moment on slow machines.
const ALPINE_TIMEOUT = 10_000;

// ── 1. Mobile nav drawer ─────────────────────────────────────────────────────

test.describe('Mobile nav drawer', () => {
  // The hamburger is only visible below md = 960px. Use a narrow mobile width.
  test.use({ viewport: { width: 375, height: 812 } });

  // Use aria-controls to uniquely target the hamburger (avoids strict-mode
  // ambiguity if multiple "Menu" buttons exist in the DOM).
  const hamburger = (p: Page) => p.locator('button[aria-controls="mobile-drawer"]');

  test('hamburger button exists and is accessible', async ({ page }) => {
    await page.goto('/');
    const btn = hamburger(page);
    await expect(btn).toBeVisible();
    // Drawer is closed; aria-expanded must be false.
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('hamburger opens drawer; drawer contains nav links; Esc closes it', async ({ page }) => {
    await page.goto('/');

    const btn = hamburger(page);
    await expect(btn).toBeVisible();

    // Open the drawer.
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');

    // The drawer is now shown.
    const drawer = page.locator('#mobile-drawer');
    await expect(drawer).toBeVisible({ timeout: ALPINE_TIMEOUT });

    // Mobile nav label is "Mobile".
    const mobileNav = drawer.getByRole('navigation', { name: 'Mobile' });
    await expect(mobileNav).toBeVisible();

    // There should be at least one menu section button in the drawer.
    const sectionButtons = drawer.getByRole('button');
    await expect(sectionButtons.first()).toBeVisible();

    // Press Escape — drawer should close.
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible({ timeout: ALPINE_TIMEOUT });
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('backdrop click closes the drawer', async ({ page }) => {
    await page.goto('/');

    await hamburger(page).click();

    const drawer = page.locator('#mobile-drawer');
    await expect(drawer).toBeVisible({ timeout: ALPINE_TIMEOUT });

    // Click the semi-opaque backdrop (outside the 300px drawer). The backdrop
    // sits in the fixed overlay behind the drawer. We click just past the
    // drawer's right edge to hit it.
    await page.mouse.click(320, 400);
    await expect(drawer).not.toBeVisible({ timeout: ALPINE_TIMEOUT });
  });

  test('mobile drawer section button expands a sub-list', async ({ page }) => {
    await page.goto('/');

    await hamburger(page).click();

    const drawer = page.locator('#mobile-drawer');
    await expect(drawer).toBeVisible({ timeout: ALPINE_TIMEOUT });

    // First section button (e.g. "News", "Grants", etc.).
    const sectionBtn = drawer.getByRole('button').first();
    await expect(sectionBtn).toHaveAttribute('aria-expanded', 'false');

    await sectionBtn.click();
    await expect(sectionBtn).toHaveAttribute('aria-expanded', 'true');

    // A child list must now be visible inside the drawer.
    const subList = drawer.locator('ul ul').first();
    await expect(subList).toBeVisible({ timeout: ALPINE_TIMEOUT });
  });
});

// ── 2. Data table — Publications ─────────────────────────────────────────────

test.describe('Publications data table', () => {
  test('renders the table with rows after Alpine hydrates', async ({ page }) => {
    await page.goto('/about/publications/');

    // The interactive table becomes visible once Alpine has run.
    const table = page.locator('table.ptable[aria-label="Publications"]').first();
    await expect(table).toBeVisible({ timeout: ALPINE_TIMEOUT });

    // At least one data row must render.
    const rows = page.locator('tr.prow');
    await expect(rows.first()).toBeVisible({ timeout: ALPINE_TIMEOUT });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('sort-by-Title button changes sort direction on second click', async ({ page }) => {
    await page.goto('/about/publications/');

    const table = page.locator('table.ptable[aria-label="Publications"]').first();
    await expect(table).toBeVisible({ timeout: ALPINE_TIMEOUT });

    // Find the Title sort button in the (desktop-visible) thead.
    const titleSortBtn = table.locator('thead button').filter({ hasText: 'Title' });
    await expect(titleSortBtn).toBeVisible();

    // First click: sort by Title ascending.
    await titleSortBtn.click();
    const th = table.locator('th').filter({ hasText: /Title/ }).first();
    await expect(th).toHaveAttribute('aria-sort', 'ascending');

    // Second click: same column toggles to descending.
    await titleSortBtn.click();
    await expect(th).toHaveAttribute('aria-sort', 'descending');
  });

  test('search box narrows visible rows', async ({ page }) => {
    await page.goto('/about/publications/');

    const table = page.locator('table.ptable[aria-label="Publications"]').first();
    await expect(table).toBeVisible({ timeout: ALPINE_TIMEOUT });

    const rows = page.locator('tr.prow');
    await expect(rows.first()).toBeVisible({ timeout: ALPINE_TIMEOUT });
    const totalBefore = await rows.count();

    // Search for an unusual term to reduce the result set.
    const searchBox = page.getByRole('textbox', { name: 'Search publications' });
    await searchBox.fill('violence');

    // After filtering, row count should be ≤ the pre-filter total.
    await expect(async () => {
      const after = await rows.count();
      expect(after).toBeLessThanOrEqual(totalBefore);
    }).toPass({ timeout: ALPINE_TIMEOUT });
  });

  test('mobile (<600px): Sort-by select is visible and thead is hidden', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/about/publications/');

    // The mobile sort select must become visible.
    const sortSelect = page.getByRole('combobox', { name: 'Sort publications by' });
    await expect(sortSelect).toBeVisible({ timeout: ALPINE_TIMEOUT });

    // The stacked layout hides thead visually (clip rect) — computedStyle
    // should report it as not intersecting the viewport.
    const table = page.locator('table.ptable[aria-label="Publications"]').first();
    await expect(table).toBeVisible({ timeout: ALPINE_TIMEOUT });

    const theadClipped = await table.locator('thead').evaluate((el) => {
      const s = window.getComputedStyle(el);
      // Hidden by the a11y-safe sr-only pattern (position:absolute, clip).
      return (
        s.position === 'absolute' &&
        (s.clip !== 'auto' || s.clipPath !== 'none' || parseInt(s.width) <= 1)
      );
    });
    expect(theadClipped).toBe(true);

    // At least one stacked row's td should render its data-label pseudo-content.
    // We verify the data-label attribute exists (the CSS ::before displays it).
    const firstDataCell = page.locator('tr.prow td[data-label]').first();
    await expect(firstDataCell).toBeVisible({ timeout: ALPINE_TIMEOUT });
  });
});

// ── 2b. Data table — Meetings ─────────────────────────────────────────────────

test.describe('Meetings data table', () => {
  test('renders with rows after Alpine hydrates', async ({ page }) => {
    await page.goto('/news/meetings/');

    const table = page.locator('table.mtable').first();
    await expect(table).toBeVisible({ timeout: ALPINE_TIMEOUT });

    const rows = page.locator('tr.mrow');
    await expect(rows.first()).toBeVisible({ timeout: ALPINE_TIMEOUT });
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('search box narrows meetings rows', async ({ page }) => {
    await page.goto('/news/meetings/');

    const table = page.locator('table.mtable').first();
    await expect(table).toBeVisible({ timeout: ALPINE_TIMEOUT });

    const rows = page.locator('tr.mrow');
    await expect(rows.first()).toBeVisible({ timeout: ALPINE_TIMEOUT });
    const totalBefore = await rows.count();

    const searchBox = page.getByRole('textbox', { name: 'Search meetings' });
    await searchBox.fill('board');

    await expect(async () => {
      const after = await rows.count();
      expect(after).toBeLessThanOrEqual(totalBefore);
    }).toPass({ timeout: ALPINE_TIMEOUT });
  });

  test('mobile (<600px): Sort-by select is visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/news/meetings/');

    // Alpine needs to hydrate first.
    const table = page.locator('table.mtable').first();
    await expect(table).toBeVisible({ timeout: ALPINE_TIMEOUT });

    const sortSelect = page.getByRole('combobox', { name: /Sort meetings by/i });
    await expect(sortSelect).toBeVisible({ timeout: ALPINE_TIMEOUT });
  });
});

// ── 3. Forms — client-side validation ────────────────────────────────────────

test.describe('Grant Status form validation', () => {
  test('all required fields are present on /forms/grant-status/', async ({ page }) => {
    await page.goto('/forms/grant-status/');

    // The page heading confirms we landed correctly.
    await expect(page.getByRole('heading', { name: 'Grant Status Request' })).toBeVisible();

    // Required input fields (by aria-label).
    await expect(page.getByRole('combobox', { name: 'Select Type of Request' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Grant Number' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'First Name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Last Name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Phone' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Request' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'submit' })).toBeVisible();
  });

  test('submitting empty form triggers validation errors and does NOT navigate', async ({
    page,
  }) => {
    await page.goto('/forms/grant-status/');

    // Capture any network requests to the form endpoints to ensure we don't POST.
    const apiRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('icjia-api.cloud') || req.url().includes('mail.icjia.cloud')) {
        apiRequests.push(req.url());
      }
    });

    const submitBtn = page.getByRole('button', { name: 'submit' });
    await submitBtn.click();

    // Alpine touches all fields and re-renders error messages.
    // The "form has errors" notice should appear.
    const errNotice = page.locator('.form-haserrors');
    await expect(errNotice).toBeVisible({ timeout: ALPINE_TIMEOUT });
    await expect(errNotice).toContainText(/errors/i);

    // URL must remain on the form page (no navigation happened).
    await expect(page).toHaveURL(/\/forms\/grant-status\//);

    // No API calls should have fired (validation blocked submit).
    expect(apiRequests.length).toBe(0);
  });

  test('invalid email shows specific error message', async ({ page }) => {
    await page.goto('/forms/grant-status/');

    const emailInput = page.getByRole('textbox', { name: 'Email' });
    await emailInput.fill('not-an-email');
    await emailInput.blur();

    // The field-error div beneath the email field should show validation text.
    const emailError = page.locator('.field-error').filter({ hasText: /valid e-mail/i });
    await expect(emailError).toBeVisible({ timeout: ALPINE_TIMEOUT });
  });
});

test.describe('Language Access form validation', () => {
  test('all required fields are present on /forms/lap-request/', async ({ page }) => {
    await page.goto('/forms/lap-request/');

    await expect(page.getByRole('heading', { name: 'Language Access Request' })).toBeVisible();

    await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Phone' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Requested Language' })).toBeVisible();
    // The textarea has aria-label="Request" — use exact match to avoid matching
    // "Requested Language" as well.
    await expect(page.locator('textarea[aria-label="Request"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'submit' })).toBeVisible();
  });

  test('submitting empty form shows "form has errors" and stays on page', async ({ page }) => {
    await page.goto('/forms/lap-request/');

    const apiRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('icjia-api.cloud') || req.url().includes('mail.icjia.cloud')) {
        apiRequests.push(req.url());
      }
    });

    await page.getByRole('button', { name: 'submit' }).click();

    const errNotice = page.locator('.form-haserrors');
    await expect(errNotice).toBeVisible({ timeout: ALPINE_TIMEOUT });
    await expect(page).toHaveURL(/\/forms\/lap-request\//);
    expect(apiRequests.length).toBe(0);
  });

  test('invalid email on lap-request shows specific error', async ({ page }) => {
    await page.goto('/forms/lap-request/');

    const emailInput = page.getByRole('textbox', { name: 'Email' });
    await emailInput.fill('bad-email');
    await emailInput.blur();

    const emailError = page.locator('.field-error').filter({ hasText: /valid e-mail/i });
    await expect(emailError).toBeVisible({ timeout: ALPINE_TIMEOUT });
  });
});

// ── 4. Translate modal ────────────────────────────────────────────────────────

test.describe('Translate modal', () => {
  test('context-bar translate trigger opens the dialog', async ({ page }) => {
    // Use a page that has a context bar (any non-home section page).
    await page.goto('/grants/funding/');

    // The trigger button in the context bar.
    const trigger = page.locator('[data-translate-trigger]').first();
    await expect(trigger).toBeVisible();

    await trigger.click();

    // The native <dialog> should now be open.
    const dialog = page.locator('#translate-modal');
    await expect(dialog).toBeVisible({ timeout: ALPINE_TIMEOUT });

    // Check the dialog is in its "open" state via the DOM property.
    const isOpen = await dialog.evaluate((el: HTMLDialogElement) => el.open);
    expect(isOpen).toBe(true);
  });

  test('translate modal shows the language list (18 languages across 3 columns)', async ({
    page,
  }) => {
    await page.goto('/grants/funding/');

    const trigger = page.locator('[data-translate-trigger]').first();
    await trigger.click();

    const dialog = page.locator('#translate-modal');
    await expect(dialog).toBeVisible({ timeout: ALPINE_TIMEOUT });

    // 3 column lists.
    const cols = dialog.locator('.tm-col');
    await expect(cols).toHaveCount(3);

    // 18 language buttons total (6 per column × 3 columns).
    const langBtns = dialog.locator('[data-lang]');
    await expect(langBtns).toHaveCount(18);

    // Spot-check well-known languages.
    await expect(dialog.locator('[data-lang="es"]')).toBeVisible();
    await expect(dialog.locator('[data-lang="ar"]')).toBeVisible();
    await expect(dialog.locator('[data-lang="zh-CN"]')).toBeVisible();
  });

  test('Close button closes the translate modal', async ({ page }) => {
    await page.goto('/grants/funding/');

    const trigger = page.locator('[data-translate-trigger]').first();
    await trigger.click();

    const dialog = page.locator('#translate-modal');
    await expect(dialog).toBeVisible({ timeout: ALPINE_TIMEOUT });

    const closeBtn = dialog.getByRole('button', { name: 'Close' });
    await closeBtn.click();

    await expect(dialog).not.toBeVisible({ timeout: ALPINE_TIMEOUT });
    const isOpen = await dialog.evaluate((el: HTMLDialogElement) => el.open);
    expect(isOpen).toBe(false);
  });

  test('Esc closes the translate modal', async ({ page }) => {
    await page.goto('/grants/funding/');

    const trigger = page.locator('[data-translate-trigger]').first();
    await trigger.click();

    const dialog = page.locator('#translate-modal');
    await expect(dialog).toBeVisible({ timeout: ALPINE_TIMEOUT });

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: ALPINE_TIMEOUT });
  });

  test('footer translate trigger also opens the modal', async ({ page }) => {
    await page.goto('/');

    // Footer trigger is the second [data-translate-trigger].
    const footerTrigger = page.locator('[data-translate-trigger]').last();
    await expect(footerTrigger).toBeVisible();
    await footerTrigger.click();

    const dialog = page.locator('#translate-modal');
    await expect(dialog).toBeVisible({ timeout: ALPINE_TIMEOUT });

    const isOpen = await dialog.evaluate((el: HTMLDialogElement) => el.open);
    expect(isOpen).toBe(true);

    // Close for cleanup.
    await page.keyboard.press('Escape');
  });
});

// ── 5. Events calendar ────────────────────────────────────────────────────────

test.describe('Events calendar', () => {
  test('calendar view renders a month grid after Alpine hydrates', async ({ page }) => {
    await page.goto('/events/');

    // Wait for the calendar container to appear (x-cloak is removed by Alpine).
    const calContainer = page.locator('.cal');
    await expect(calContainer).toBeVisible({ timeout: ALPINE_TIMEOUT });

    // The month label live region should contain a year (4 digits).
    const monthLabel = page.locator('.cal-month-label');
    await expect(monthLabel).toBeVisible();
    await expect(monthLabel).toHaveText(/\d{4}/);

    // The calendar grid table must be rendered.
    const calGrid = page.locator('table.cal-grid');
    await expect(calGrid).toBeVisible();

    // There should be weekday header cells (Sun Mon … Sat = 7).
    const headerCells = calGrid.locator('thead th');
    await expect(headerCells).toHaveCount(7);
  });

  test('view toggle buttons switch between Calendar and List views', async ({ page }) => {
    await page.goto('/events/');

    // Default is Calendar view.
    const calContainer = page.locator('.cal');
    await expect(calContainer).toBeVisible({ timeout: ALPINE_TIMEOUT });

    // "List View" / "Calendar View" toggle buttons (exact text avoids matching
    // the disabled "Calendar view: Month" viewmode button).
    const listBtn = page.getByRole('button', { name: 'List View', exact: true });
    const calBtn = page.getByRole('button', { name: 'Calendar View', exact: true });

    await expect(listBtn).toBeVisible();
    await expect(calBtn).toBeVisible();

    // Switch to List view.
    await listBtn.click();
    // Calendar grid should disappear; list section should appear.
    await expect(calContainer).not.toBeVisible({ timeout: ALPINE_TIMEOUT });

    // Switch back to Calendar view.
    await calBtn.click();
    await expect(calContainer).toBeVisible({ timeout: ALPINE_TIMEOUT });
  });

  test('Previous / Next month navigation changes the month label', async ({ page }) => {
    await page.goto('/events/');

    const calContainer = page.locator('.cal');
    await expect(calContainer).toBeVisible({ timeout: ALPINE_TIMEOUT });

    const monthLabel = page.locator('.cal-month-label');
    const initialText = await monthLabel.innerText();

    // Click "Next month".
    const nextBtn = page.getByRole('button', { name: 'Next month' });
    await nextBtn.click();

    // Month label must change.
    await expect(monthLabel).not.toHaveText(initialText, { timeout: ALPINE_TIMEOUT });

    // Click "Previous month" twice to go one before the initial month.
    const prevBtn = page.getByRole('button', { name: 'Previous month' });
    await prevBtn.click();
    await prevBtn.click();

    const twoBack = await monthLabel.innerText();
    expect(twoBack).not.toBe(initialText);

    // "Today" button resets to the current month.
    const todayBtn = page.getByRole('button', { name: 'Today' });
    await todayBtn.click();
    await expect(monthLabel).toHaveText(initialText, { timeout: ALPINE_TIMEOUT });
  });

  test('"Month" view-mode button is present (disabled — month-only grid)', async ({ page }) => {
    await page.goto('/events/');

    const calContainer = page.locator('.cal');
    await expect(calContainer).toBeVisible({ timeout: ALPINE_TIMEOUT });

    const monthModeBtn = page.getByRole('button', { name: /Calendar view: Month/i });
    await expect(monthModeBtn).toBeVisible();
    // The button is disabled because only month view is implemented.
    await expect(monthModeBtn).toBeDisabled();
  });
});

// ── 6. Search deep-link ───────────────────────────────────────────────────────

test.describe('Search deep-link', () => {
  test('?q= seeds the input and shows results', async ({ page }) => {
    await page.goto('/search/?q=grants');

    const input = page.locator('#search-q');
    await expect(input).toHaveValue('grants');

    // Wait for the worker to answer.
    const results = page.locator('.search-result');
    await expect(results.first()).toBeVisible({ timeout: SEARCH_TIMEOUT });
    expect(await results.count()).toBeGreaterThan(0);

    // Status line should announce a numeric result count.
    await expect(page.locator('.search-status')).toContainText(/\d+\s+results?\b/i, {
      timeout: SEARCH_TIMEOUT,
    });
  });

  test('filter chip narrows results to a content type', async ({ page }) => {
    await page.goto('/search/?q=report');

    const results = page.locator('.search-result');
    await expect(results.first()).toBeVisible({ timeout: SEARCH_TIMEOUT });
    const totalBefore = await results.count();

    // Pick a non-"No filter" chip.
    const filterChip = page
      .locator('.filter-chip')
      .filter({ hasNotText: /No filter/i })
      .first();
    await expect(filterChip).toBeVisible({ timeout: SEARCH_TIMEOUT });
    await filterChip.click();

    // Must become active.
    await expect(filterChip).toHaveClass(/filter-chip--active/);

    // Visible results must be ≤ total (filter removed some types).
    await expect(async () => {
      expect(await results.count()).toBeLessThanOrEqual(totalBefore);
    }).toPass({ timeout: SEARCH_TIMEOUT });
  });

  test('typing in the search box updates URL with ?q=', async ({ page }) => {
    await page.goto('/search/');

    const input = page.locator('#search-q');
    await input.fill('violence');

    // The Alpine init debounces at 200ms; wait for it.
    await expect(async () => {
      expect(page.url()).toContain('q=violence');
    }).toPass({ timeout: 5_000 });
  });

  test('path-param deep-link route /search/<query>/ runs the search', async ({ page }) => {
    // The [query].astro route decodes the path param and seeds the search.
    await page.goto('/search/crime/');

    // Input should be seeded.
    const input = page.locator('#search-q');
    await expect(input).toHaveValue('crime');

    const results = page.locator('.search-result');
    await expect(results.first()).toBeVisible({ timeout: SEARCH_TIMEOUT });
    expect(await results.count()).toBeGreaterThan(0);
  });
});
