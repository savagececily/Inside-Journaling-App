import { test, expect } from '@playwright/test';
import { authenticateSession } from './helpers';

test.describe('Profile and Subscription Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/user/quota*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tier: 'free',
          isPremium: false,
          isPro: false,
          usage: {
            entries: { used: 4, limit: 10, remaining: 6, percentUsed: 40 },
            voice: { used: 2, limit: 5, remaining: 3, percentUsed: 40 },
            chat: { used: 8, limit: 25, remaining: 17, percentUsed: 32 },
          },
          resetDate: new Date(Date.now() + 86400000 * 15).toISOString(),
        }),
      });
    });

    await page.route('**/user/upgrade*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          checkoutUrl: 'https://checkout.stripe.com/test-session',
        }),
      });
    });

    await authenticateSession(page);
    await page.goto('/');

    const profileTab = page.getByRole('tab', { name: /Profile/i });
    await profileTab.click();
  });

  test('displays user quotas and opens upgrade modal with plan tiers', async ({ page }) => {
    await expect(page.getByText('Monthly Plan & Quotas')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('AI Entry Analysis')).toBeVisible();
    await expect(page.getByText('Voice Entries')).toBeVisible();
    await expect(page.getByText('Virtual Support Messages')).toBeVisible();

    // Open upgrade modal
    const upgradeButton = page.getByText('Upgrade Plan');
    await upgradeButton.click();

    // Verify modal headers and tiers
    await expect(page.getByText('Upgrade Subscription')).toBeVisible();
    await expect(page.getByText('Premium')).toBeVisible();
    await expect(page.getByText('Pro Companion')).toBeVisible();
    await expect(page.getByText('$4.99')).toBeVisible();
    await expect(page.getByText('$9.99')).toBeVisible();

    // Close modal
    await page.getByLabel('Close upgrade modal').click();
    await expect(page.getByText('Upgrade Subscription')).not.toBeVisible();
  });
});
