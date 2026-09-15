import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackScreenProps } from '../../types/navigation';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/user/userService';
import { UserQuotaResponse, QuotaItem } from '../../types/api';
import { UpgradeModal } from '../../components/subscription/UpgradeModal';

type Props = ProfileStackScreenProps<'ProfileHome'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout, refreshUser } = useAuth();
  const [quota, setQuota] = useState<UserQuotaResponse | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    loadQuota();
  }, []);

  const loadQuota = async () => {
    setLoadingQuota(true);
    try {
      const data = await userService.getQuota();
      setQuota(data);
    } catch (error) {
      console.error('Error fetching quota:', error);
    } finally {
      setLoadingQuota(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleOpenBillingPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const response = await userService.getCustomerPortal();
      if (response.portalUrl) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = response.portalUrl;
        } else {
          await Linking.openURL(response.portalUrl);
        }
      }
    } catch (error: any) {
      Alert.alert('Billing Portal', error?.message || 'Unable to open billing portal. If on a free plan, please upgrade first.');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleSaveUsername = async () => {
    const trimmed = newUsername.trim().toLowerCase();
    if (trimmed === user?.username) {
      setIsEditingUsername(false);
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(trimmed)) {
      setUsernameError('Username must be 3-20 characters using lowercase letters, numbers, or underscores.');
      return;
    }

    setIsSavingUsername(true);
    setUsernameError(null);
    setUsernameMessage(null);

    try {
      const isAvailable = await userService.checkUsernameAvailability(trimmed);
      if (!isAvailable) {
        setUsernameError('Username is already taken.');
        setIsSavingUsername(false);
        return;
      }

      await userService.updateUsername(trimmed);
      await refreshUser();
      setUsernameMessage('Username updated successfully.');
      setIsEditingUsername(false);
    } catch (error: any) {
      setUsernameError(error?.message || 'Failed to update username.');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your journal entries, audio recordings, profile, and subscription data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              await userService.deleteAccount();
              await logout();
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete account.');
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const renderQuotaBar = (label: string, item?: QuotaItem) => {
    if (!item) return null;
    const isUnlimited = item.limit === 2147483647 || item.limit > 999999;
    const percent = isUnlimited ? 0 : Math.min(100, Math.max(0, item.percentUsed));

    return (
      <View style={styles.quotaRow}>
        <View style={styles.quotaHeader}>
          <Text style={styles.quotaLabel}>{label}</Text>
          <Text style={styles.quotaCount}>
            {item.used} / {isUnlimited ? 'Unlimited' : item.limit}
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${isUnlimited ? 0 : percent}%`,
                backgroundColor: percent > 85 ? colors.error : colors.primary,
              },
            ]}
          />
        </View>
      </View>
    );
  };

  const currentTier = quota?.tier || 'free';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>

        {isEditingUsername ? (
          <View style={styles.editUsernameContainer}>
            <TextInput
              style={styles.usernameInput}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.editButtonsRow}>
              <TouchableOpacity
                style={styles.saveUsernameButton}
                onPress={handleSaveUsername}
                disabled={isSavingUsername}
              >
                {isSavingUsername ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.saveUsernameButtonText}>Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelUsernameButton}
                onPress={() => {
                  setIsEditingUsername(false);
                  setNewUsername(user?.username || '');
                  setUsernameError(null);
                }}
              >
                <Text style={styles.cancelUsernameButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.usernameRow}
            onPress={() => setIsEditingUsername(true)}
          >
            <Text style={styles.username}>{user?.username || 'User'}</Text>
            <Ionicons name="pencil" size={16} color={colors.textSecondary} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        )}

        <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>

        <View style={[styles.tierBadge, currentTier !== 'free' && styles.tierBadgeActive]}>
          <Text style={[styles.tierBadgeText, currentTier !== 'free' && styles.tierBadgeTextActive]}>
            Plan: {currentTier.toUpperCase()}
          </Text>
        </View>

        {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
        {usernameMessage && <Text style={styles.successText}>{usernameMessage}</Text>}
      </View>

      {/* Subscription & Usage Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly Plan & Quotas</Text>
          <TouchableOpacity onPress={loadQuota} disabled={loadingQuota}>
            <Ionicons name="refresh" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {loadingQuota ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
        ) : (
          <>
            {renderQuotaBar('AI Entry Analysis', quota?.usage?.entries)}
            {renderQuotaBar('Voice Entries', quota?.usage?.voice)}
            {renderQuotaBar('Virtual Support Messages', quota?.usage?.chat)}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => setShowUpgradeModal(true)}
              >
                <Text style={styles.primaryActionButtonText}>
                  {currentTier === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                </Text>
              </TouchableOpacity>

              {currentTier !== 'free' && (
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={handleOpenBillingPortal}
                  disabled={isOpeningPortal}
                >
                  {isOpeningPortal ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={styles.secondaryActionButtonText}>Manage Billing</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>

      {/* Quick Settings & Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Preferences</Text>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={styles.menuRowLeft}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={styles.menuRowLabel}>Biometrics & Security</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('CrisisSupport')}
        >
          <View style={styles.menuRowLeft}>
            <Ionicons name="call-outline" size={20} color={colors.error} />
            <Text style={styles.menuRowLabel}>Crisis Support Resources</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.textInverse} />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={handleDeleteAccount}
          disabled={isDeletingAccount}
        >
          <Text style={styles.deleteAccountText}>
            {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>
      </View>

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={loadQuota}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  username: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  editUsernameContainer: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  usernameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: typography.fontSize.base,
    color: colors.text,
    minWidth: 180,
    textAlign: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  editButtonsRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  saveUsernameButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  saveUsernameButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.textInverse,
    fontWeight: typography.fontWeight.semiBold,
  },
  cancelUsernameButton: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  cancelUsernameButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
  },
  email: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  tierBadge: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  tierBadgeActive: {
    backgroundColor: colors.primaryLight,
  },
  tierBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semiBold,
  },
  tierBadgeTextActive: {
    color: colors.textInverse,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  successText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  quotaRow: {
    marginBottom: spacing.sm,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  quotaLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  quotaCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  primaryActionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textInverse,
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  secondaryActionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuRowLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textSecondary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  logoutButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textInverse,
    marginLeft: spacing.xs,
  },
  deleteAccountButton: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  deleteAccountText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
  },
});
