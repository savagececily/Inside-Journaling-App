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
import { googleLogin, verifyAge } from '../../services/api/auth';
import { getConsentStatus, recordConsent } from '../../services/api/consent';
import { AgeVerificationModal } from '../../components/common/AgeVerificationModal';
import { ConsentGateModal } from '../../components/common/ConsentGateModal';
import type { AuthResponse } from '../../types/api';

type Props = AuthStackScreenProps<'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [showConsentGate, setShowConsentGate] = useState(false);
  const [tempAuthResponse, setTempAuthResponse] = useState<AuthResponse | null>(null);
  
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
      
      // Send ID token to backend for validation
      const authResponse = await googleLogin({ idToken });
      
      console.log('✅ Authentication successful!');
      
      // Store temp auth response
      setTempAuthResponse(authResponse);
      
      // Check if age verification is needed
      if (authResponse.requiresAgeVerification) {
        setShowAgeVerification(true);
        return;
      }
      
      // Check consent status
      const consentStatus = await getConsentStatus();
      
      if (!consentStatus.allGranted) {
        setShowConsentGate(true);
        return;
      }
      
      // If everything is verified and consented, complete login
      await login(authResponse);
    } catch (error: any) {
      console.error('❌ Backend authentication error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Show detailed error message
      const errorMessage = error.message || 'Failed to authenticate with server. Please try again.';
      const errorDetails = error.statusCode ? ` (Status: ${error.statusCode})` : '';
      
      Alert.alert(
        'Sign In Failed',
        `${errorMessage}${errorDetails}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAgeVerify = async (dateOfBirth: Date) => {
    if (!tempAuthResponse) return;

    try {
      await verifyAge(dateOfBirth);
      
      setShowAgeVerification(false);
      
      // Now check consents
      const consentStatus = await getConsentStatus();
      
      if (!consentStatus.allGranted) {
        setShowConsentGate(true);
      } else {
        await login(tempAuthResponse);
        setTempAuthResponse(null);
      }
    } catch (error: any) {
      throw error; // Let the modal handle the error
    }
  };

  const handleCancelAgeVerification = () => {
    setShowAgeVerification(false);
    setTempAuthResponse(null);
  };

  const handleAcceptConsents = async () => {
    if (!tempAuthResponse) return;

    try {
      // Record all consents (use default version 1.0 for now)
      await Promise.all([
        recordConsent('TermsOfService', '1.0', true),
        recordConsent('PrivacyPolicy', '1.0', true),
        recordConsent('AIAnalysis', '1.0', true),
      ]);

      setShowConsentGate(false);
      await login(tempAuthResponse);
      setTempAuthResponse(null);
    } catch (error: any) {
      throw error; // Let the modal handle the error
    }
  };

  const handleDeclineConsents = () => {
    setShowConsentGate(false);
    setTempAuthResponse(null);
    Alert.alert(
      'Consent Required',
      'You must accept all terms to use this application.',
      [{ text: 'OK' }]
    );
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

      {/* Age Verification Modal */}
      <AgeVerificationModal
        visible={showAgeVerification}
        onVerify={handleAgeVerify}
        onCancel={handleCancelAgeVerification}
      />

      {/* Consent Gate Modal */}
      <ConsentGateModal
        visible={showConsentGate}
        onAcceptAll={handleAcceptConsents}
        onDecline={handleDeclineConsents}
      />
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
