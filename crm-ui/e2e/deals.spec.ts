import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

const ALL_STAGES = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED WON', 'CLOSED LOST'];

test.describe('Deals — Kanban board', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
  });

  test('renders the Pipeline heading and New Deal button', async ({ page }) => {
    await expect(page.locator('h1, .board-page__title')).toContainText('Pipeline');
    await expect(page.locator('button', { hasText: 'New Deal' })).toBeVisible();
  });

  test('all 6 pipeline stage columns are present in the DOM', async ({ page }) => {
    for (const stage of ALL_STAGES) {
      await expect(page.locator('.board__stage-name', { hasText: stage })).toHaveCount(1);
    }
  });

  test('board columns container is horizontally scrollable', async ({ page }) => {
    const dims = await page.evaluate(() => {
      const el = document.querySelector('.board__columns');
      if (!el) return null;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });
    expect(dims).not.toBeNull();
    // 6 columns × 280px + gaps ≈ 1760px > any typical viewport content width
    expect(dims!.scrollWidth).toBeGreaterThan(dims!.clientWidth);
  });

  test('Closed Won and Closed Lost are visible after scrolling right', async ({ page }) => {
    await page.evaluate(() => {
      const el = document.querySelector('.board__columns');
      if (el) el.scrollLeft = el.scrollWidth;
    });
    await page.waitForTimeout(200);

    await expect(page.locator('.board__stage-name', { hasText: 'CLOSED WON' })).toBeInViewport();
    await expect(page.locator('.board__stage-name', { hasText: 'CLOSED LOST' })).toBeInViewport();
  });

  test('Lead and Qualified are visible at initial load (no scroll)', async ({ page }) => {
    await expect(page.locator('.board__stage-name', { hasText: 'LEAD' })).toBeInViewport();
    await expect(page.locator('.board__stage-name', { hasText: 'QUALIFIED' })).toBeInViewport();
  });

  test('each column shows a deal count badge', async ({ page }) => {
    const stageMetas = page.locator('.board__stage-meta');
    await expect(stageMetas).toHaveCount(6);
  });
});
