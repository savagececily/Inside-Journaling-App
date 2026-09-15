// Secure storage service for sensitive data (tokens, credentials)
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../../utils/constants';
import { User } from '../../types/api';

// Token management
export const saveToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error saving token:', error);
    throw new Error('Failed to save authentication token');
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// User data management
export const saveUserData = async (user: User): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user data:', error);
    throw new Error('Failed to save user data');
  }
};

export const getUserData = async (): Promise<User | null> => {
  try {
    const data = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const removeUserData = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('Error removing user data:', error);
  }
};

// Biometric settings
export const saveBiometricEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled.toString());
  } catch (error) {
    console.error('Error saving biometric setting:', error);
  }
};

export const getBiometricEnabled = async (): Promise<boolean> => {
  try {
    const value = await SecureStore.getItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return value === 'true';
  } catch (error) {
    console.error('Error getting biometric setting:', error);
    return false;
  }
};

// Clear all auth-related data
export const clearAuth = async (): Promise<void> => {
  try {
    await Promise.all([
      removeToken(),
      removeUserData(),
    ]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};
