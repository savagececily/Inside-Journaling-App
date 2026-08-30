import type { User } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Easy Auth Service - handles Azure App Service Authentication
 * When Easy Auth is enabled, the user is already authenticated at the platform level
 * This service checks if the user is authenticated and gets their information
 */
export const easyAuthService = {
    /**
     * Check if the user is authenticated via Easy Auth and get their profile
     * This endpoint will return user information if authenticated, or 401 if not
     */
    async checkAuthentication(): Promise<{ authenticated: boolean; user?: User }> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/easyauth/me`, {
                credentials: 'include', // Important: Include cookies for Easy Auth
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const user = await response.json();
                return { authenticated: true, user };
            } else if (response.status === 401 || response.status === 403) {
                // User is not authenticated
                return { authenticated: false };
            } else {
                console.error('Easy Auth check failed:', response.status, response.statusText);
                return { authenticated: false };
            }
        } catch (error) {
            console.error('Easy Auth check error:', error);
            return { authenticated: false };
        }
    },

    /**
     * Check if Easy Auth is enabled on the server
     * This helps determine if we should use Easy Auth or traditional OAuth
     */
    async isEasyAuthEnabled(): Promise<boolean> {
        try {
            // Try to access a protected endpoint without authentication
            // Easy Auth will redirect to login, traditional auth will return 401
            const response = await fetch(`${API_BASE_URL}/api/auth/easyauth/me`, {
                credentials: 'include',
                redirect: 'manual', // Don't follow redirects
            });

            // If we get a redirect (302/301), Easy Auth is enabled
            // If we get 401, traditional auth is being used
            return response.type === 'opaqueredirect' || response.status === 302 || response.status === 301;
        } catch (error) {
            console.error('Easy Auth detection error:', error);
            return false;
        }
    },

    /**
     * Logout from Easy Auth
     * Redirects to the Easy Auth logout endpoint
     */
    logout(): void {
        // Easy Auth logout endpoint
        window.location.href = `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
    }
};
