// Reusable Badge Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({
  label,
  variant = 'neutral',
  size = 'md',
  icon,
  style,
  textStyle,
}: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], styles[`size_${size}`], style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, styles[`text_${size}`], textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  
  // Variants
  primary: {
    backgroundColor: colors.primaryLight,
  },
  secondary: {
    backgroundColor: colors.secondaryLight,
  },
  success: {
    backgroundColor: '#d1fae5', // Light green
  },
  warning: {
    backgroundColor: '#fef3c7', // Light yellow
  },
  danger: {
    backgroundColor: '#fee2e2', // Light red
  },
  neutral: {
    backgroundColor: colors.border,
  },
  
  // Sizes
  size_sm: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  size_lg: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  
  // Icon
  icon: {
    marginRight: spacing.xs,
  },
  
  // Text
  text: {
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  text_sm: {
    fontSize: typography.fontSize.xs,
  },
  text_md: {
    fontSize: typography.fontSize.sm,
  },
  text_lg: {
    fontSize: typography.fontSize.base,
  },
});
