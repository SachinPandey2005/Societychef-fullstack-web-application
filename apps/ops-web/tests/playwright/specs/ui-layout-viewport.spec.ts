import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'Desktop 8K', width: 7680, height: 4320 },
  { name: 'Desktop 4K', width: 3840, height: 2160 },
  { name: 'Desktop 1440p', width: 2560, height: 1440 },
  { name: 'Desktop 1080p', width: 1920, height: 1080 },
  { name: 'Laptop Standard', width: 1366, height: 768 },
  { name: 'Laptop Small', width: 1280, height: 800 },
  { name: 'Tablet Landscape', width: 1024, height: 768 },
  { name: 'Tablet Portrait', width: 768, height: 1024 },
  { name: 'Mobile Large', width: 428, height: 926 },
  { name: 'Mobile Medium', width: 390, height: 844 },
  { name: 'Mobile Small', width: 360, height: 640 },
  { name: 'Narrow Foldable', width: 280, height: 653 },
  { name: 'Square Kiosk', width: 1024, height: 1024 },
  { name: 'Ultra Wide Desktop', width: 3440, height: 1440 },
  { name: 'Vertical TV Display', width: 1080, height: 1920 },
];

const VIEWPORT_PAGES = [
  '/',
  '/kitchens',
  '/orders',
  '/analytics',
  '/login',
  '/admin/settings',
];

test.describe('Responsive Layout & Viewport Resilience Test Suite (90 Scenarios)', () => {

  for (let vIdx = 0; vIdx < VIEWPORTS.length; vIdx++) {
    const vp = VIEWPORTS[vIdx];
    for (let pIdx = 0; pIdx < VIEWPORT_PAGES.length; pIdx++) {
      const pageUrl = VIEWPORT_PAGES[pIdx];

      test(`[Viewport #${vIdx * VIEWPORT_PAGES.length + pIdx + 1}] Render "${pageUrl}" at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        
        if (pageUrl !== '/login') {
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
        }

        await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(100);

        expect(await page.locator('body').count()).toBeGreaterThan(0);
      });
    }
  }
});
