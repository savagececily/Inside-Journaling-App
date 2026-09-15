// Theme Context Provider - Dark Mode Support
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export const lightColors = {
  // Primary brand colors
  primary: '#6366f1',
  primaryDark: '#5558e3',
  primaryLight: '#818cf8',
  
  // Secondary colors
  secondary: '#8b5cf6',
  secondaryLight: '#c4b5fd',
  
  // Gradient colors
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
  
  // Sentiment colors
  sentiment: {
    positive: '#4ade80',
    negative: '#f87171',
    neutral: '#94a3b8',
    mixed: '#fbbf24',
  },
  
  // UI colors
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  surface: '#ffffff',
  card: '#ffffff',
  
  // Text colors
  text: '#1e293b',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textInverse: '#ffffff',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Border colors
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const darkColors = {
  // Primary brand colors (slightly adjusted for dark mode)
  primary: '#818cf8',
  primaryDark: '#6366f1',
  primaryLight: '#a5b4fc',
  
  // Secondary colors
  secondary: '#a78bfa',
  secondaryLight: '#c4b5fd',
  
  // Gradient colors
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
  
  // Sentiment colors (slightly adjusted for dark backgrounds)
  sentiment: {
    positive: '#4ade80',
    negative: '#f87171',
    neutral: '#94a3b8',
    mixed: '#fbbf24',
  },
  
  // UI colors
  background: '#0f172a',
  backgroundSecondary: '#1e293b',
  surface: '#1e293b',
  card: '#334155',
  
  // Text colors
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  textInverse: '#1e293b',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Border colors
  border: '#475569',
  borderLight: '#334155',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: typeof lightColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_MODE_KEY = '@theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  
  // Determine if dark mode should be active
  const isDark = 
    themeMode === 'dark' || 
    (themeMode === 'system' && systemColorScheme === 'dark');
  
  const colors = isDark ? darkColors : lightColors;

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_MODE_KEY);
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        setThemeModeState(saved as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_MODE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Hook to get current colors (for backward compatibility)
export function useColors() {
  const { colors } = useTheme();
  return colors;
}

export default { ThemeProvider, useTheme, useColors };
