// Deep Linking Configuration
import * as Linking from 'expo-linking';
import { NavigationContainerRef } from '@react-navigation/native';

// Define deep link URL structure
export const DEEP_LINK_PREFIX = 'journal://';
export const DEEP_LINK_HTTPS_PREFIX = 'https://inside-journal.app';

// Deep link paths
export const DeepLinkPaths = {
  // Journal screens
  JOURNAL: 'journal',
  JOURNAL_NEW: 'journal/new',
  JOURNAL_DETAIL: 'journal/:id',
  
  // Insights screens
  INSIGHTS: 'insights',
  INSIGHTS_TIMELINE: 'insights/timeline',
  INSIGHTS_CALENDAR: 'insights/calendar',
  
  // Crisis support
  CRISIS: 'crisis',
  CRISIS_HOTLINES: 'crisis/hotlines',
  CRISIS_BREATHING: 'crisis/breathing',
  
  // Settings
  SETTINGS: 'settings',
  SETTINGS_NOTIFICATIONS: 'settings/notifications',
  SETTINGS_BIOMETRIC: 'settings/biometric',
  SETTINGS_PRIVACY: 'settings/privacy',
  
  // Profile
  PROFILE: 'profile',
  
  // Authentication
  LOGIN: 'login',
  REGISTER: 'register',
};

// Linking configuration for React Navigation
export const linkingConfig = {
  prefixes: [DEEP_LINK_PREFIX, DEEP_LINK_HTTPS_PREFIX],
  config: {
    screens: {
      // Auth stack
      Auth: {
        screens: {
          Login: DeepLinkPaths.LOGIN,
          Register: DeepLinkPaths.REGISTER,
        },
      },
      
      // Main app (bottom tabs)
      Main: {
        screens: {
          JournalTab: {
            screens: {
              JournalList: DeepLinkPaths.JOURNAL,
              NewEntry: DeepLinkPaths.JOURNAL_NEW,
              JournalDetail: DeepLinkPaths.JOURNAL_DETAIL,
            },
          },
          InsightsTab: {
            screens: {
              Insights: DeepLinkPaths.INSIGHTS,
              Timeline: DeepLinkPaths.INSIGHTS_TIMELINE,
              Calendar: DeepLinkPaths.INSIGHTS_CALENDAR,
            },
          },
          CrisisTab: {
            screens: {
              CrisisResources: DeepLinkPaths.CRISIS,
              Hotlines: DeepLinkPaths.CRISIS_HOTLINES,
              Breathing: DeepLinkPaths.CRISIS_BREATHING,
            },
          },
          ProfileTab: {
            screens: {
              Profile: DeepLinkPaths.PROFILE,
              Settings: DeepLinkPaths.SETTINGS,
              NotificationPreferences: DeepLinkPaths.SETTINGS_NOTIFICATIONS,
              BiometricPreferences: DeepLinkPaths.SETTINGS_BIOMETRIC,
              Privacy: DeepLinkPaths.SETTINGS_PRIVACY,
            },
          },
        },
      },
    },
  },
};

// Parse deep link URL
export function parseDeepLink(url: string): {
  screen?: string;
  params?: Record<string, any>;
} | null {
  try {
    const { hostname, path, queryParams } = Linking.parse(url);
    
    if (!path) return null;

    // Remove leading slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Map path to screen name
    const pathToScreen: Record<string, string> = {
      'journal': 'JournalList',
      'journal/new': 'NewEntry',
      'insights': 'Insights',
      'crisis': 'CrisisResources',
      'profile': 'Profile',
      'settings': 'Settings',
      'settings/notifications': 'NotificationPreferences',
      'settings/biometric': 'BiometricPreferences',
    };

    const screen = pathToScreen[cleanPath];
    
    if (!screen) return null;

    return {
      screen,
      params: queryParams || {},
    };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
}

// Handle deep link navigation
export function handleDeepLink(
  url: string,
  navigation: NavigationContainerRef<any> | null
): void {
  try {
    const parsed = parseDeepLink(url);
    
    if (!parsed || !navigation) {
      console.warn('Unable to handle deep link:', url);
      return;
    }

    // Navigate to the screen
    if (parsed.screen && navigation) {
      navigation.navigate(parsed.screen as any, parsed.params);
    }
  } catch (error) {
    console.error('Error handling deep link:', error);
  }
}

// Create deep link URL
export function createDeepLink(
  path: string,
  params?: Record<string, any>
): string {
  let url = `${DEEP_LINK_PREFIX}${path}`;
  
  if (params && Object.keys(params).length > 0) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');
    url += `?${queryString}`;
  }
  
  return url;
}

// Get initial URL (for app cold start from deep link)
export async function getInitialURL(): Promise<string | null> {
  try {
    const url = await Linking.getInitialURL();
    return url;
  } catch (error) {
    console.error('Error getting initial URL:', error);
    return null;
  }
}

// Set up deep link listener
export function setupDeepLinkListener(
  navigation: NavigationContainerRef<any> | null
): () => void {
  const subscription = Linking.addEventListener('url', (event) => {
    handleDeepLink(event.url, navigation);
  });

  return () => {
    subscription.remove();
  };
}

// Common deep link shortcuts
export const DeepLinks = {
  journal: {
    list: () => createDeepLink(DeepLinkPaths.JOURNAL),
    new: () => createDeepLink(DeepLinkPaths.JOURNAL_NEW),
    detail: (id: string) => createDeepLink(`journal/${id}`),
  },
  insights: {
    dashboard: () => createDeepLink(DeepLinkPaths.INSIGHTS),
    timeline: () => createDeepLink(DeepLinkPaths.INSIGHTS_TIMELINE),
    calendar: () => createDeepLink(DeepLinkPaths.INSIGHTS_CALENDAR),
  },
  crisis: {
    main: () => createDeepLink(DeepLinkPaths.CRISIS),
    hotlines: () => createDeepLink(DeepLinkPaths.CRISIS_HOTLINES),
    breathing: () => createDeepLink(DeepLinkPaths.CRISIS_BREATHING),
  },
  settings: {
    main: () => createDeepLink(DeepLinkPaths.SETTINGS),
    notifications: () => createDeepLink(DeepLinkPaths.SETTINGS_NOTIFICATIONS),
    biometric: () => createDeepLink(DeepLinkPaths.SETTINGS_BIOMETRIC),
    privacy: () => createDeepLink(DeepLinkPaths.SETTINGS_PRIVACY),
  },
};

export default {
  linkingConfig,
  parseDeepLink,
  handleDeepLink,
  createDeepLink,
  getInitialURL,
  setupDeepLinkListener,
  DeepLinks,
  DeepLinkPaths,
};
