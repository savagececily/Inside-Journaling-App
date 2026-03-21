// Empty State Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  message?: string; // Alias for description
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export default function EmptyState({
  icon,
  title,
  description,
  message,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  // Use message if description is not provided
  const displayDescription = description || message;
  return (
    <View style={[styles.container, style]}>
      {/* Icon */}
      {icon && <View style={styles.iconContainer}>{icon}</View>}

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Description */}
      {displayDescription && <Text style={styles.description}>{displayDescription}</Text>}

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  button: {
    marginTop: spacing.md,
  },
});
