// Insights Screen - Analytics Dashboard
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { MainTabScreenProps, InsightsStackScreenProps } from '../../types/navigation';
import { colors, spacing, typography } from '../../theme';
import { useJournalEntries } from '../../hooks/useJournal';
import analyticsService from '../../services/analytics/analyticsService';

// Components
import SentimentTimelineChart from '../../components/insights/SentimentTimelineChart';
import StreakCounter from '../../components/insights/StreakCounter';
import KeyPhrasesCloud from '../../components/insights/KeyPhrasesCloud';
import TimePatternsChart from '../../components/insights/TimePatternsChart';
import JournalCalendar from '../../components/insights/JournalCalendar';
import ExportDataButton from '../../components/insights/ExportDataButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

type Props = InsightsStackScreenProps<'InsightsDashboard'>;

export default function InsightsScreen({ navigation }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Fetch all journal entries for analytics (large page size)
  const { data: entries, isLoading, refetch } = useJournalEntries(1, 1000);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!entries || entries.length === 0) {
      return {
        sentimentTimeline: [],
        streakData: {
          currentStreak: 0,
          longestStreak: 0,
          totalEntries: 0,
          lastEntryDate: null,
        },
        keyPhrases: [],
        timePatterns: [],
        calendarData: [],
      };
    }

    return {
      sentimentTimeline: analyticsService.getSentimentTimeline(entries),
      streakData: analyticsService.calculateStreak(entries),
      keyPhrases: analyticsService.aggregateKeyPhrases(entries),
      timePatterns: analyticsService.analyzeTimePatterns(entries),
      calendarData: analyticsService.getCalendarData(entries, calendarYear, calendarMonth),
    };
  }, [entries, calendarYear, calendarMonth]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleMonthChange = (month: number, year: number) => {
    setCalendarMonth(month);
    setCalendarYear(year);
  };

  const handleCreateFirst = () => {
    // Navigate to journal tab (assumed to be index 0)
    navigation.navigate('Journal' as any);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen size="large" />;
  }

  if (!entries || entries.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="📊"
          title="No Insights Yet"
          message="Create journal entries to see your analytics, trends, and patterns."
          actionLabel="Start Journaling"
          onAction={handleCreateFirst}
        />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💡 Your Insights</Text>
        <Text style={styles.headerSubtitle}>
          Discover patterns and trends in your mental health journey
        </Text>
      </View>

      {/* Streak Counter */}
      <StreakCounter streakData={analyticsData.streakData} />

      {/* Sentiment Timeline */}
      <SentimentTimelineChart data={analyticsData.sentimentTimeline} />

      {/* Key Phrases Cloud */}
      <KeyPhrasesCloud phrases={analyticsData.keyPhrases} />

      {/* Time Patterns */}
      <TimePatternsChart data={analyticsData.timePatterns} />

      {/* Calendar View */}
      <JournalCalendar 
        monthlyData={analyticsData.calendarData}
        onMonthChange={handleMonthChange}
      />

      {/* Export Data */}
      <ExportDataButton entries={entries} />

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
