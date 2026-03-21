// Journal Entry Detail Screen with React Query
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { JournalStackScreenProps } from '../../types/navigation';
import { colors, spacing, typography, borderRadius } from '../../theme';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import SentimentBadge from '../../components/journal/SentimentBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useJournalEntry, useDeleteJournalEntry } from '../../hooks/useJournal';

type Props = JournalStackScreenProps<'JournalDetail'>;

export default function JournalDetailScreen({ route, navigation }: Props) {
  const { entryId } = route.params;
  const { data: entry, isLoading, isError } = useJournalEntry(entryId);
  const deleteEntry = useDeleteJournalEntry();

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    deleteEntry.mutate(entryId, {
      onSuccess: () => {
        Alert.alert(
          'Entry Deleted',
          'Your journal entry has been deleted.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('JournalList'),
            },
          ]
        );
      },
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen size="large" />;
  }

  if (isError || !entry) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Entry not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="primary"
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Date */}
        <View style={styles.header}>
          <Text style={styles.date}>{formatDate(entry.createdAt)}</Text>
          {entry.sentiment && (
            <SentimentBadge sentiment={entry.sentiment} />
          )}
        </View>

        {/* Content Card */}
        <Card style={styles.contentCard}>
          <Text style={styles.contentLabel}>Your Thoughts</Text>
          <Text style={styles.content}>{entry.content}</Text>
        </Card>

        {/* Audio Section */}
        {entry.audioUrl && (
          <Card style={styles.audioCard}>
            <View style={styles.audioHeader}>
              <Text style={styles.audioIcon}>🎵</Text>
              <Text style={styles.audioLabel}>Voice Recording</Text>
            </View>
            <Text style={styles.audioSubtext}>Audio playback coming soon</Text>
            {entry.audioTranscription && (
              <View style={styles.transcriptionContainer}>
                <Text style={styles.transcriptionLabel}>Transcription:</Text>
                <Text style={styles.transcriptionText}>
                  {entry.audioTranscription}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* AI Analysis Results */}
        {(entry.sentiment || entry.keyPhrases?.length || entry.summary || entry.affirmation) && (
          <Card style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>🧠 AI Analysis</Text>

            {/* Sentiment */}
            {entry.sentiment && (
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Detected Sentiment:</Text>
                <SentimentBadge sentiment={entry.sentiment} />
              </View>
            )}

            {/* Key Phrases */}
            {entry.keyPhrases && entry.keyPhrases.length > 0 && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisLabel}>Key Themes:</Text>
                <View style={styles.keyPhrasesContainer}>
                  {entry.keyPhrases.map((phrase: string, index: number) => (
                    <View key={index} style={styles.keyPhraseChip}>
                      <Text style={styles.keyPhraseText}>{phrase}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Summary */}
            {entry.summary && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisLabel}>Summary:</Text>
                <Text style={styles.summaryText}>{entry.summary}</Text>
                {entry.summaryConfidence && (
                  <Text style={styles.confidenceText}>
                    Confidence: {Math.round(entry.summaryConfidence * 100)}%
                  </Text>
                )}
              </View>
            )}

            {/* Affirmation */}
            {entry.affirmation && (
              <View style={styles.affirmationContainer}>
                <Text style={styles.affirmationEmoji}>✨</Text>
                <Text style={styles.affirmationText}>{entry.affirmation}</Text>
              </View>
            )}
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Delete Entry"
            onPress={handleDelete}
            variant="danger"
            fullWidth
            loading={deleteEntry.isPending}
            disabled={deleteEntry.isPending}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  date: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    flex: 1,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  contentCard: {
    marginBottom: spacing.lg,
  },
  contentLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    lineHeight: 26,
  },
  audioCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.primaryLight,
  },
  audioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  audioIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  audioLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  audioSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  transcriptionContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  transcriptionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  transcriptionText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 22,
  },
  analysisCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.primaryLight + '30',
  },
  analysisTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  analysisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  analysisSection: {
    marginBottom: spacing.lg,
  },
  analysisLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginRight: spacing.md,
  },
  keyPhrasesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  keyPhraseChip: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  keyPhraseText: {
    fontSize: typography.fontSize.sm,
    color: colors.textInverse,
    fontWeight: typography.fontWeight.medium,
  },
  summaryText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 22,
  },
  confidenceText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  affirmationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '20', // Light tint
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  affirmationEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  affirmationText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  actions: {
    marginTop: spacing.xl,
  },
});
