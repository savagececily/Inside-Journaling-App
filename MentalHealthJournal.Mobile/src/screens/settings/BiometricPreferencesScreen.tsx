// Biometric Preferences Screen - Face ID, Touch ID, PIN settings
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import {
  getBiometricStatus,
  getBiometricPreferences,
  saveBiometricPreferences,
  authenticate,
  setPinCode,
  verifyPinCode,
  hasPinCode,
  removePinCode,
  type BiometricPreferences,
  type BiometricType,
} from '../../services/auth/biometricService';

export default function BiometricPreferencesScreen() {
  const [preferences, setPreferences] = useState<BiometricPreferences>({
    enabled: false,
    requireOnAppLaunch: true,
    requireAfterInactivity: true,
    inactivityTimeoutMinutes: 5,
    usePinFallback: true,
  });
  const [loading, setLoading] = useState(true);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [biometricTypeName, setBiometricTypeName] = useState('Biometric');
  const [hasPinSet, setHasPinSet] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const status = await getBiometricStatus();
      const prefs = await getBiometricPreferences();
      const pinSet = await hasPinCode();

      setBiometricSupported(status.supported);
      setBiometricEnrolled(status.enrolled);
      setBiometricTypeName(status.typeName);
      setPreferences(prefs);
      setHasPinSet(pinSet);
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load biometric preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableBiometrics = async (value: boolean) => {
    if (value) {
      // Enabling - test authentication first
      if (!biometricSupported) {
        Alert.alert(
          'Not Supported',
          'Biometric authentication is not available on this device.'
        );
        return;
      }

      if (!biometricEnrolled) {
        Alert.alert(
          'Not Set Up',
          `Please set up ${biometricTypeName} in your device settings first.`
        );
        return;
      }

      // Test authentication
      const result = await authenticate('Enable biometric authentication');
      
      if (result.success) {
        const newPrefs = { ...preferences, enabled: true };
        await saveBiometricPreferences(newPrefs);
        setPreferences(newPrefs);
        Alert.alert('Success', 'Biometric authentication enabled');
      } else {
        Alert.alert('Failed', result.error || 'Authentication failed');
      }
    } else {
      // Disabling
      const newPrefs = { ...preferences, enabled: false };
      await saveBiometricPreferences(newPrefs);
      setPreferences(newPrefs);
    }
  };

  const handleToggleSetting = async (
    key: keyof BiometricPreferences,
    value: boolean
  ) => {
    if (!preferences.enabled && key !== 'enabled') {
      Alert.alert(
        'Enable Biometrics First',
        'Please enable biometric authentication before changing these settings.'
      );
      return;
    }

    const newPrefs = { ...preferences, [key]: value };
    await saveBiometricPreferences(newPrefs);
    setPreferences(newPrefs);
  };

  const handleTimeoutChange = () => {
    Alert.prompt(
      'Set Timeout',
      'Enter timeout in minutes (1-60)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (value) => {
            if (!value) return;

            const minutes = parseInt(value, 10);
            if (isNaN(minutes) || minutes < 1 || minutes > 60) {
              Alert.alert('Invalid', 'Please enter a number between 1 and 60');
              return;
            }

            const newPrefs = {
              ...preferences,
              inactivityTimeoutMinutes: minutes,
            };

            await saveBiometricPreferences(newPrefs);
            setPreferences(newPrefs);
            Alert.alert('Success', `Timeout set to ${minutes} minutes`);
          },
        },
      ],
      'plain-text',
      preferences.inactivityTimeoutMinutes.toString()
    );
  };

  const handleSetPin = () => {
    let pinInput = '';
    
    Alert.prompt(
      'Set PIN Code',
      'Enter a 4-6 digit PIN',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next',
          onPress: async (pin) => {
            if (!pin || pin.length < 4 || pin.length > 6) {
              Alert.alert('Invalid PIN', 'PIN must be 4-6 digits');
              return;
            }

            if (!/^\d+$/.test(pin)) {
              Alert.alert('Invalid PIN', 'PIN must contain only digits');
              return;
            }

            pinInput = pin;

            // Confirm PIN
            Alert.prompt(
              'Confirm PIN Code',
              'Re-enter your PIN',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Save',
                  onPress: async (confirmPin) => {
                    if (confirmPin !== pinInput) {
                      Alert.alert('Error', 'PINs do not match');
                      return;
                    }

                    try {
                      await setPinCode(pinInput);
                      setHasPinSet(true);
                      Alert.alert('Success', 'PIN code set successfully');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to set PIN code');
                    }
                  },
                },
              ],
              'secure-text'
            );
          },
        },
      ],
      'secure-text'
    );
  };

  const handleChangePin = () => {
    // Verify current PIN first
    Alert.prompt(
      'Verify Current PIN',
      'Enter your current PIN',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: async (currentPin) => {
            if (!currentPin) return;

            const isValid = await verifyPinCode(currentPin);
            
            if (!isValid) {
              Alert.alert('Error', 'Incorrect PIN');
              return;
            }

            // Set new PIN
            handleSetPin();
          },
        },
      ],
      'secure-text'
    );
  };

  const handleRemovePin = () => {
    Alert.alert(
      'Remove PIN?',
      'Are you sure you want to remove your PIN code? You will only be able to use biometric authentication.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removePinCode();
              setHasPinSet(false);
              Alert.alert('Success', 'PIN code removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove PIN code');
            }
          },
        },
      ]
    );
  };

  const renderStatusCard = () => (
    <View style={styles.statusCard}>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Device Support:</Text>
        <View
          style={[
            styles.statusBadge,
            biometricSupported ? styles.statusBadgeSuccess : styles.statusBadgeError,
          ]}
        >
          <Text style={styles.statusBadgeText}>
            {biometricSupported ? '✓ Supported' : '✗ Not Supported'}
          </Text>
        </View>
      </View>

      {biometricSupported && (
        <>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Type:</Text>
            <Text style={styles.statusValue}>{biometricTypeName}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Enrolled:</Text>
            <Text style={styles.statusValue}>
              {biometricEnrolled ? 'Yes' : 'No'}
            </Text>
          </View>
        </>
      )}

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>PIN Set:</Text>
        <Text style={styles.statusValue}>{hasPinSet ? 'Yes' : 'No'}</Text>
      </View>

      {!biometricEnrolled && biometricSupported && (
        <Text style={styles.statusNote}>
          Set up {biometricTypeName} in your device settings to enable
        </Text>
      )}
    </View>
  );

  const renderSettingRow = (
    label: string,
    description: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    icon: string
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.surface}
        disabled={!biometricSupported || !biometricEnrolled}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🔐 Security Settings</Text>
        <Text style={styles.subtitle}>
          Protect your journal with biometric authentication
        </Text>
      </View>

      {renderStatusCard()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Biometric Authentication</Text>
        
        {renderSettingRow(
          `Enable ${biometricTypeName}`,
          'Secure your journal with biometric authentication',
          preferences.enabled,
          handleEnableBiometrics,
          '🔒'
        )}

        {preferences.enabled && (
          <>
            {renderSettingRow(
              'Require on App Launch',
              'Authenticate every time you open the app',
              preferences.requireOnAppLaunch,
              (value) => handleToggleSetting('requireOnAppLaunch', value),
              '🚀'
            )}

            {renderSettingRow(
              'Require After Inactivity',
              'Authenticate after period of inactivity',
              preferences.requireAfterInactivity,
              (value) => handleToggleSetting('requireAfterInactivity', value),
              '⏱️'
            )}

            {preferences.requireAfterInactivity && (
              <TouchableOpacity
                style={styles.timeoutButton}
                onPress={handleTimeoutChange}
              >
                <Text style={styles.timeoutLabel}>Inactivity Timeout</Text>
                <View style={styles.timeoutValue}>
                  <Text style={styles.timeoutText}>
                    {preferences.inactivityTimeoutMinutes} minutes
                  </Text>
                  <Text style={styles.timeoutIcon}>⏰</Text>
                </View>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PIN Code Fallback</Text>
        
        {preferences.enabled && renderSettingRow(
          'Use PIN Fallback',
          'Allow PIN code as backup authentication',
          preferences.usePinFallback,
          (value) => handleToggleSetting('usePinFallback', value),
          '🔢'
        )}

        {preferences.usePinFallback && (
          <View style={styles.pinSection}>
            {!hasPinSet ? (
              <TouchableOpacity
                style={styles.pinButton}
                onPress={handleSetPin}
              >
                <Text style={styles.pinButtonIcon}>➕</Text>
                <Text style={styles.pinButtonText}>Set PIN Code</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.pinActions}>
                <TouchableOpacity
                  style={[styles.pinButton, styles.pinButtonSecondary]}
                  onPress={handleChangePin}
                >
                  <Text style={styles.pinButtonIcon}>✏️</Text>
                  <Text style={styles.pinButtonText}>Change PIN</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.pinButton, styles.pinButtonDanger]}
                  onPress={handleRemovePin}
                >
                  <Text style={styles.pinButtonIcon}>🗑️</Text>
                  <Text style={styles.pinButtonText}>Remove PIN</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>💡</Text>
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>About Security</Text>
          <Text style={styles.infoDescription}>
            • {biometricTypeName} keeps your journal entries private
            {'\n'}• PIN code provides backup when biometrics fail
            {'\n'}• Biometric data never leaves your device
            {'\n'}• You can disable security at any time
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  statusValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusBadgeSuccess: {
    backgroundColor: colors.success + '20',
  },
  statusBadgeError: {
    backgroundColor: colors.error + '20',
  },
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  statusNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  settingIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  timeoutButton: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeoutLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  timeoutValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeoutText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary,
  },
  timeoutIcon: {
    fontSize: 20,
  },
  pinSection: {
    marginTop: spacing.md,
  },
  pinActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pinButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pinButtonSecondary: {
    backgroundColor: colors.info,
  },
  pinButtonDanger: {
    backgroundColor: colors.error,
  },
  pinButtonIcon: {
    fontSize: 20,
  },
  pinButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.surface,
  },
  infoCard: {
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
});
