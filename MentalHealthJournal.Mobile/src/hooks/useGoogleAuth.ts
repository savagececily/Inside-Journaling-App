// Google OAuth Authentication Hook using expo-auth-session
import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';
import {
  GOOGLE_CLIENT_ID_IOS,
  GOOGLE_CLIENT_ID_ANDROID,
  GOOGLE_CLIENT_ID_WEB,
} from '../utils/constants';

export interface GoogleAuthResponse {
  idToken: string | null;
  accessToken: string | null;
  error: string | null;
}

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);

  // Configure Google OAuth
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_CLIENT_ID_IOS,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID,
    webClientId: GOOGLE_CLIENT_ID_WEB,
    // Request ID token for backend authentication
    scopes: ['profile', 'email'],
    // Add extra params to get ID token
    extraParams: {
      // Request ID token in the response
      access_type: 'offline',
    },
  });

  const [authResult, setAuthResult] = useState<GoogleAuthResponse>({
    idToken: null,
    accessToken: null,
    error: null,
  });

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      
      // Check if we have authentication data
      if (authentication) {
        setAuthResult({
          idToken: authentication.idToken || null,
          accessToken: authentication.accessToken,
          error: null,
        });
      } else {
        setAuthResult({
          idToken: null,
          accessToken: null,
          error: 'No authentication data received',
        });
      }
      setIsLoading(false);
    } else if (response?.type === 'error') {
      console.error('Google OAuth error:', response.error);
      setAuthResult({
        idToken: null,
        accessToken: null,
        error: response.error?.message || 'Authentication failed',
      });
      setIsLoading(false);
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      // User dismissed or cancelled the OAuth flow
      setAuthResult({
        idToken: null,
        accessToken: null,
        error: 'Authentication cancelled',
      });
      setIsLoading(false);
    }
  }, [response]);

  // Trigger Google login
  const signIn = async () => {
    setIsLoading(true);
    setAuthResult({
      idToken: null,
      accessToken: null,
      error: null,
    });

    try {
      await promptAsync();
    } catch (error) {
      console.error('Error prompting Google OAuth:', error);
      setAuthResult({
        idToken: null,
        accessToken: null,
        error: error instanceof Error ? error.message : 'Failed to start authentication',
      });
      setIsLoading(false);
    }
  };

  // Reset auth result
  const reset = () => {
    setAuthResult({
      idToken: null,
      accessToken: null,
      error: null,
    });
  };

  return {
    signIn,
    reset,
    isLoading,
    request,
    idToken: authResult.idToken,
    accessToken: authResult.accessToken,
    error: authResult.error,
  };
}
