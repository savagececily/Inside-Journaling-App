// Consent Gate Modal Component
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

interface ConsentGateModalProps {
  visible: boolean;
  onAcceptAll: () => Promise<void>;
  onDecline: () => void;
}

export const ConsentGateModal: React.FC<ConsentGateModalProps> = ({
  visible,
  onAcceptAll,
  onDecline,
}) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedAI, setAcceptedAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAcceptAll = async () => {
    if (!acceptedTerms || !acceptedPrivacy || !acceptedAI) {
      setError('Please accept all required terms to continue');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onAcceptAll();
    } catch (err: any) {
      setError(err.message || 'Failed to record consent. Please try again.');
      setIsSubmitting(false);
    }
  };

  const CheckBox = ({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) => (
    <TouchableOpacity
      style={styles.checkboxContainer}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isSubmitting}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={18} color={colors.textInverse} />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Terms & Consent</Text>
          
          <Text style={styles.description}>
            Before proceeding, please review and accept the following:
          </Text>

          <ScrollView style={styles.consentList} showsVerticalScrollIndicator={false}>
            <View style={styles.consentSection}>
              <CheckBox
                checked={acceptedTerms}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                label="I agree to the"
              />
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>Terms of Service</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.consentSection}>
              <CheckBox
                checked={acceptedPrivacy}
                onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
                label="I agree to the"
              />
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.consentSection}>
              <CheckBox
                checked={acceptedAI}
                onPress={() => setAcceptedAI(!acceptedAI)}
                label="I consent to AI processing of my journal entries"
              />
              <Text style={styles.helpText}>
                We use AI to analyze your entries for sentiment and patterns to provide insights.
                You can manage this preference later in Settings.
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                You can review or revoke your consent at any time from the Profile settings.
              </Text>
            </View>
          </ScrollView>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onDecline}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonSecondaryText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                (isSubmitting || !acceptedTerms || !acceptedPrivacy || !acceptedAI) && styles.buttonDisabled
              ]}
              onPress={handleAcceptAll}
              disabled={isSubmitting || !acceptedTerms || !acceptedPrivacy || !acceptedAI}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.buttonPrimaryText}>Accept & Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  consentList: {
    marginBottom: spacing.lg,
  },
  consentSection: {
    marginBottom: spacing.xl,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  linkButton: {
    marginLeft: 32,
    marginTop: spacing.xs,
  },
  linkText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: typography.fontWeight.semiBold,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 32,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginTop: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPrimaryText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
