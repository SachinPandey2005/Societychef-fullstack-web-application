// auth.fixture.ts
import { test as base, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

export const test = base.extend<{
  loginPage: LoginPage;
}>({
  loginPage: async ({ page }, use) => {
    const login = new LoginPage(page as Page);
    await use(login);
  },
});

export { expect };
