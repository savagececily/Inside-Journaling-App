import { test, expect } from '@playwright/test';
import { authenticateSession } from './helpers';

test.describe('Virtual Support Companion Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/chat/sessions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'session-1',
            userId: 'test-user-123',
            title: 'Reflecting on work stress',
            messages: [
              {
                role: 'user',
                content: 'I felt overwhelmed at work today.',
                timestamp: new Date().toISOString(),
              },
              {
                role: 'assistant',
                content: 'It sounds like today was demanding. What was the most challenging part?',
                timestamp: new Date().toISOString(),
              },
            ],
            createdAt: new Date().toISOString(),
            lastMessageAt: new Date().toISOString(),
            isActive: true,
          },
        ]),
      });
    });

    await page.route('**/chat/message*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'session-1',
          message: 'Taking short breaks throughout the day can help manage that stress.',
          timestamp: new Date().toISOString(),
          isCrisisDetected: false,
        }),
      });
    });

    await authenticateSession(page);
    await page.goto('/');

    const supportTab = page.getByRole('tab', { name: /Support/i });
    await supportTab.click();
  });

  test('opens support companion and displays conversations drawer', async ({ page }) => {
    // Check conversation header buttons
    await expect(page.getByText('Conversations')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('New')).toBeVisible();

    // Toggle conversations drawer
    await page.getByText('Conversations').click();
    await expect(page.getByText('Saved Conversations')).toBeVisible();
    await expect(page.getByText('Reflecting on work stress')).toBeVisible();
  });

  test('can type and send a message to companion', async ({ page }) => {
    const input = page.getByPlaceholder(/Share your thoughts or ask a question/i);
    await expect(input).toBeVisible({ timeout: 15000 });

    await input.fill('How can I practice mindful breathing during meetings?');
    await page.getByLabel('Send message').click();

    await expect(page.getByText('How can I practice mindful breathing during meetings?')).toBeVisible();
  });
});
