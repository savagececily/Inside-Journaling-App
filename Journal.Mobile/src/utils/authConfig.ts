// Auth Configuration Validator
// This utility checks if auth providers are properly configured
import {
  GOOGLE_CLIENT_ID_IOS,
  GOOGLE_CLIENT_ID_ANDROID,
  GOOGLE_CLIENT_ID_WEB,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_TENANT_ID,
} from './constants';
import { Platform } from 'react-native';

export interface AuthProviderConfig {
  isConfigured: boolean;
  provider: 'google' | 'microsoft';
  reason?: string;
}

/**
 * Check if Google OAuth is properly configured
 * @returns {AuthProviderConfig} Configuration status
 */
export function isGoogleConfigured(): AuthProviderConfig {
  const webConfigured = GOOGLE_CLIENT_ID_WEB && 
    !GOOGLE_CLIENT_ID_WEB.startsWith('YOUR_') && 
    GOOGLE_CLIENT_ID_WEB.includes('.apps.googleusercontent.com');
  
  const iosConfigured = GOOGLE_CLIENT_ID_IOS && 
    !GOOGLE_CLIENT_ID_IOS.startsWith('YOUR_') && 
    GOOGLE_CLIENT_ID_IOS.includes('.apps.googleusercontent.com');
  
  const androidConfigured = GOOGLE_CLIENT_ID_ANDROID && 
    !GOOGLE_CLIENT_ID_ANDROID.startsWith('YOUR_') && 
    GOOGLE_CLIENT_ID_ANDROID.includes('.apps.googleusercontent.com');

  // For Expo Go and web, we primarily need web client ID
  // For production builds, we need the platform-specific IDs
  const isConfigured = webConfigured || 
    (Platform.OS === 'ios' && iosConfigured) || 
    (Platform.OS === 'android' && androidConfigured);

  let reason: string | undefined;
  if (!isConfigured) {
    if (!webConfigured && Platform.OS === 'web') {
      reason = 'Web client ID not configured';
    } else if (!iosConfigured && Platform.OS === 'ios') {
      reason = 'iOS client ID not configured (using web as fallback)';
    } else if (!androidConfigured && Platform.OS === 'android') {
      reason = 'Android client ID not configured (using web as fallback)';
    } else {
      reason = 'Google OAuth credentials not configured';
    }
  }

  return {
    isConfigured,
    provider: 'google',
    reason,
  };
}

/**
 * Check if Microsoft OAuth is properly configured
 * @returns {AuthProviderConfig} Configuration status
 */
export function isMicrosoftConfigured(): AuthProviderConfig {
  const clientIdConfigured = MICROSOFT_CLIENT_ID && 
    !MICROSOFT_CLIENT_ID.startsWith('YOUR_') &&
    MICROSOFT_CLIENT_ID.length > 10; // Basic validation

  const tenantIdConfigured = MICROSOFT_TENANT_ID && 
    (MICROSOFT_TENANT_ID === 'common' || 
     MICROSOFT_TENANT_ID === 'organizations' ||
     MICROSOFT_TENANT_ID === 'consumers' ||
     MICROSOFT_TENANT_ID.length > 10); // Tenant GUID validation

  const isConfigured = clientIdConfigured && tenantIdConfigured;

  let reason: string | undefined;
  if (!isConfigured) {
    if (!clientIdConfigured) {
      reason = 'Microsoft client ID not configured';
    } else if (!tenantIdConfigured) {
      reason = 'Microsoft tenant ID not configured';
    } else {
      reason = 'Microsoft OAuth credentials not configured';
    }
  }

  return {
    isConfigured,
    provider: 'microsoft',
    reason,
  };
}

/**
 * Get all available (configured) auth providers
 * @returns {Array<'google' | 'microsoft'>} List of available providers
 */
export function getAvailableAuthProviders(): Array<'google' | 'microsoft'> {
  const providers: Array<'google' | 'microsoft'> = [];
  
  if (isGoogleConfigured().isConfigured) {
    providers.push('google');
  }
  
  if (isMicrosoftConfigured().isConfigured) {
    providers.push('microsoft');
  }
  
  return providers;
}

/**
 * Check if at least one auth provider is configured
 * @returns {boolean} True if at least one provider is available
 */
export function hasAnyAuthProvider(): boolean {
  return getAvailableAuthProviders().length > 0;
}

/**
 * Get a user-friendly message about auth configuration status
 * @returns {string} Status message
 */
export function getAuthConfigStatus(): string {
  const google = isGoogleConfigured();
  const microsoft = isMicrosoftConfigured();
  
  if (google.isConfigured && microsoft.isConfigured) {
    return 'All authentication providers are configured';
  }
  
  if (!google.isConfigured && !microsoft.isConfigured) {
    return 'No authentication providers are configured. Please contact support.';
  }
  
  if (google.isConfigured) {
    return 'Google Sign-In is available. Microsoft Sign-In is not configured.';
  }
  
  if (microsoft.isConfigured) {
    return 'Microsoft Sign-In is available. Google Sign-In is not configured.';
  }
  
  return 'Authentication configuration error';
}
