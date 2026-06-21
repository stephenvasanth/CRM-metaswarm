import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Contacts — form', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/contacts/new');
    await page.waitForLoadState('networkidle');
  });

  test('shows separate First Name and Last Name fields', async ({ page }) => {
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#lastName')).toBeVisible();
    await expect(page.locator('label[for="firstName"]')).toContainText('First Name');
    await expect(page.locator('label[for="lastName"]')).toContainText('Last Name');
  });

  test('First Name and Last Name are displayed side by side', async ({ page }) => {
    const firstBox = await page.locator('#firstName').boundingBox();
    const lastBox  = await page.locator('#lastName').boundingBox();
    expect(firstBox).not.toBeNull();
    expect(lastBox).not.toBeNull();
    // Same row: Y coordinates differ by less than 5px
    expect(Math.abs(firstBox!.y - lastBox!.y)).toBeLessThan(5);
    // Last Name is to the right of First Name
    expect(lastBox!.x).toBeGreaterThan(firstBox!.x + firstBox!.width - 10);
  });

  test('First Name is marked required, Last Name is not', async ({ page }) => {
    const firstLabel = page.locator('label[for="firstName"]');
    const lastLabel  = page.locator('label[for="lastName"]');
    // Required asterisk present on First Name
    await expect(firstLabel.locator('.form-field__required')).toBeVisible();
    // No required asterisk on Last Name
    await expect(lastLabel.locator('.form-field__required')).toHaveCount(0);
  });

  test('shows "First name is required." validation error on empty submit', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('.form-field__error').first()).toContainText('First name is required.');
  });

  test('accepts contact with First Name only (no Last Name)', async ({ page }) => {
    await page.fill('#firstName', 'Solo');
    await page.fill('#email', 'solo@example.com');
    // form should be valid — no error on blur
    await page.locator('#firstName').blur();
    await expect(page.locator('text=First name is required.')).toHaveCount(0);
  });

  test('no single "Full name" field exists', async ({ page }) => {
    // Old single name field should be gone
    await expect(page.locator('#name')).toHaveCount(0);
    await expect(page.locator('label[for="name"]')).toHaveCount(0);
  });
});

test.describe('Contacts — list', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('shows contacts list page', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.contacts-page__title')).toContainText('Contacts');
    await expect(page.locator('button', { hasText: 'New Contact' })).toBeVisible();
  });
});
