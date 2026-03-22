// Login Screen with Google OAuth
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useAuth } from '../../contexts/AuthContext';
import { googleLogin } from '../../services/api/auth';

type Props = AuthStackScreenProps<'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { signIn, isLoading: isOAuthLoading, idToken, error: oauthError } = useGoogleAuth();
  const { login } = useAuth();

  // Handle Google OAuth response
  useEffect(() => {
    if (idToken && !isAuthenticating) {
      authenticateWithBackend(idToken);
    }
  }, [idToken]);

  // Handle OAuth errors
  useEffect(() => {
    if (oauthError && oauthError !== 'Authentication cancelled') {
      Alert.alert(
        'Authentication Error',
        oauthError,
        [{ text: 'OK' }]
      );
    }
  }, [oauthError]);

  const authenticateWithBackend = async (idToken: string) => {
    setIsAuthenticating(true);
    
    try {
      console.log('🔐 Authenticating with backend...');
      console.log('📍 API URL:', 'https://mentalhealthjournal-webapp.azurewebsites.net/api/auth/google');
      console.log('🎫 ID Token length:', idToken.length);
      console.log('🎫 ID Token preview:', idToken.substring(0, 50) + '...');
      
      // Send ID token to backend for validation
      const authResponse = await googleLogin({ idToken });
      
      console.log('✅ Authentication successful!');
      
      // Save auth data and update context
      await login(authResponse);
      
      // Show age verification alert if needed
      if (authResponse.requiresAgeVerification) {
        Alert.alert(
          'Age Verification Required',
          'For compliance, please verify your age in the Profile settings.',
          [{ text: 'OK' }]
        );
      }
      
      // Navigation is handled automatically by AuthContext
    } catch (error: any) {
      console.error('❌ Backend authentication error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to authenticate with server. Please try again.';
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || error.response.data?.error || 'Unknown error'}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Sign In Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogin = async () => {
    await signIn();
  };

  const handleOpenTerms = () => {
    navigation.navigate('TermsOfService');
  };

  const handleOpenPrivacy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const isLoading = isOAuthLoading || isAuthenticating;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>🧠</Text>
          </View>
          <Text style={styles.title}>Inside Journal</Text>
          <Text style={styles.subtitle}>
            Track your mental wellness through journaling
          </Text>
        </View>

        {/* Google Sign-In Button */}
        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
          onPress={handleGoogleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <View style={styles.googleIcon}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Privacy & Terms */}
        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>
            By signing in, you agree to our{' '}
            <Text style={styles.legalLink} onPress={handleOpenTerms}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text style={styles.legalLink} onPress={handleOpenPrivacy}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Your journal entries are private and secure
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: 50,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  googleIconText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  googleButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  legalContainer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  legalText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  footer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
