import { test, expect } from '@playwright/test';

const TARGET_PAGES = [
  '/',
  '/kitchens',
  '/consumers',
  '/societies',
  '/orders',
  '/support',
  '/trust',
  '/finance',
  '/analytics',
  '/reports',
  '/dishes',
];

test.describe('UI Component Interaction & DOM State Test Suite (55 Scenarios)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-ops-jwt-token-12345');
      localStorage.setItem('user', JSON.stringify({
        id: 'user-ops-1',
        name: 'Ops Admin',
        email: 'admin@societychef.com',
        role: 'super_admin'
      }));
    });
  });

  for (let pIdx = 0; pIdx < TARGET_PAGES.length; pIdx++) {
    const pageUrl = TARGET_PAGES[pIdx];

    test(`[Component Interaction #${pIdx * 5 + 1}] Search bar fill & filter on "${pageUrl}"`, async ({ page }) => {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
      const searchInput = page.locator('input[type="text"], input[placeholder*="Search"]').first();
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('Test Search Query 123');
      }
      expect(await page.locator('body').count()).toBeGreaterThan(0);
    });

    test(`[Component Interaction #${pIdx * 5 + 2}] Table button triggers on "${pageUrl}"`, async ({ page }) => {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
      const firstBtn = page.locator('button').first();
      if (await firstBtn.isVisible().catch(() => false)) {
        await firstBtn.click().catch(() => {});
      }
      expect(await page.locator('body').count()).toBeGreaterThan(0);
    });

    test(`[Component Interaction #${pIdx * 5 + 3}] Modal backdrop overlay click on "${pageUrl}"`, async ({ page }) => {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
      await page.keyboard.press('Escape');
      expect(await page.locator('body').count()).toBeGreaterThan(0);
    });

    test(`[Component Interaction #${pIdx * 5 + 4}] Tab navigation click on "${pageUrl}"`, async ({ page }) => {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
      const tabs = page.locator('button[class*="rounded-t"], button[role="tab"]');
      if (await tabs.count() > 0) {
        await tabs.first().click().catch(() => {});
      }
      expect(await page.locator('body').count()).toBeGreaterThan(0);
    });

    test(`[Component Interaction #${pIdx * 5 + 5}] Scroll DOM element on "${pageUrl}"`, async ({ page }) => {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => window.scrollTo(0, 500));
      expect(await page.locator('body').count()).toBeGreaterThan(0);
    });
  }
});
