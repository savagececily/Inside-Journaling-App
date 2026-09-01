// Biometric Authentication Service - Face ID, Touch ID, Fingerprint
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface BiometricPreferences {
  enabled: boolean;
  requireOnAppLaunch: boolean;
  requireAfterInactivity: boolean;
  inactivityTimeoutMinutes: number;
  usePinFallback: boolean;
  pinCode?: string; // Stored securely
}

const DEFAULT_PREFERENCES: BiometricPreferences = {
  enabled: false,
  requireOnAppLaunch: true,
  requireAfterInactivity: true,
  inactivityTimeoutMinutes: 5,
  usePinFallback: true,
};

const PREFERENCES_KEY = '@biometric_preferences';
const PIN_CODE_KEY = 'biometric_pin_code'; // SecureStore key
const LAST_ACTIVITY_KEY = '@last_activity_timestamp';

export type BiometricType = 'FACIAL_RECOGNITION' | 'FINGERPRINT' | 'IRIS' | 'NONE';

// Check if device supports biometric authentication
export async function isBiometricSupported(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.error('Error checking biometric support:', error);
    return false;
  }
}

// Check if user has enrolled any biometrics
export async function hasBiometricsEnrolled(): Promise<boolean> {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Error checking biometric enrollment:', error);
    return false;
  }
}

// Get available biometric types
export async function getAvailableBiometricTypes(): Promise<BiometricType[]> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    const mapped: BiometricType[] = [];
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      mapped.push('FACIAL_RECOGNITION');
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      mapped.push('FINGERPRINT');
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      mapped.push('IRIS');
    }
    
    return mapped.length > 0 ? mapped : ['NONE'];
  } catch (error) {
    console.error('Error getting biometric types:', error);
    return ['NONE'];
  }
}

// Get user-friendly name for biometric type
export function getBiometricTypeName(types: BiometricType[]): string {
  if (types.includes('FACIAL_RECOGNITION')) {
    return 'Face ID';
  }
  if (types.includes('FINGERPRINT')) {
    return 'Fingerprint';
  }
  if (types.includes('IRIS')) {
    return 'Iris';
  }
  return 'Biometric Authentication';
}

// Authenticate with biometrics
export async function authenticateWithBiometrics(
  promptMessage: string = 'Verify your identity'
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: false,
    });

    if (result.success) {
      await updateLastActivityTimestamp();
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Authentication failed',
    };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: 'An error occurred during authentication',
    };
  }
}

// Get biometric preferences
export async function getBiometricPreferences(): Promise<BiometricPreferences> {
  try {
    const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error loading biometric preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

// Save biometric preferences
export async function saveBiometricPreferences(
  preferences: BiometricPreferences
): Promise<void> {
  try {
    // Save preferences
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));

    // Save PIN code securely if provided
    if (preferences.pinCode) {
      await SecureStore.setItemAsync(PIN_CODE_KEY, preferences.pinCode);
      // Remove PIN from preferences object before storing
      delete preferences.pinCode;
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    }
  } catch (error) {
    console.error('Error saving biometric preferences:', error);
    throw error;
  }
}

// Set up PIN code
export async function setPinCode(pin: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(PIN_CODE_KEY, pin);
  } catch (error) {
    console.error('Error setting PIN code:', error);
    throw error;
  }
}

// Verify PIN code
export async function verifyPinCode(pin: string): Promise<boolean> {
  try {
    const storedPin = await SecureStore.getItemAsync(PIN_CODE_KEY);
    if (!storedPin) {
      return false;
    }
    
    const isValid = storedPin === pin;
    
    if (isValid) {
      await updateLastActivityTimestamp();
    }
    
    return isValid;
  } catch (error) {
    console.error('Error verifying PIN code:', error);
    return false;
  }
}

// Remove PIN code
export async function removePinCode(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PIN_CODE_KEY);
  } catch (error) {
    console.error('Error removing PIN code:', error);
  }
}

// Check if PIN code is set
export async function hasPinCode(): Promise<boolean> {
  try {
    const pin = await SecureStore.getItemAsync(PIN_CODE_KEY);
    return !!pin;
  } catch (error) {
    console.error('Error checking PIN code:', error);
    return false;
  }
}

// Update last activity timestamp
export async function updateLastActivityTimestamp(): Promise<void> {
  try {
    const timestamp = Date.now().toString();
    await AsyncStorage.setItem(LAST_ACTIVITY_KEY, timestamp);
  } catch (error) {
    console.error('Error updating activity timestamp:', error);
  }
}

// Check if authentication is required based on inactivity
export async function shouldRequireAuthentication(): Promise<boolean> {
  try {
    const preferences = await getBiometricPreferences();
    
    if (!preferences.enabled) {
      return false;
    }

    if (!preferences.requireAfterInactivity) {
      return false;
    }

    const lastActivityStr = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
    
    if (!lastActivityStr) {
      // No activity recorded, require auth
      return true;
    }

    const lastActivity = parseInt(lastActivityStr, 10);
    const now = Date.now();
    const minutesInactive = (now - lastActivity) / (1000 * 60);

    return minutesInactive >= preferences.inactivityTimeoutMinutes;
  } catch (error) {
    console.error('Error checking authentication requirement:', error);
    return false;
  }
}

// Authenticate with biometric or PIN fallback
export async function authenticate(
  promptMessage: string = 'Verify your identity'
): Promise<{ success: boolean; usedPin: boolean; error?: string }> {
  try {
    const preferences = await getBiometricPreferences();
    
    // First try biometric authentication
    const biometricResult = await authenticateWithBiometrics(promptMessage);
    
    if (biometricResult.success) {
      return { success: true, usedPin: false };
    }

    // If biometric failed and PIN fallback is enabled
    if (preferences.usePinFallback && (await hasPinCode())) {
      return {
        success: false,
        usedPin: true,
        error: 'Use PIN code',
      };
    }

    return {
      success: false,
      usedPin: false,
      error: biometricResult.error || 'Authentication failed',
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      usedPin: false,
      error: 'An error occurred during authentication',
    };
  }
}

// Initialize biometric authentication
export async function initializeBiometrics(): Promise<{
  supported: boolean;
  enrolled: boolean;
  types: BiometricType[];
}> {
  const supported = await isBiometricSupported();
  const enrolled = supported ? await hasBiometricsEnrolled() : false;
  const types: BiometricType[] = enrolled ? await getAvailableBiometricTypes() : ['NONE'];

  return { supported, enrolled, types };
}

// Get biometric status (for settings/debugging)
export async function getBiometricStatus(): Promise<{
  supported: boolean;
  enrolled: boolean;
  types: BiometricType[];
  typeName: string;
  enabled: boolean;
  hasPinCodeSet: boolean;
  preferences: BiometricPreferences;
}> {
  const { supported, enrolled, types } = await initializeBiometrics();
  const typeName = getBiometricTypeName(types);
  const preferences = await getBiometricPreferences();
  const hasPinCodeSet = await hasPinCode();

  return {
    supported,
    enrolled,
    types,
    typeName,
    enabled: preferences.enabled,
    hasPinCodeSet,
    preferences,
  };
}

export default {
  isBiometricSupported,
  hasBiometricsEnrolled,
  getAvailableBiometricTypes,
  getBiometricTypeName,
  authenticateWithBiometrics,
  getBiometricPreferences,
  saveBiometricPreferences,
  setPinCode,
  verifyPinCode,
  removePinCode,
  hasPinCode,
  updateLastActivityTimestamp,
  shouldRequireAuthentication,
  authenticate,
  initializeBiometrics,
  getBiometricStatus,
};
