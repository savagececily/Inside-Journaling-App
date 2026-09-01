// Notification Preferences Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  initializeNotifications,
  getNotificationStatus,
  getAllScheduledNotifications,
  type NotificationPreferences,
} from '../../services/notifications/notificationService';

export default function NotificationPreferencesScreen() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    dailyReminder: true,
    dailyReminderTime: '20:00',
    streakReminders: true,
    achievementNotifications: true,
    notificationsEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await getNotificationPreferences();
      const status = await getNotificationStatus();
      const scheduled = await getAllScheduledNotifications();

      setPreferences(prefs);
      setPermissionGranted(status.permissionGranted);
      setScheduledCount(scheduled.length);
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!preferences.notificationsEnabled) {
      // Enabling - initialize and request permissions
      await initializeNotifications();
      await loadPreferences(); // Reload to get updated status
    } else {
      // Disabling
      const newPrefs = {
        ...preferences,
        notificationsEnabled: false,
      };
      await saveNotificationPreferences(newPrefs);
      setPreferences(newPrefs);
      await loadPreferences();
    }
  };

  const handleToggleSetting = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    if (!permissionGranted) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications first to use this feature.',
        [{ text: 'OK' }]
      );
      return;
    }

    const newPrefs = {
      ...preferences,
      [key]: value,
    };

    setPreferences(newPrefs);
    await saveNotificationPreferences(newPrefs);
    await loadPreferences(); // Refresh scheduled count
  };

  const handleTimeChange = () => {
    Alert.prompt(
      'Set Reminder Time',
      'Enter time in 24-hour format (HH:MM)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (time) => {
            if (!time) return;

            // Validate time format
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            if (!timeRegex.test(time)) {
              Alert.alert('Invalid Time', 'Please use HH:MM format (e.g., 20:00)');
              return;
            }

            const newPrefs = {
              ...preferences,
              dailyReminderTime: time,
            };

            setPreferences(newPrefs);
            await saveNotificationPreferences(newPrefs);
            Alert.alert('Success', `Daily reminder set for ${time}`);
          },
        },
      ],
      'plain-text',
      preferences.dailyReminderTime
    );
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const renderStatusCard = () => (
    <View style={styles.statusCard}>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Permission Status:</Text>
        <View
          style={[
            styles.statusBadge,
            permissionGranted ? styles.statusBadgeSuccess : styles.statusBadgeError,
          ]}
        >
          <Text style={styles.statusBadgeText}>
            {permissionGranted ? '✓ Granted' : '✗ Not Granted'}
          </Text>
        </View>
      </View>
      
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Scheduled Notifications:</Text>
        <Text style={styles.statusValue}>{scheduledCount}</Text>
      </View>

      {!permissionGranted && (
        <Text style={styles.statusNote}>
          Tap "Enable Notifications" below to request permission
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
        disabled={!permissionGranted}
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
        <Text style={styles.title}>🔔 Notification Settings</Text>
        <Text style={styles.subtitle}>
          Stay on track with timely reminders and updates
        </Text>
      </View>

      {renderStatusCard()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Master Control</Text>
        {renderSettingRow(
          'Enable Notifications',
          'Allow the app to send you notifications',
          preferences.notificationsEnabled,
          handleEnableNotifications,
          '🔔'
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminder Settings</Text>
        
        {renderSettingRow(
          'Daily Reminder',
          'Get a daily reminder to journal',
          preferences.dailyReminder,
          (value) => handleToggleSetting('dailyReminder', value),
          '✍️'
        )}

        {preferences.dailyReminder && (
          <TouchableOpacity
            style={styles.timePickerButton}
            onPress={handleTimeChange}
            disabled={!permissionGranted}
          >
            <Text style={styles.timePickerLabel}>Reminder Time</Text>
            <View style={styles.timePickerValue}>
              <Text style={styles.timePickerText}>
                {formatTime(preferences.dailyReminderTime)}
              </Text>
              <Text style={styles.timePickerIcon}>⏰</Text>
            </View>
          </TouchableOpacity>
        )}

        {renderSettingRow(
          'Streak Reminders',
          "Don't break your journaling streak",
          preferences.streakReminders,
          (value) => handleToggleSetting('streakReminders', value),
          '🔥'
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        
        {renderSettingRow(
          'Achievement Notifications',
          'Celebrate your journaling milestones',
          preferences.achievementNotifications,
          (value) => handleToggleSetting('achievementNotifications', value),
          '🎉'
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>💡</Text>
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>About Notifications</Text>
          <Text style={styles.infoDescription}>
            • Daily reminders help build consistent journaling habits
            {'\n'}• Streak reminders keep your momentum going
            {'\n'}• Achievement notifications celebrate your progress
            {'\n'}• All notifications respect your device's Do Not Disturb settings
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
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
  timePickerButton: {
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
  timePickerLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  timePickerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timePickerText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary,
  },
  timePickerIcon: {
    fontSize: 20,
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
