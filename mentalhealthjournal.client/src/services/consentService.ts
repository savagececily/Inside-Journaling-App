const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface ConsentStatus {
    consentType: string;
    hasConsent: boolean;
    version?: string;
    grantedAt?: string;
}

export interface ConsentHistory {
    id: string;
    userId: string;
    consentType: string;
    version: string;
    granted: boolean;
    grantedAt: string;
    revokedAt?: string;
    ipAddress?: string;
    userAgent?: string;
}

export const consentService = {
    /**
     * Record a user consent (Terms, Privacy Policy, AI Processing)
     */
    async recordConsent(
        token: string,
        consentType: string,
        version: string,
        granted: boolean
    ): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/Consent/record`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ consentType, version, granted }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to record consent: ${error}`);
        }
    },

    /**
     * Get consent status for all types
     */
    async getConsentStatus(token: string): Promise<ConsentStatus[]> {
        const response = await fetch(`${API_BASE_URL}/Consent/status`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get consent status');
        }

        return response.json();
    },

    /**
     * Get consent history for the user
     */
    async getConsentHistory(token: string): Promise<ConsentHistory[]> {
        const response = await fetch(`${API_BASE_URL}/Consent/history`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get consent history');
        }

        return response.json();
    },

    /**
     * Revoke a specific consent
     */
    async revokeConsent(token: string, consentType: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/Consent/revoke`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ consentType }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to revoke consent: ${error}`);
        }
    },

    /**
     * Get current consent versions
     */
    async getConsentVersions(token: string): Promise<{ [key: string]: string }> {
        const response = await fetch(`${API_BASE_URL}/Consent/versions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get consent versions');
        }

        return response.json();
    },
};
