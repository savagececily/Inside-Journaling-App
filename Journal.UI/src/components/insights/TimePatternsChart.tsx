// Time Patterns Bar Chart Component
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { TimePatternData } from '../../services/analytics/analyticsService';

interface TimePatternsChartProps {
  data: TimePatternData[];
}

export default function TimePatternsChart({ data }: TimePatternsChartProps) {
  if (!data || data.length === 0 || data.every(d => d.count === 0)) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Create more journal entries to see when you write most often.
        </Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width - spacing.lg * 2;

  // Group hours into 4-hour blocks for better visualization
  const timeBlocks = [
    { label: '12AM-4AM', hours: [0, 1, 2, 3], emoji: '🌙' },
    { label: '4AM-8AM', hours: [4, 5, 6, 7], emoji: '🌅' },
    { label: '8AM-12PM', hours: [8, 9, 10, 11], emoji: '☀️' },
    { label: '12PM-4PM', hours: [12, 13, 14, 15], emoji: '🌤️' },
    { label: '4PM-8PM', hours: [16, 17, 18, 19], emoji: '🌆' },
    { label: '8PM-12AM', hours: [20, 21, 22, 23], emoji: '🌃' },
  ];

  const blockData = timeBlocks.map(block => {
    const counts = block.hours.map(hour => data[hour]?.count || 0);
    return {
      label: block.emoji,
      count: counts.reduce((sum, c) => sum + c, 0),
      timeLabel: block.label,
    };
  });

  const chartData = {
    labels: blockData.map(b => b.label),
    datasets: [
      {
        data: blockData.map(b => Math.max(b.count, 0.1)), // Ensure min value for visibility
      },
    ],
  };

  const mostActiveBlock = blockData.reduce((max, block) => 
    block.count > max.count ? block : max
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⏰ Writing Patterns</Text>
      <Text style={styles.subtitle}>
        When do you journal most?
      </Text>
      
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={screenWidth}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: colors.background,
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // Purple
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: borderRadius.md,
            },
            barPercentage: 0.7,
          }}
          style={styles.chart}
          showValuesOnTopOfBars={true}
          fromZero={true}
        />
      </View>

      <View style={styles.insights}>
        <Text style={styles.insightText}>
          💡 You write most between <Text style={styles.insightHighlight}>{mostActiveBlock.timeLabel}</Text>
        </Text>
        <View style={styles.timeLabelsContainer}>
          {blockData.map((block, index) => (
            <View key={index} style={styles.timeLabelItem}>
              <Text style={styles.timeLabelEmoji}>{block.label}</Text>
              <Text style={styles.timeLabelText}>{block.timeLabel}</Text>
            </View>
          ))}
        </View>
      </View>
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
  chartContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  chart: {
    borderRadius: borderRadius.md,
  },
  insights: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  insightText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  insightHighlight: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  timeLabelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  timeLabelItem: {
    alignItems: 'center',
  },
  timeLabelEmoji: {
    fontSize: typography.fontSize.lg,
    marginBottom: 2,
  },
  timeLabelText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
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
