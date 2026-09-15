// Export Data Button Component
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { JournalEntry } from '../../types/api';
import analyticsService from '../../services/analytics/analyticsService';

interface ExportDataButtonProps {
  entries: JournalEntry[];
}

export default function ExportDataButton({ entries }: ExportDataButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async (format: 'csv' | 'json') => {
    if (!entries || entries.length === 0) {
      Alert.alert('No Data', 'No journal entries to export.');
      return;
    }

    setIsExporting(true);

    try {
      // Generate data based on format
      const data = format === 'csv' 
        ? analyticsService.exportToCSV(entries)
        : analyticsService.exportToJSON(entries);

      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `journal_entries_${timestamp}.${format}`;
      const fileUri = (FileSystem.documentDirectory || '') + filename;

      // Write file
      await FileSystem.writeAsStringAsync(fileUri, data);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Export Complete',
          `File saved to: ${fileUri}`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Share file
      await Sharing.shareAsync(fileUri, {
        mimeType: format === 'csv' ? 'text/csv' : 'application/json',
        dialogTitle: 'Export Journal Entries',
        UTI: format === 'csv' ? 'public.comma-separated-values-text' : 'public.json',
      });

      Alert.alert(
        'Export Successful',
        `Exported ${entries.length} entries as ${format.toUpperCase()}.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        error.message || 'Failed to export data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPress = () => {
    Alert.alert(
      'Export Format',
      'Choose the format for your exported data:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'CSV', onPress: () => exportData('csv') },
        { text: 'JSON', onPress: () => exportData('json') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 Export Your Data</Text>
      <Text style={styles.subtitle}>
        Download all your journal entries for backup or analysis
      </Text>
      
      <TouchableOpacity
        style={[styles.button, isExporting && styles.buttonDisabled]}
        onPress={handleExportPress}
        disabled={isExporting || !entries || entries.length === 0}
        activeOpacity={0.7}
      >
        {isExporting ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <>
            <Text style={styles.buttonIcon}>📥</Text>
            <Text style={styles.buttonText}>Export Data</Text>
          </>
        )}
      </TouchableOpacity>

      {entries && entries.length > 0 && (
        <Text style={styles.entryCount}>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} ready to export
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
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
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.background,
  },
  entryCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
