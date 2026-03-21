// Sync Status Indicator Component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useSyncState } from '../../hooks/useSync';
import syncService from '../../services/sync/syncService';

export default function SyncStatusIndicator() {
  const syncState = useSyncState();

  const handlePress = () => {
    if (syncState.isOnline && syncState.pendingCount > 0) {
      syncService.triggerSync();
    }
  };

  // Don't show if no pending items and online
  if (syncState.pendingCount === 0 && syncState.isOnline) {
    return null;
  }

  const getStatusInfo = () => {
    if (!syncState.isOnline) {
      return {
        icon: '📵',
        text: 'Offline',
        subtext: `${syncState.pendingCount} pending`,
        color: colors.warning,
      };
    }

    if (syncState.status === 'syncing') {
      return {
        icon: '🔄',
        text: 'Syncing...',
        subtext: `${syncState.pendingCount} remaining`,
        color: colors.info,
      };
    }

    if (syncState.pendingCount > 0) {
      return {
        icon: '⏱️',
        text: 'Pending Sync',
        subtext: `${syncState.pendingCount} items`,
        color: colors.warning,
      };
    }

    return {
      icon: '✅',
      text: 'Synced',
      subtext: 'All up to date',
      color: colors.success,
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: statusInfo.color + '20' }]}
      onPress={handlePress}
      activeOpacity={syncState.pendingCount > 0 && syncState.isOnline ? 0.7 : 1}
      disabled={syncState.pendingCount === 0 || !syncState.isOnline}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{statusInfo.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.text, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
          <Text style={styles.subtext}>{statusInfo.subtext}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    marginBottom: 2,
  },
  subtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
