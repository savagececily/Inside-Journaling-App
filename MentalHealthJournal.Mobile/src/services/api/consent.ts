// Consent Service - Handles user consent recording and status checking
import apiClient from './client';

export interface ConsentStatusResponse {
  termsOfService: {
    required: boolean;
    version: string;
    granted: boolean;
  };
  privacyPolicy: {
    required: boolean;
    version: string;
    granted: boolean;
  };
  aiProcessing: {
    required: boolean;
    version: string;
    granted: boolean;
  };
  allGranted: boolean;
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

export interface ConsentVersions {
  termsOfService: string;
  privacyPolicy: string;
  aiProcessing: string;
}

/**
 * Record a user consent (Terms, Privacy Policy, AI Processing)
 */
export async function recordConsent(
  consentType: string,
  version: string,
  granted: boolean
): Promise<void> {
  await apiClient.post('/Consent/record', {
    consentType,
    version,
    granted,
  });
}

/**
 * Get consent status for all types
 * Returns an object containing consent status for termsOfService, privacyPolicy, and aiProcessing,
 * along with an allGranted flag indicating if all required consents have been granted
 */
export async function getConsentStatus(): Promise<ConsentStatusResponse> {
  const response = await apiClient.get<ConsentStatusResponse>('/Consent/status');
  return response.data;
}

/**
 * Get consent history for the user
 */
export async function getConsentHistory(): Promise<ConsentHistory[]> {
  const response = await apiClient.get<ConsentHistory[]>('/Consent/history');
  return response.data;
}

/**
 * Get consent versions from backend
 */
export async function getConsentVersions(): Promise<ConsentVersions> {
  const response = await apiClient.get<ConsentVersions>('/Consent/versions');
  return response.data;
}

/**
 * Revoke a specific consent type
 */
export async function revokeConsent(consentType: string): Promise<void> {
  await apiClient.post('/Consent/revoke', { consentType });
}
