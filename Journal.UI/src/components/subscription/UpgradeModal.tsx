import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import userService from '../../services/user/userService';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UpgradeModal({ visible, onClose, onSuccess }: UpgradeModalProps) {
  const [loadingTier, setLoadingTier] = useState<'premium' | 'pro' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpgrade = async (tier: 'premium' | 'pro') => {
    try {
      setLoadingTier(tier);
      setErrorMessage(null);

      const response = await userService.upgradeSubscription(tier);
      if (response.checkoutUrl) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = response.checkoutUrl;
        } else {
          await Linking.openURL(response.checkoutUrl);
        }
        if (onSuccess) onSuccess();
        onClose();
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      const msg = error?.message || 'Failed to start upgrade session. Please try again.';
      setErrorMessage(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Upgrade Error', msg);
      }
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Upgrade Subscription</Text>
              <Text style={styles.modalSubtitle}>
                Choose the plan that best supports your wellness journey
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close upgrade modal"
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <ScrollView style={styles.plansScrollView} showsVerticalScrollIndicator={false}>
            {/* Premium Plan Card */}
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Premium</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceAmount}>$4.99</Text>
                  <Text style={styles.pricePeriod}>/month</Text>
                </View>
              </View>

              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color={colors.success} />
                  <Text style={styles.featureText}>Unlimited AI entry analysis</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color={colors.success} />
                  <Text style={styles.featureText}>Unlimited voice-to-text recording</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color={colors.success} />
                  <Text style={styles.featureText}>250 Virtual Support messages/month</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color={colors.success} />
                  <Text style={styles.featureText}>Advanced analytics and trends</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color={colors.success} />
                  <Text style={styles.featureText}>JSON and CSV data export</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.planButton}
                onPress={() => handleUpgrade('premium')}
                disabled={loadingTier !== null}
              >
                {loadingTier === 'premium' ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.planButtonText}>Select Premium</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Pro Companion Plan Card */}
            <View style={[styles.planCard, styles.planCardFeatured]}>
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Most Popular</Text>
              </View>

              <View style={styles.planHeader}>
                <Text style={styles.planName}>Pro Companion</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceAmount}>$9.99</Text>
                  <Text style={styles.pricePeriod}>/month</Text>
                </View>
              </View>

              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                  <Text style={styles.featureText}>Everything in Premium</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                  <Text style={styles.featureText}>Unlimited Virtual Support messages</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                  <Text style={styles.featureText}>Priority AI processing</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                  <Text style={styles.featureText}>Early access to new features</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.planButton, styles.planButtonFeatured]}
                onPress={() => handleUpgrade('pro')}
                disabled={loadingTier !== null}
              >
                {loadingTier === 'pro' ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.planButtonText}>Select Pro Companion</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footerNoteContainer}>
              <Text style={styles.footerNoteText}>
                Secure payment powered by Stripe.
              </Text>
              <Text style={styles.footerNoteText}>
                Cancel anytime in account settings.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 280,
  },
  closeButton: {
    padding: spacing.xs,
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
  },
  plansScrollView: {
    marginBottom: spacing.md,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  planCardFeatured: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.backgroundSecondary,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  popularBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  planHeader: {
    marginBottom: spacing.sm,
  },
  planName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  priceAmount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  pricePeriod: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  featureList: {
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  planButton: {
    backgroundColor: colors.text,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planButtonFeatured: {
    backgroundColor: colors.primary,
  },
  planButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textInverse,
  },
  footerNoteContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  footerNoteText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
