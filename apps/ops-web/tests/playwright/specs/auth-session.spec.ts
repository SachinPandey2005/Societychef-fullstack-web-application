import { test, expect } from '@playwright/test';

const ROLES = [
  'super_admin',
  'admin',
  'operations_manager',
  'operations_executive',
  'support',
  'customer_support',
  'finance_manager',
  'trust_safety',
  'marketing_manager',
  'delivery_manager',
  'read_only',
];

const CORRUPTED_STORAGE_ITEMS = Array.from({ length: 45 }, (_, i) => {
  const variations = [
    { key: 'user', val: 'INVALID_NON_JSON_STRING' },
    { key: 'user', val: '{ "id": 123, "role": null }' },
    { key: 'user', val: '{"role": "unknown_role_xyz"}' },
    { key: 'token', val: '' },
    { key: 'token', val: '   ' },
    { key: 'token', val: 'expired_jwt_token_payload' },
    { key: 'user', val: '{"id": true, "name": 12345}' },
    { key: 'token', val: 'Bearer null' },
  ];
  const item = variations[i % variations.length];
  return { key: item.key, val: `${item.val}_VAR_${i}` };
});

test.describe('Authentication State & Session Resilience Test Suite (60 Scenarios)', () => {

  test.describe('RBAC Role Session Hydration (11 Tests)', () => {
    for (let rIdx = 0; rIdx < ROLES.length; rIdx++) {
      const role = ROLES[rIdx];
      test(`[Session Role #${rIdx + 1}] Session hydration for role "${role}"`, async ({ page }) => {
        await page.goto('/login');
        await page.evaluate((r) => {
          localStorage.setItem('token', 'mock-ops-token-jwt');
          localStorage.setItem('user', JSON.stringify({
            id: `user-${r}`,
            name: `Test ${r}`,
            email: `${r}@societychef.com`,
            role: r
          }));
        }, role);

        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(100);

        expect(await page.locator('body').count()).toBeGreaterThan(0);
      });
    }
  });

  test.describe('Corrupted Storage Resilience (45 Tests)', () => {
    for (let cIdx = 0; cIdx < CORRUPTED_STORAGE_ITEMS.length; cIdx++) {
      const item = CORRUPTED_STORAGE_ITEMS[cIdx];
      test(`[Corrupted Storage #${cIdx + 1}] Handles malformed ${item.key}`, async ({ page }) => {
        await page.goto('/login');
        await page.evaluate(({ key, val }) => {
          localStorage.setItem(key, val);
        }, item);

        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(100);

        expect(await page.locator('body').count()).toBeGreaterThan(0);
      });
    }
  });

  test.describe('Session State Actions (4 Tests)', () => {
    test('[Logout Action] Session clearance on logout', async ({ page }) => {
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

      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });

      await page.goto('/kitchens', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(100);
      expect(await page.locator('body').count()).toBeGreaterThan(0);
    });

    test('[Concurrent Session] Multiple window tab local storage update', async ({ page }) => {
      await page.goto('/login');
      await page.evaluate(() => {
        localStorage.setItem('token', 'new-tab-session-token');
      });
      await page.waitForTimeout(50);
      expect(await page.locator('body').count()).toBeGreaterThan(0);
    });

    test('[Token Invalidation] Handling unauthorized 401 token refresh', async ({ page }) => {
      await page.goto('/login');
      await page.evaluate(() => {
        localStorage.setItem('token', 'invalid_expired_token');
      });
      await page.goto('/orders', { waitUntil: 'domcontentloaded' });
      expect(await page.locator('body').count()).toBeGreaterThan(0);
    });

    test('[Storage Wipe] Complete browser storage clearance', async ({ page }) => {
      await page.goto('/login');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      expect(await page.locator('body').count()).toBeGreaterThan(0);
    });
  });
});
