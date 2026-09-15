import { Page } from '@playwright/test';

export const TEST_USER = {
  id: 'test-user-123',
  userId: 'test-user-123',
  username: 'testuser',
  email: 'testuser@example.com',
  createdAt: new Date().toISOString(),
};

export const TEST_TOKEN = 'mock-jwt-test-token';

/**
 * Sets up an authenticated session in localStorage for the Expo web client.
 */
export async function authenticateSession(page: Page) {
  await page.addInitScript(({ token, user }) => {
    window.localStorage.setItem('auth_token', token);
    window.localStorage.setItem('user_data', JSON.stringify(user));
  }, { token: TEST_TOKEN, user: TEST_USER });
}

/**
 * Clears authentication state in localStorage.
 */
export async function clearAuthSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem('auth_token');
    window.localStorage.removeItem('user_data');
  });
}
