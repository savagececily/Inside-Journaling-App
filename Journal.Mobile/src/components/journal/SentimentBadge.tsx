// Sentiment Badge Component for Journal Entries
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SENTIMENT_COLORS } from '../../utils/constants';
import { spacing, typography, borderRadius } from '../../theme';

type Sentiment = 'Positive' | 'Negative' | 'Neutral' | 'Mixed';

interface SentimentBadgeProps {
  sentiment: Sentiment;
  size?: 'sm' | 'md' | 'lg';
}

const sentimentEmojis: Record<Sentiment, string> = {
  Positive: '😊',
  Negative: '😔',
  Neutral: '😐',
  Mixed: '🤔',
};

export default function SentimentBadge({ sentiment, size = 'md' }: SentimentBadgeProps) {
  const backgroundColor = SENTIMENT_COLORS[sentiment];
  const emoji = sentimentEmojis[sentiment];

  return (
    <View style={[styles.badge, styles[`size_${size}`], { backgroundColor }]}>
      <Text style={[styles.emoji, styles[`emoji_${size}`]]}>{emoji}</Text>
      <Text style={[styles.text, styles[`text_${size}`]]}>{sentiment}</Text>
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
  
  // Emoji
  emoji: {
    marginRight: spacing.xs,
  },
  emoji_sm: {
    fontSize: 12,
  },
  emoji_md: {
    fontSize: 14,
  },
  emoji_lg: {
    fontSize: 16,
  },
  
  // Text
  text: {
    fontWeight: typography.fontWeight.semiBold,
    color: '#ffffff',
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
