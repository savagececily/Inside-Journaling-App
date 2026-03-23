import type { AuthResponse } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const authService = {
    async loginWithGoogle(idToken: string, dateOfBirth?: string): Promise<AuthResponse> {
        const body: any = { idToken };
        if (dateOfBirth) {
            body.dateOfBirth = dateOfBirth;
        }
        else{
            console.log('⚠️ No date of birth provided for age verification');
        }

        const response = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Authentication failed: ${error}`);
        }

        return response.json();
    },

    async verifyAge(token: string, dateOfBirth: string): Promise<{ message: string; age: number; ageVerified: boolean }> {
        const response = await fetch(`${API_BASE_URL}/auth/verify-age`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ dateOfBirth }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Age verification failed');
        }

        return response.json();
    },

    async getCurrentUser(token: string) {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get current user');
        }

        return response.json();
    },

    async updateUsername(token: string, username: string) {
        const response = await fetch(`${API_BASE_URL}/auth/username`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ username }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to update username');
        }

        return response.json();
    },

    async checkUsernameAvailability(token: string, username: string): Promise<boolean> {
        const response = await fetch(`${API_BASE_URL}/auth/username/check?username=${encodeURIComponent(username)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.available;
    }
};
