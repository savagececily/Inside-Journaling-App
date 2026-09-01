// New Journal Entry Screen with React Query
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { JournalStackScreenProps } from '../../types/navigation';
import { colors, spacing, typography, borderRadius } from '../../theme';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import VoiceRecorder from '../../components/journal/VoiceRecorder';
import SentimentBadge from '../../components/journal/SentimentBadge';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useCreateJournalEntry, useUploadAudio } from '../../hooks/useJournal';
import { JournalEntry } from '../../types/api';

type Props = JournalStackScreenProps<'NewEntry'>;

export default function NewEntryScreen({ navigation }: Props) {
  const [content, setContent] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [showRecorder, setShowRecorder] = useState(false);
  const [savedEntry, setSavedEntry] = useState<JournalEntry | null>(null);

  const createEntry = useCreateJournalEntry();
  const uploadAudio = useUploadAudio();

  const isSubmitting = createEntry.isPending || uploadAudio.isPending;

  const handleRecordingComplete = async (uri: string, duration: number) => {
    setAudioUri(uri);
    setAudioDuration(duration);
    setShowRecorder(false);
    
    Alert.alert(
      'Recording Complete',
      `Audio recorded (${Math.floor(duration)}s). You can now add text or save the entry.`,
      [{ text: 'OK' }]
    );
  };

  const handleRemoveAudio = () => {
    Alert.alert(
      'Remove Audio',
      'Are you sure you want to remove the audio recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setAudioUri(null);
            setAudioDuration(0);
          },
        },
      ]
    );
  };

  const validateEntry = (): boolean => {
    if (!content.trim() && !audioUri) {
      Alert.alert(
        'Entry Required',
        'Please write something or record audio before saving.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (content.trim().length < 10) {
      Alert.alert(
        'Content Too Short',
        'Please write at least 10 characters for your journal entry.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  };

  const handleSaveEntry = async () => {
    if (!validateEntry()) return;

    try {
      let uploadedAudioUrl: string | undefined;

      // Upload audio if exists
      if (audioUri) {
        const fileName = `audio_${Date.now()}.m4a`;
        uploadedAudioUrl = await uploadAudio.mutateAsync({ uri: audioUri, fileName });
      }

      // Create journal entry
      const newEntry = await createEntry.mutateAsync({
        content: content.trim(),
        audioUrl: uploadedAudioUrl,
      });

      setSavedEntry(newEntry);

      Alert.alert(
        'Entry Saved!',
        'Your journal entry has been saved and analyzed.',
        [
          {
            text: 'View Entry',
            onPress: () => {
              navigation.replace('JournalDetail', { entryId: newEntry.id });
            },
          },
          {
            text: 'Create Another',
            onPress: () => {
              // Reset form
              setContent('');
              setAudioUri(null);
              setAudioDuration(0);
              setSavedEntry(null);
            },
          },
          {
            text: 'Go to Journal',
            style: 'cancel',
            onPress: () => {
              navigation.navigate('JournalList');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error saving journal entry:', error);
      // Error is handled by the mutations
    }
  };

  const renderAnalysisResults = () => {
    if (!savedEntry) return null;

    return (
      <Card style={styles.analysisCard}>
        <Text style={styles.analysisTitle}>🧠 AI Analysis Results</Text>
        
        {/* Sentiment */}
        {savedEntry.sentiment && (
          <View style={styles.analysisRow}>
            <Text style={styles.analysisLabel}>Sentiment:</Text>
            <SentimentBadge sentiment={savedEntry.sentiment} />
          </View>
        )}

        {/* Key Phrases */}
        {savedEntry.keyPhrases && savedEntry.keyPhrases.length > 0 && (
          <View style={styles.analysisSection}>
            <Text style={styles.analysisLabel}>Key Themes:</Text>
            <View style={styles.keyPhrasesContainer}>
              {savedEntry.keyPhrases.slice(0, 5).map((phrase, index) => (
                <View key={index} style={styles.keyPhraseChip}>
                  <Text style={styles.keyPhraseText}>{phrase}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Summary */}
        {savedEntry.summary && (
          <View style={styles.analysisSection}>
            <Text style={styles.analysisLabel}>Summary:</Text>
            <Text style={styles.summaryText}>{savedEntry.summary}</Text>
          </View>
        )}

        {/* Affirmation */}
        {savedEntry.affirmation && (
          <View style={styles.affirmationContainer}>
            <Text style={styles.affirmationEmoji}>✨</Text>
            <Text style={styles.affirmationText}>{savedEntry.affirmation}</Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Journal Entry</Text>
          <Text style={styles.headerSubtitle}>
            Express your thoughts and feelings
          </Text>
        </View>

        {/* Text Input */}
        <Input
          label="How are you feeling today?"
          placeholder="Write about your day, thoughts, or feelings..."
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={10}
          style={styles.textInput}
          textAlignVertical="top"
          editable={!isSubmitting}
        />

        {/* Audio Recording Section */}
        <Card style={styles.audioCard}>
          <Text style={styles.audioCardTitle}>🎤 Voice Recording</Text>
          <Text style={styles.audioCardSubtitle}>
            Record audio to capture your thoughts
          </Text>

          {audioUri ? (
            <View style={styles.audioPreview}>
              <View style={styles.audioInfo}>
                <Text style={styles.audioIcon}>🎵</Text>
                <View>
                  <Text style={styles.audioFileName}>Audio Recorded</Text>
                  <Text style={styles.audioDuration}>
                    Duration: {Math.floor(audioDuration)}s
                  </Text>
                </View>
              </View>
              <Button
                title="Remove"
                onPress={handleRemoveAudio}
                variant="outline"
                size="sm"
                disabled={isSubmitting}
              />
            </View>
          ) : showRecorder ? (
            <>
              <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
              <Button
                title="Cancel Recording"
                onPress={() => setShowRecorder(false)}
                variant="ghost"
                style={styles.cancelRecordButton}
              />
            </>
          ) : (
            <Button
              title="Record Audio"
              onPress={() => setShowRecorder(true)}
              variant="outline"
              fullWidth
              icon={<Text style={styles.buttonIcon}>🎤</Text>}
              disabled={isSubmitting}
            />
          )}
        </Card>

        {/* Analysis Results (shown after save) */}
        {renderAnalysisResults()}

        {/* Save Button */}
        <View style={styles.footer}>
          <Button
            title={uploadAudio.isPending ? 'Uploading Audio...' : 'Save Entry'}
            onPress={handleSaveEntry}
            variant="primary"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting || showRecorder}
          />
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="ghost"
            fullWidth
            disabled={isSubmitting}
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {isSubmitting && (
        <LoadingSpinner
          fullScreen
          size="large"
        />
      )}
    </KeyboardAvoidingView>
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
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  textInput: {
    minHeight: 160,
    paddingTop: spacing.md,
  },
  audioCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  audioCardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  audioCardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audioIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  audioFileName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  audioDuration: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  cancelRecordButton: {
    marginTop: spacing.md,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  footer: {
    marginTop: spacing.xl,
  },
  cancelButton: {
    marginTop: spacing.md,
  },
  analysisCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.primaryLight,
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
    fontWeight: typography.fontWeight.semiBold,
  },
  summaryText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 22,
  },
  affirmationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight + '30',
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
});
