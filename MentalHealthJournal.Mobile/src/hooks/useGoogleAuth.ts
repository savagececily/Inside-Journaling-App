// Google OAuth Authentication Hook using expo-auth-session
import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
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

  // For Expo Go, we need to use auth.expo.io proxy
  // The response comes back through Expo's linking system
  const redirectUri = AuthSession.makeRedirectUri();

  console.log('🔧 Using redirect URI:', redirectUri);
  console.log('🔧 Platform:', Platform.OS);

  // Configure Google OAuth
  // For Expo Go, use webClientId for all platforms since Expo Go uses web-based OAuth flow
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Use web client ID for iOS/Android if native IDs are placeholders (Expo Go)
    // For standalone builds, replace the placeholder values in constants.ts with actual native client IDs
    iosClientId: GOOGLE_CLIENT_ID_IOS.startsWith('YOUR_') ? GOOGLE_CLIENT_ID_WEB : GOOGLE_CLIENT_ID_IOS,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID.startsWith('YOUR_') ? GOOGLE_CLIENT_ID_WEB : GOOGLE_CLIENT_ID_ANDROID,
    webClientId: GOOGLE_CLIENT_ID_WEB,
    // Request ID token for backend authentication
    scopes: ['profile', 'email'],
  });

  // Log the OAuth configuration
  useEffect(() => {
    if (request) {
      console.log('🔧 OAuth Request Config:', {
        clientId: GOOGLE_CLIENT_ID_WEB,
        redirectUri: request.redirectUri,
        scopes: request.scopes,
      });
    }
  }, [request]);

  const [authResult, setAuthResult] = useState<GoogleAuthResponse>({
    idToken: null,
    accessToken: null,
    error: null,
  });

  // Handle OAuth response
  useEffect(() => {
    console.log('📥 OAuth response type:', response?.type);
    
    if (response?.type === 'success') {
      const { authentication } = response;
      
      console.log('✅ Google OAuth success:', { 
        hasIdToken: !!authentication?.idToken, 
        hasAccessToken: !!authentication?.accessToken,
        authentication: authentication 
      });
      
      // Check if we have authentication data
      if (authentication) {
        if (!authentication.idToken) {
          console.error('⚠️ Warning: No ID token in authentication response');
        }
        setAuthResult({
          idToken: authentication.idToken || null,
          accessToken: authentication.accessToken,
          error: null,
        });
      } else {
        console.error('❌ No authentication object in success response');
        setAuthResult({
          idToken: null,
          accessToken: null,
          error: 'No authentication data received',
        });
      }
      setIsLoading(false);
    } else if (response?.type === 'error') {
      console.error('❌ Google OAuth error:', response.error);
      console.error('Error params:', response.params);
      console.error('Full response:', JSON.stringify(response, null, 2));
      setAuthResult({
        idToken: null,
        accessToken: null,
        error: response.error?.message || 'Authentication failed',
      });
      setIsLoading(false);
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      // User dismissed or cancelled the OAuth flow
      console.log('ℹ️ User cancelled OAuth');
      setAuthResult({
        idToken: null,
        accessToken: null,
        error: 'Authentication cancelled',
      });
      setIsLoading(false);
    } else if (response) {
      console.log('⚠️ Unexpected response type:', response.type);
      console.log('Full response:', JSON.stringify(response, null, 2));
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
