// login.page.ts
import { Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Navigate to the login page */
  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  /** Perform login with given credentials */
  async login(username: string, password: string): Promise<void> {
    await this.page.fill('input[name="username"]', username);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}
