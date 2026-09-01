// Haptic Feedback Service - Tactile feedback for user interactions
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HapticPreferences {
  enabled: boolean;
  buttonPress: boolean;
  success: boolean;
  warning: boolean;
  error: boolean;
  selection: boolean;
}

const DEFAULT_PREFERENCES: HapticPreferences = {
  enabled: true,
  buttonPress: true,
  success: true,
  warning: true,
  error: true,
  selection: true,
};

const HAPTIC_PREFS_KEY = '@haptic_preferences';

// Get haptic preferences
export async function getHapticPreferences(): Promise<HapticPreferences> {
  try {
    const stored = await AsyncStorage.getItem(HAPTIC_PREFS_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error loading haptic preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

// Save haptic preferences
export async function saveHapticPreferences(
  preferences: HapticPreferences
): Promise<void> {
  try {
    await AsyncStorage.setItem(HAPTIC_PREFS_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving haptic preferences:', error);
  }
}

// Light impact - for button presses, toggles
export async function lightImpact(): Promise<void> {
  try {
    const prefs = await getHapticPreferences();
    if (prefs.enabled && prefs.buttonPress) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
}

// Medium impact - for more significant interactions
export async function mediumImpact(): Promise<void> {
  try {
    const prefs = await getHapticPreferences();
    if (prefs.enabled && prefs.buttonPress) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
}

// Heavy impact - for important actions
export async function heavyImpact(): Promise<void> {
  try {
    const prefs = await getHapticPreferences();
    if (prefs.enabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
}

// Success feedback - for successful operations
export async function successFeedback(): Promise<void> {
  try {
    const prefs = await getHapticPreferences();
    if (prefs.enabled && prefs.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
}

// Warning feedback - for warnings
export async function warningFeedback(): Promise<void> {
  try {
    const prefs = await getHapticPreferences();
    if (prefs.enabled && prefs.warning) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
}

// Error feedback - for errors
export async function errorFeedback(): Promise<void> {
  try {
    const prefs = await getHapticPreferences();
    if (prefs.enabled && prefs.error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
}

// Selection feedback - for picker/selection changes
export async function selectionFeedback(): Promise<void> {
  try {
    const prefs = await getHapticPreferences();
    if (prefs.enabled && prefs.selection) {
      await Haptics.selectionAsync();
    }
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
}

// Button press - convenience for common button interactions
export async function buttonPress(): Promise<void> {
  await lightImpact();
}

// Tab switch - for tab bar navigation
export async function tabSwitch(): Promise<void> {
  await selectionFeedback();
}

// Delete action - heavier feedback for destructive actions
export async function deleteAction(): Promise<void> {
  await heavyImpact();
}

// Save action - medium feedback for save operations
export async function saveAction(): Promise<void> {
  await mediumImpact();
}

// Refresh - light feedback for pull-to-refresh
export async function refresh(): Promise<void> {
  await lightImpact();
}

// Long press - heavy feedback for long press actions
export async function longPress(): Promise<void> {
  await heavyImpact();
}

// Swipe - light feedback for swipe gestures
export async function swipe(): Promise<void> {
  await lightImpact();
}

// Achievement unlock - special pattern for achievements
export async function achievementUnlock(): Promise<void> {
  try {
    const prefs = await getHapticPreferences();
    if (prefs.enabled) {
      // Double success pattern
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise(resolve => setTimeout(resolve, 100));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
}

// Streak milestone - pattern for streak achievements
export async function streakMilestone(): Promise<void> {
  try {
    const prefs = await getHapticPreferences();
    if (prefs.enabled) {
      // Triple impact pattern
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(resolve => setTimeout(resolve, 80));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(resolve => setTimeout(resolve, 80));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
}

// Journal entry saved - success with delay
export async function journalEntrySaved(): Promise<void> {
  try {
    const prefs = await getHapticPreferences();
    if (prefs.enabled) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
}

// Recording started/stopped - medium impact
export async function recordingToggle(): Promise<void> {
  await mediumImpact();
}

// Custom pattern - for advanced use cases
export async function customPattern(
  pattern: Array<{ type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection', delay?: number }>
): Promise<void> {
  try {
    const prefs = await getHapticPreferences();
    if (!prefs.enabled) return;

    for (const item of pattern) {
      if (item.delay) {
        await new Promise(resolve => setTimeout(resolve, item.delay));
      }

      switch (item.type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
      }
    }
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
}

export default {
  getHapticPreferences,
  saveHapticPreferences,
  lightImpact,
  mediumImpact,
  heavyImpact,
  successFeedback,
  warningFeedback,
  errorFeedback,
  selectionFeedback,
  buttonPress,
  tabSwitch,
  deleteAction,
  saveAction,
  refresh,
  longPress,
  swipe,
  achievementUnlock,
  streakMilestone,
  journalEntrySaved,
  recordingToggle,
  customPattern,
};
