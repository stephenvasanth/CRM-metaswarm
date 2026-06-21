import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Authentication', () => {
  test('shows login form at /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/contacts');
    await expect(page).toHaveURL(/\/login/);
  });

  test('logs in with valid credentials and navigates to dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('.dashboard__title')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);
  });

  test('logout navigates to /login immediately', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.locator('text=Sign Out').click();

    // Must land on /login without clicking another tab (previous bug: nothing happened on logout)
    await expect(page).toHaveURL(/\/login/, { timeout: 3000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('cannot access protected page after logout', async ({ page }) => {
    await login(page);
    await page.locator('text=Sign Out').click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/contacts');
    await expect(page).toHaveURL(/\/login/);
  });
});
