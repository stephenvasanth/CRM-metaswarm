import { Page } from '@playwright/test';

export async function login(page: Page, email = 'admin@crm.local', password = 'Admin1234!'): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}
