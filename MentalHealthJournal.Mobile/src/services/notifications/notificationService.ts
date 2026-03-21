// Notification Service - Push notifications, reminders, and achievements
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPreferences {
  dailyReminder: boolean;
  dailyReminderTime: string; // HH:MM format
  streakReminders: boolean;
  achievementNotifications: boolean;
  notificationsEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  dailyReminder: true,
  dailyReminderTime: '20:00', // 8 PM
  streakReminders: true,
  achievementNotifications: true,
  notificationsEnabled: false,
};

const PREFERENCES_KEY = '@notification_preferences';
const EXPO_PUSH_TOKEN_KEY = '@expo_push_token';
const DAILY_REMINDER_ID = 'daily-reminder';
const STREAK_REMINDER_ID = 'streak-reminder';

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('Notifications only work on physical devices');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push notification permissions');
    return false;
  }

  return true;
}

// Get Expo push token for backend integration
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      return null;
    }

    // Check if already stored
    const storedToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
    if (storedToken) {
      return storedToken;
    }

    // Get new token
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id', // Replace with actual project ID
    })).data;

    // Store for future use
    await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
    
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

// Get notification preferences
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error loading notification preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

// Save notification preferences
export async function saveNotificationPreferences(
  preferences: NotificationPreferences
): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    
    // Re-schedule notifications based on new preferences
    await scheduleAllNotifications(preferences);
  } catch (error) {
    console.error('Error saving notification preferences:', error);
  }
}

// Schedule daily reminder notification
export async function scheduleDailyReminder(time: string): Promise<void> {
  try {
    // Cancel existing daily reminder
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);

    // Parse time (HH:MM)
    const [hours, minutes] = time.split(':').map(Number);

    // Schedule new daily reminder
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: '✍️ Time to journal',
        body: 'Take a moment to reflect on your day',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { screen: 'NewEntry' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });

    console.log(`Daily reminder scheduled for ${time}`);
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
  }
}

// Schedule streak maintenance reminder
export async function scheduleStreakReminder(lastEntryDate: string): Promise<void> {
  try {
    const preferences = await getNotificationPreferences();
    
    if (!preferences.streakReminders || !preferences.notificationsEnabled) {
      return;
    }

    // Cancel existing streak reminder
    await Notifications.cancelScheduledNotificationAsync(STREAK_REMINDER_ID);

    // Calculate if user needs a reminder
    const lastEntry = new Date(lastEntryDate);
    const now = new Date();
    const hoursSinceLastEntry = (now.getTime() - lastEntry.getTime()) / (1000 * 60 * 60);

    // If more than 18 hours since last entry, schedule reminder in 6 hours
    if (hoursSinceLastEntry > 18) {
      await Notifications.scheduleNotificationAsync({
        identifier: STREAK_REMINDER_ID,
        content: {
          title: '🔥 Keep your streak alive!',
          body: "Don't break your journaling streak. Write a quick entry today.",
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { screen: 'NewEntry' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 6 * 60 * 60, // 6 hours from now
          repeats: false,
        },
      });

      console.log('Streak reminder scheduled');
    }
  } catch (error) {
    console.error('Error scheduling streak reminder:', error);
  }
}

// Send achievement notification
export async function sendAchievementNotification(
  achievement: string,
  description: string
): Promise<void> {
  try {
    const preferences = await getNotificationPreferences();
    
    if (!preferences.achievementNotifications || !preferences.notificationsEnabled) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎉 ${achievement}`,
        body: description,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { screen: 'Insights' },
      },
      trigger: null, // Send immediately
    });

    console.log('Achievement notification sent:', achievement);
  } catch (error) {
    console.error('Error sending achievement notification:', error);
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}

// Schedule all notifications based on preferences
async function scheduleAllNotifications(
  preferences: NotificationPreferences
): Promise<void> {
  if (!preferences.notificationsEnabled) {
    await cancelAllNotifications();
    return;
  }

  if (preferences.dailyReminder) {
    await scheduleDailyReminder(preferences.dailyReminderTime);
  } else {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
  }

  // Streak reminders are scheduled dynamically based on user activity
}

// Initialize notification service
export async function initializeNotifications(): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    
    if (hasPermission) {
      const preferences = await getNotificationPreferences();
      preferences.notificationsEnabled = true;
      await saveNotificationPreferences(preferences);

      // Get push token for backend (optional)
      const token = await getExpoPushToken();
      if (token) {
        console.log('Expo push token:', token);
        // TODO: Send token to backend API
      }
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
}

// Set up notification response listener
export function setupNotificationResponseListener(
  navigation: any
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const screen = response.notification.request.content.data?.screen;
      
      if (screen && navigation) {
        navigation.navigate(screen);
      }
    }
  );

  return () => subscription.remove();
}

// Get all scheduled notifications (for debugging)
export async function getAllScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Check notification status
export async function getNotificationStatus(): Promise<{
  permissionGranted: boolean;
  dailyReminderScheduled: boolean;
  preferences: NotificationPreferences;
}> {
  const { status } = await Notifications.getPermissionsAsync();
  const scheduled = await getAllScheduledNotifications();
  const preferences = await getNotificationPreferences();

  return {
    permissionGranted: status === 'granted',
    dailyReminderScheduled: scheduled.some(
      (n) => n.identifier === DAILY_REMINDER_ID
    ),
    preferences,
  };
}

export default {
  requestNotificationPermissions,
  getExpoPushToken,
  getNotificationPreferences,
  saveNotificationPreferences,
  scheduleDailyReminder,
  scheduleStreakReminder,
  sendAchievementNotification,
  cancelAllNotifications,
  initializeNotifications,
  setupNotificationResponseListener,
  getAllScheduledNotifications,
  getNotificationStatus,
};
