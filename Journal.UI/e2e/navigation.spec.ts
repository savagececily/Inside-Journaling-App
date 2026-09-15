import { test, expect } from '@playwright/test';
import { authenticateSession } from './helpers';

test.describe('Main Tab Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept backend API requests with mock data
    await page.route('**/journal*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/chat/sessions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/user/quota*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tier: 'free',
          isPremium: false,
          isPro: false,
          usage: {
            entries: { used: 3, limit: 10, remaining: 7, percentUsed: 30 },
            voice: { used: 1, limit: 5, remaining: 4, percentUsed: 20 },
            chat: { used: 5, limit: 25, remaining: 20, percentUsed: 20 },
          },
          resetDate: new Date(Date.now() + 86400000 * 15).toISOString(),
        }),
      });
    });

    await authenticateSession(page);
    await page.goto('/');
  });

  test('renders all 4 main tabs and switches between them', async ({ page }) => {
    // Verify tabs exist
    const journalTab = page.getByRole('tab', { name: /Journal/i });
    const insightsTab = page.getByRole('tab', { name: /Insights/i });
    const supportTab = page.getByRole('tab', { name: /Support/i });
    const profileTab = page.getByRole('tab', { name: /Profile/i });

    await expect(journalTab).toBeVisible({ timeout: 15000 });
    await expect(insightsTab).toBeVisible();
    await expect(supportTab).toBeVisible();
    await expect(profileTab).toBeVisible();

    // Navigate to Insights
    await insightsTab.click();
    await expect(page.getByText(/Insights/i).first()).toBeVisible();

    // Navigate to Virtual Support
    await supportTab.click();
    await expect(page.getByText(/Virtual Support/i).first()).toBeVisible();

    // Navigate to Profile
    await profileTab.click();
    await expect(page.getByText('Monthly Plan & Quotas')).toBeVisible();

    // Navigate back to Journal
    await journalTab.click();
    await expect(page.getByText(/New Entry|Journal/i).first()).toBeVisible();
  });
});
