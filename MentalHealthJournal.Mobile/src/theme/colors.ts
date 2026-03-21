// Theme colors matching the web app
export const colors = {
  // Primary brand colors (matching web app #6366f1)
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
  textDisabled: '#cbd5e1',
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
  
  // Dark mode colors (for future implementation)
  dark: {
    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    surface: '#334155',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    border: '#475569',
  },
};

export type Colors = typeof colors;
