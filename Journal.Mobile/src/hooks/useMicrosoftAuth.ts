// Microsoft OAuth Authentication Hook using react-native-app-auth
import { useState } from 'react';
import { authorize, AuthConfiguration } from 'react-native-app-auth';
import {
  MICROSOFT_CLIENT_ID,
  MICROSOFT_TENANT_ID,
} from '../utils/constants';
import { isMicrosoftConfigured } from '../utils/authConfig';

export interface MicrosoftAuthResponse {
  idToken: string | null;
  accessToken: string | null;
  error: string | null;
  isAvailable: boolean;
}

export function useMicrosoftAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const configStatus = isMicrosoftConfigured();
  const [authResult, setAuthResult] = useState<MicrosoftAuthResponse>({
    idToken: null,
    accessToken: null,
    error: null,
    isAvailable: configStatus.isConfigured,
  });

  const config: AuthConfiguration = {
    issuer: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/v2.0`,
    clientId: MICROSOFT_CLIENT_ID,
    redirectUrl: 'msauth.com.journal://auth',
    scopes: ['openid', 'profile', 'email'],
    serviceConfiguration: {
      authorizationEndpoint: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize`,
      tokenEndpoint: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    },
  };

  const signIn = async () => {
    // Check if Microsoft auth is configured
    if (!configStatus.isConfigured) {
      console.warn('⚠️ Microsoft auth not configured:', configStatus.reason);
      setAuthResult({
        idToken: null,
        accessToken: null,
        error: configStatus.reason || 'Microsoft Sign-In is not configured',
        isAvailable: false,
      });
      return;
    }

    setIsLoading(true);
    setAuthResult({
      idToken: null,
      accessToken: null,
      error: null,
      isAvailable: true,
    });

    try {
      console.log('🔐 Starting Microsoft OAuth...');
      console.log('🔧 Config:', {
        clientId: MICROSOFT_CLIENT_ID,
        tenantId: MICROSOFT_TENANT_ID,
        redirectUrl: config.redirectUrl,
        scopes: config.scopes,
      });

      const result = await authorize(config);

      console.log('✅ Microsoft OAuth success:', {
        hasIdToken: !!result.idToken,
        hasAccessToken: !!result.accessToken,
      });

      setAuthResult({
        idToken: result.idToken,
        accessToken: result.accessToken,
        error: null,
        isAvailable: true,
      });
    } catch (error: any) {
      console.error('❌ Microsoft OAuth error:', error);
      
      // Check if user cancelled
      if (error.message && error.message.includes('User cancelled')) {
        setAuthResult({
          idToken: null,
          accessToken: null,
          error: 'Authentication cancelled',
          isAvailable: true,
        });
      } else {
        setAuthResult({
          idToken: null,
          accessToken: null,
          error: error.message || 'Microsoft authentication failed',
          isAvailable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn,
    isLoading,
    idToken: authResult.idToken,
    accessToken: authResult.accessToken,
    error: authResult.error,
    isAvailable: authResult.isAvailable,
  };
}
