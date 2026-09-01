// Insights Dashboard Screen (Placeholder)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { InsightsStackScreenProps } from '../../types/navigation';
import { colors, spacing, typography } from '../../theme';

type Props = InsightsStackScreenProps<'InsightsDashboard'>;

export default function InsightsDashboardScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Insights & Trends</Text>
      <Text style={styles.subtitle}>Coming in Sprint 3</Text>
      <Text style={styles.description}>
        This screen will show sentiment trends, streak counters,
        key phrases, and visualizations of your journaling patterns.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
