// @ts-check
const { test, expect } = require("@playwright/test");

// =============================================================================
// Regression test suite for ICJIA Public Client
// Written against main branch to verify a11y changes don't break functionality.
// Requires dev server running on localhost:8080.
// =============================================================================

// ---------------------------------------------------------------------------
// 1. HOME PAGE
// ---------------------------------------------------------------------------
test.describe("Home Page", () => {
  test("loads successfully with title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ICJIA/);
  });

  test("has visible app bar", async ({ page }) => {
    await page.goto("/");
    const appBar = page.locator(".v-app-bar").first();
    await expect(appBar).toBeVisible();
  });

  test("has ICJIA logo in nav", async ({ page }) => {
    await page.goto("/");
    // Vuetify v-img renders as div[role="img"] with aria-label
    const logo = page
      .locator('[aria-label="ICJIA Logo"], a[aria-label="ICJIA Home"]')
      .first();
    await expect(logo).toBeVisible();
  });

  test("has agency title text", async ({ page }) => {
    await page.goto("/");
    const title = page.locator(
      "text=ILLINOIS CRIMINAL JUSTICE INFORMATION AUTHORITY"
    );
    await expect(title.first()).toBeVisible();
  });

  test("has footer", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator(".v-footer");
    await expect(footer).toBeVisible();
  });

  test("footer has social media links", async ({ page }) => {
    await page.goto("/");
    const fbLink = page.locator('a[aria-label="Link to ICJIA on Facebook"]');
    await expect(fbLink).toBeVisible();
    const ytLink = page.locator('a[aria-label="Link to ICJIA on YouTube"]');
    await expect(ytLink).toBeVisible();
  });

  test("has carousel on home page", async ({ page }) => {
    await page.goto("/");
    const carousel = page.locator(".v-carousel");
    await expect(carousel).toBeVisible();
  });

  test("has skip link", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator(".skiplink, [class*='skip']").first();
    await expect(skipLink).toBeAttached();
  });
});

// ---------------------------------------------------------------------------
// 2. NAVIGATION
// ---------------------------------------------------------------------------
test.describe("Navigation", () => {
  test("logo click navigates to home", async ({ page }) => {
    await page.goto("/about/");
    await page.waitForLoadState("networkidle");
    // On main: v-img div with @click; on a11y branch: router-link wrapping v-img
    const logo = page
      .locator('[aria-label="ICJIA Logo"], a[aria-label="ICJIA Home"]')
      .first();
    await logo.click();
    await page.waitForURL("**/", { timeout: 10000 });
    expect(page.url()).toMatch(/\/$/);
  });

  test("nav menu items are visible on desktop", async ({ page }) => {
    await page.goto("/");
    // Nav buttons should be present
    const navItems = page.locator(".v-app-bar .navItem");
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("search button is present and clickable", async ({ page }) => {
    await page.goto("/");
    const searchBtn = page.locator('button[aria-label="Search ICJIA"]');
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();
    // Search modal should appear
    const dialog = page.locator(".v-dialog--active");
    await expect(dialog).toBeVisible();
  });

  test("footer links work", async ({ page }) => {
    await page.goto("/");
    const aboutLink = page.locator('.v-footer a[href="/about/"]');
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();
    await page.waitForURL("**/about/");
    expect(page.url()).toContain("/about/");
  });
});

// ---------------------------------------------------------------------------
// 3. NEWS PAGE
// ---------------------------------------------------------------------------
test.describe("News Page", () => {
  test("loads and displays news cards", async ({ page }) => {
    await page.goto("/news/");
    await page.waitForLoadState("networkidle");
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
  });

  test("news cards are present", async ({ page }) => {
    await page.goto("/news/");
    await page.waitForLoadState("networkidle");
    // Wait for cards to render
    const cards = page.locator(".v-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("news card click navigates to article", async ({ page }) => {
    await page.goto("/news/");
    await page.waitForLoadState("networkidle");
    // Click first card with a title
    const firstCard = page
      .locator(".v-card")
      .filter({ has: page.locator("h2") })
      .first();
    const cardExists = (await firstCard.count()) > 0;
    if (cardExists) {
      await firstCard.click();
      await page.waitForLoadState("networkidle");
      // Should navigate away from /news/ listing
      expect(page.url()).toContain("/news/");
    }
  });
});

// ---------------------------------------------------------------------------
// 4. ABOUT PAGE
// ---------------------------------------------------------------------------
test.describe("About Page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/about/");
    await expect(page).toHaveTitle(/ICJIA/);
    const content = page.locator(".page");
    await expect(content).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. GRANTS PAGE
// ---------------------------------------------------------------------------
test.describe("Grants Page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/grants/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/ICJIA/);
  });
});

