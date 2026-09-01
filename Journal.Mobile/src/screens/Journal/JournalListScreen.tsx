// Journal List Screen with React Query and pull-to-refresh
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { JournalStackScreenProps } from '../../types/navigation';
import { colors, spacing, typography, borderRadius } from '../../theme';
import JournalCard from '../../components/journal/JournalCard';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SyncStatusIndicator from '../../components/common/SyncStatusIndicator';
import { useJournalEntries } from '../../hooks/useJournal';
import { JournalEntry } from '../../types/api';

type Props = JournalStackScreenProps<'JournalList'>;

export default function JournalListScreen({ navigation }: Props) {
  const [page, setPage] = useState(1);
  const { data: entries, isLoading, isRefetching, refetch } = useJournalEntries(page, 20);

  const handleRefresh = () => {
    setPage(1);
    refetch();
  };

  const handleEntryPress = (entry: JournalEntry) => {
    navigation.navigate('JournalDetail', { entryId: entry.id });
  };

  const handleCreateNew = () => {
    navigation.navigate('NewEntry');
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => (
    <JournalCard
      entry={item}
      onPress={() => handleEntryPress(item)}
    />
  );

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <EmptyState
        icon="📝"
        title="No Journal Entries Yet"
        message="Start your mental health journey by creating your first journal entry."
        actionLabel="Create Entry"
        onAction={handleCreateNew}
      />
    );
  };

  if (isLoading && !isRefetching) {
    return <LoadingSpinner fullScreen size="large" />;
  }

  return (
    <View style={styles.container}>
      <SyncStatusIndicator />
      <FlatList
        data={entries || []}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          (!entries || entries.length === 0) && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateNew}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>✏️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
  },
});
