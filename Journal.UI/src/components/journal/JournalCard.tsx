// Journal Card Component for List Display
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { JournalEntry } from '../../types/api';
import SentimentBadge from './SentimentBadge';
import Card from '../common/Card';

interface JournalCardProps {
  entry: JournalEntry;
  onPress: () => void;
}

export default function JournalCard({ entry, onPress }: JournalCardProps) {
  // Format date
  const entryDate = new Date(entry.createdAt);
  const dateStr = entryDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = entryDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Truncate content for preview
  const contentPreview = entry.content.length > 150
    ? `${entry.content.substring(0, 150)}...`
    : entry.content;

  return (
    <Card variant="default" padding="md" onPress={onPress}>
      <View style={styles.container}>
        {/* Header: Date and Sentiment */}
        <View style={styles.header}>
          <View style={styles.dateContainer}>
            <Text style={styles.date}>{dateStr}</Text>
            <Text style={styles.time}>{timeStr}</Text>
          </View>
          
          {entry.sentiment && (
            <SentimentBadge sentiment={entry.sentiment} size="sm" />
          )}
        </View>

        {/* Content Preview */}
        <Text style={styles.content} numberOfLines={3}>
          {contentPreview}
        </Text>

        {/* Footer: Tags/Indicators */}
        <View style={styles.footer}>
          {entry.audioUrl && (
            <View style={styles.indicator}>
              <Text style={styles.indicatorIcon}>🎤</Text>
              <Text style={styles.indicatorText}>Voice</Text>
            </View>
          )}
          
          {entry.summary && (
            <View style={styles.indicator}>
              <Text style={styles.indicatorIcon}>🤖</Text>
              <Text style={styles.indicatorText}>AI Analysis</Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  dateContainer: {
    flex: 1,
  },
  date: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  time: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 22,
    marginVertical: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  indicatorIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  indicatorText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});
