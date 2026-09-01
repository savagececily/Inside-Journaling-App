// Calendar View with Entry Indicators
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { MonthlyData } from '../../services/analytics/analyticsService';

interface JournalCalendarProps {
  monthlyData: MonthlyData[];
  onMonthChange?: (month: number, year: number) => void;
}

export default function JournalCalendar({ monthlyData, onMonthChange }: JournalCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build marked dates object for the calendar
  const markedDates = monthlyData.reduce((acc, day) => {
    if (day.hasEntry) {
      const dotColor = day.sentiment !== undefined
        ? day.sentiment > 0.3 ? colors.success
        : day.sentiment < -0.3 ? colors.error
        : colors.info
        : colors.primary;

      acc[day.date] = {
        marked: true,
        dotColor,
        selected: selectedDate === day.date,
        selectedColor: colors.primary + '30',
        customStyles: {
          container: {
            backgroundColor: selectedDate === day.date ? colors.primary + '20' : 'transparent',
            borderRadius: borderRadius.sm,
          },
          text: {
            color: selectedDate === day.date ? colors.primary : colors.text,
            fontWeight: selectedDate === day.date ? 'bold' : 'normal',
          },
        },
      };
    }
    return acc;
  }, {} as Record<string, any>);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    if (onMonthChange) {
      onMonthChange(month.month - 1, month.year); // month is 1-indexed, we need 0-indexed
    }
  };

  // Get selected day data
  const selectedDayData = selectedDate 
    ? monthlyData.find(d => d.date === selectedDate)
    : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Journal Calendar</Text>
      <Text style={styles.subtitle}>
        Tap a date to see your entries
      </Text>
      
      <View style={styles.calendarContainer}>
        <Calendar
          markingType="custom"
          markedDates={markedDates}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          theme={{
            backgroundColor: colors.surface,
            calendarBackground: colors.surface,
            textSectionTitleColor: colors.textSecondary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.background,
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: colors.textDisabled,
            monthTextColor: colors.text,
            textDayFontFamily: 'System',
            textMonthFontFamily: 'System',
            textDayHeaderFontFamily: 'System',
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
          enableSwipeMonths={true}
        />
      </View>

      {selectedDayData && (
        <View style={styles.selectedDayInfo}>
          <Text style={styles.selectedDayTitle}>
            {new Date(selectedDate!).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          {selectedDayData.hasEntry ? (
            <>
              <Text style={styles.selectedDayCount}>
                {selectedDayData.entryCount} {selectedDayData.entryCount === 1 ? 'entry' : 'entries'}
              </Text>
              {selectedDayData.sentiment !== undefined && (
                <View style={styles.sentimentBadge}>
                  <Text style={styles.sentimentText}>
                    {selectedDayData.sentiment > 0.3 ? '😊 Positive' 
                    : selectedDayData.sentiment < -0.3 ? '😔 Negative'
                    : '😐 Neutral'}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.noEntryText}>No entries on this day</Text>
          )}
        </View>
      )}

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Positive</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
            <Text style={styles.legendText}>Neutral</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>Negative</Text>
          </View>
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
  calendarContainer: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  selectedDayInfo: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  selectedDayTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  selectedDayCount: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  sentimentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  sentimentText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  noEntryText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  legend: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  legendTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
