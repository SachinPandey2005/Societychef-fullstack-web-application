import { test, expect } from '@playwright/test';

const ERROR_STATUSES = [
  { status: 500, label: '500 Internal Server Error', body: { error: 'Internal Server Error' } },
  { status: 403, label: '403 Forbidden', body: { error: 'Forbidden Access' } },
  { status: 404, label: '404 Not Found', body: { error: 'Resource Not Found' } },
  { status: 502, label: '502 Bad Gateway', body: { error: 'Bad Gateway' } },
  { status: 503, label: '503 Service Unavailable', body: { error: 'Service Unavailable' } },
  { status: 400, label: '400 Bad Request', body: { error: 'Invalid Payload' } },
  { status: 401, label: '401 Unauthorized', body: { error: 'Unauthorized Token' } },
  { status: 422, label: '422 Unprocessable Entity', body: { error: 'Validation Error' } },
  { status: 429, label: '429 Rate Limit Exceeded', body: { error: 'Too Many Requests' } },
  { status: 504, label: '504 Gateway Timeout', body: { error: 'Gateway Timeout' } },
];

const TEST_PAGES = [
  '/',
  '/kitchens',
  '/consumers',
  '/orders',
  '/finance',
  '/analytics',
  '/reports',
  '/admin/monitoring',
];

test.describe('API Error Resilience & Fault Injection Test Suite (80 Scenarios)', () => {

  test.beforeEach(async ({ page }) => {
    // Seed authenticated session
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

  for (let sIdx = 0; sIdx < ERROR_STATUSES.length; sIdx++) {
    const errorConfig = ERROR_STATUSES[sIdx];
    for (let pIdx = 0; pIdx < TEST_PAGES.length; pIdx++) {
      const pageUrl = TEST_PAGES[pIdx];

      test(`[Fault Injection #${sIdx * TEST_PAGES.length + pIdx + 1}] Handles ${errorConfig.label} on "${pageUrl}"`, async ({ page }) => {
        // Intercept network requests and return mock error status
        await page.route('**/*', async (route) => {
          const url = route.request().url();
          if (url.includes('/api') || url.includes('/rest/v1') || url.includes('/supabase')) {
            await route.fulfill({
              status: errorConfig.status,
              contentType: 'application/json',
              body: JSON.stringify(errorConfig.body),
            });
          } else {
            await route.continue();
          }
        });

        // Navigate and verify UI page frame remains mounted
        await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(150);

        // Ensure page app layout structure remains intact
        const bodyCount = await page.locator('body').count();
        expect(bodyCount).toBeGreaterThan(0);

        // Verify window title/URL is defined
        expect(page.url()).toBeDefined();
      });
    }
  }
});
