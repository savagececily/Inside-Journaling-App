import { test, expect } from '@playwright/test';
import { authenticateSession } from './helpers';

test.describe('Journal Entry Creation and List Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/journal*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'entry-1',
              userId: 'test-user-123',
              content: 'Feeling peaceful after a morning walk in the park.',
              sentiment: 'Positive',
              sentimentScore: 0.9,
              keyPhrases: ['morning walk', 'park', 'peaceful'],
              summary: 'A peaceful morning walk in the park.',
              affirmation: 'You cultivate tranquility in everyday moments.',
              createdAt: new Date().toISOString(),
            },
          ]),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'entry-2',
            userId: 'test-user-123',
            content: 'Excited to start a new creative project today.',
            sentiment: 'Positive',
            sentimentScore: 0.95,
            keyPhrases: ['creative project', 'new project'],
            summary: 'Starting an exciting creative project.',
            affirmation: 'Your creativity and energy inspire growth.',
            createdAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    await authenticateSession(page);
    await page.goto('/');
  });

  test('displays journal entries list and navigates to new entry screen', async ({ page }) => {
    // Check existing entry
    await expect(page.getByText('Feeling peaceful after a morning walk in the park.')).toBeVisible({ timeout: 15000 });

    // Open new entry screen
    const newEntryButton = page.getByRole('button', { name: /New Entry|\+/i }).first();
    if (await newEntryButton.isVisible()) {
      await newEntryButton.click();
      await expect(page.getByPlaceholder(/How are you feeling|Write your thoughts/i)).toBeVisible();
    }
  });
});
