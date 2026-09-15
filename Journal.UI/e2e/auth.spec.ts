import { test, expect } from '@playwright/test';
import { clearAuthSession } from './helpers';

test.describe('Authentication and Landing Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthSession(page);
  });

  test('displays app title and authentication options on login screen', async ({ page }) => {
    await page.goto('/');

    // Check title and branding
    await expect(page.getByText('Inside Journaling App')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Your mindful companion for emotional wellness')).toBeVisible();

    // Check login buttons
    await expect(page.getByText('Continue with Google')).toBeVisible();
    await expect(page.getByText('Continue with Microsoft')).toBeVisible();

    // Check footer links
    await expect(page.getByText('Terms of Service')).toBeVisible();
    await expect(page.getByText('Privacy Policy')).toBeVisible();
  });

  test('navigates to Terms of Service and back', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Terms of Service').click();
    await expect(page.getByText('Terms of Service').first()).toBeVisible();

    const backButton = page.getByText('Go Back');
    if (await backButton.isVisible()) {
      await backButton.click();
      await expect(page.getByText('Continue with Google')).toBeVisible();
    }
  });

  test('navigates to Privacy Policy and back', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Privacy Policy').click();
    await expect(page.getByText('Privacy Policy').first()).toBeVisible();

    const backButton = page.getByText('Go Back');
    if (await backButton.isVisible()) {
      await backButton.click();
      await expect(page.getByText('Continue with Google')).toBeVisible();
    }
  });
});
