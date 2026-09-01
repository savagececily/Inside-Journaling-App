// Key Phrases Word Cloud Component
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { KeyPhraseData } from '../../services/analytics/analyticsService';

interface KeyPhrasesCloudProps {
  phrases: KeyPhraseData[];
}

export default function KeyPhrasesCloud({ phrases }: KeyPhrasesCloudProps) {
  if (!phrases || phrases.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No key phrases yet. Journal entries with AI analysis will show common themes here.
        </Text>
      </View>
    );
  }

  // Calculate size based on count
  const maxCount = Math.max(...phrases.map(p => p.count));
  const minCount = Math.min(...phrases.map(p => p.count));
  const range = maxCount - minCount || 1;

  const getFontSize = (count: number) => {
    const normalized = (count - minCount) / range;
    return typography.fontSize.sm + normalized * 20; // 14px to 34px
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return colors.success;
    if (sentiment < -0.3) return colors.error;
    return colors.textSecondary;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💭 Common Themes</Text>
      <Text style={styles.subtitle}>
        Most mentioned topics in your journal
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.cloudContainer}>
          {phrases.map((phrase, index) => (
            <View 
              key={index} 
              style={[
                styles.phraseItem,
                { 
                  backgroundColor: getSentimentColor(phrase.sentiment) + '20',
                  borderColor: getSentimentColor(phrase.sentiment),
                }
              ]}
            >
              <Text 
                style={[
                  styles.phraseText,
                  { 
                    fontSize: getFontSize(phrase.count),
                    color: getSentimentColor(phrase.sentiment),
                  }
                ]}
              >
                {phrase.phrase}
              </Text>
              <Text style={styles.phraseCount}>{phrase.count}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  cloudContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  phraseItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  phraseText: {
    fontWeight: typography.fontWeight.semiBold,
  },
  phraseCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  emptyContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