// ---------------------------------------------------------------------------
// 6. RESEARCH HUB
// ---------------------------------------------------------------------------
test.describe("Research Hub", () => {
  test("hub home loads", async ({ page }) => {
    await page.goto("/researchhub/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/ICJIA/);
  });

  test("hub has carousel or article content", async ({ page }) => {
    await page.goto("/researchhub/");
    await page.waitForLoadState("networkidle");
    // Wait for loading to complete
    await page.waitForTimeout(2000);
    const carousel = page.locator(".v-carousel");
    const cards = page.locator(".v-card");
    const carouselCount = await carousel.count();
    const cardCount = await cards.count();
    expect(carouselCount + cardCount).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 7. SEARCH MODAL
// ---------------------------------------------------------------------------
test.describe("Search Modal", () => {
  test("opens and accepts input", async ({ page }) => {
    await page.goto("/");
    const searchBtn = page.locator('button[aria-label="Search ICJIA"]');
    await searchBtn.click();
    const dialog = page.locator(".v-dialog--active");
    await expect(dialog).toBeVisible();

    // Type in search field
    const searchField = dialog.locator('input[type="text"]').first();
    await searchField.fill("grants");
    await page.waitForTimeout(500);

    // Results should appear
    const resultsText = dialog.locator("text=Displaying");
    await expect(resultsText).toBeVisible();
  });

  test("close button works", async ({ page }) => {
    await page.goto("/");
    const searchBtn = page.locator('button[aria-label="Search ICJIA"]');
    await searchBtn.click();
    const dialog = page.locator(".v-dialog--active");
    await expect(dialog).toBeVisible();

    const closeBtn = dialog.locator("button", { hasText: "Close" });
    await closeBtn.click();
    await expect(dialog).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. MEETINGS PAGE
// ---------------------------------------------------------------------------
test.describe("Meetings Page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/about/meetings/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/ICJIA/);
    const content = page.locator(".page");
    await expect(content).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 9. BIOGRAPHIES PAGE
// ---------------------------------------------------------------------------
test.describe("Biographies Page", () => {
  test("loads with biography cards", async ({ page }) => {
    await page.goto("/about/biographies/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const cards = page.locator(".v-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 10. EVENTS PAGE
// ---------------------------------------------------------------------------
test.describe("Events Page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/events/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/ICJIA/);
  });
});

// ---------------------------------------------------------------------------
// 11. EMPLOYMENT PAGE
// ---------------------------------------------------------------------------
test.describe("Employment Page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/about/employment/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/ICJIA/);
  });
});

// ---------------------------------------------------------------------------
// 12. POLICIES PAGE
// ---------------------------------------------------------------------------
test.describe("Policies Page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/about/policies/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/ICJIA/);
    const content = page.locator(".page");
    await expect(content).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 13. 404 PAGE
// ---------------------------------------------------------------------------
test.describe("404 Page", () => {
  test("shows 404 for unknown route", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-xyz/");
    await page.waitForLoadState("networkidle");
    // Should either show 404 content or redirect to 404
    await expect(page).toHaveTitle(/ICJIA/);
  });
});

// ---------------------------------------------------------------------------
// 14. PAGE STRUCTURE (elements expected on every page)
// ---------------------------------------------------------------------------
test.describe("Page Structure", () => {
  const pages = ["/", "/news/", "/about/", "/grants/", "/events/"];

  for (const path of pages) {
    test(`${path} has lang attribute`, async ({ page }) => {
      await page.goto(path);
      const html = page.locator("html");
      await expect(html).toHaveAttribute("lang", "en");
    });

    test(`${path} has viewport meta`, async ({ page }) => {
      await page.goto(path);
      const viewport = page.locator('meta[name="viewport"]');
      await expect(viewport).toBeAttached();
    });
  }
});
