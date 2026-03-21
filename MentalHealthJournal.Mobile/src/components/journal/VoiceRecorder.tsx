// Voice Recorder Component for Journal Entries
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { APP_SETTINGS } from '../../utils/constants';
import Button from '../common/Button';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  maxDuration?: number;
}

export default function VoiceRecorder({
  onRecordingComplete,
  maxDuration = APP_SETTINGS.AUDIO_MAX_DURATION_SECONDS,
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  // Update recording duration every second
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          
          return newDuration;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, maxDuration]);

  const startRecording = async () => {
    try {
      // Request permissions if not granted
      if (permissionResponse?.status !== 'granted') {
        const { status } = await requestPermission();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Microphone permission is required to record audio.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      
      if (uri) {
        onRecordingComplete(uri, recordingDuration);
      }

      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert(
        'Recording Error',
        'Failed to stop recording. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const cancelRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Recording Status */}
      <View style={styles.statusContainer}>
        {isRecording && (
          <>
            <View style={styles.recordingIndicator} />
            <Text style={styles.recordingText}>Recording...</Text>
          </>
        )}
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatDuration(recordingDuration)}</Text>
        <Text style={styles.maxDuration}>/ {formatDuration(maxDuration)}</Text>
      </View>

      {/* Waveform Placeholder (can be enhanced with a library) */}
      {isRecording && (
        <View style={styles.waveformContainer}>
          <View style={[styles.waveBar, { height: 20 }]} />
          <View style={[styles.waveBar, { height: 35 }]} />
          <View style={[styles.waveBar, { height: 28 }]} />
          <View style={[styles.waveBar, { height: 42 }]} />
          <View style={[styles.waveBar, { height: 30 }]} />
          <View style={[styles.waveBar, { height: 38 }]} />
          <View style={[styles.waveBar, { height: 25 }]} />
          <View style={[styles.waveBar, { height: 33 }]} />
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {!isRecording ? (
          <Button
            title="Start Recording"
            onPress={startRecording}
            variant="primary"
            fullWidth
            icon={<Text style={styles.buttonIcon}>🎤</Text>}
          />
        ) : (
          <View style={styles.recordingControls}>
            <Button
              title="Cancel"
              onPress={cancelRecording}
              variant="outline"
              style={styles.secondaryButton}
            />
            <Button
              title="Stop"
              onPress={stopRecording}
              variant="danger"
              style={styles.primaryButton}
              icon={<Text style={styles.buttonIcon}>⏹️</Text>}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    minHeight: 24,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.error,
    marginRight: spacing.sm,
  },
  recordingText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.error,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  timer: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  maxDuration: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 60,
    marginBottom: spacing.lg,
  },
  waveBar: {
    width: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  controls: {
    marginTop: spacing.md,
  },
  recordingControls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  primaryButton: {
    flex: 2,
  },
  secondaryButton: {
    flex: 1,
  },
  buttonIcon: {
    fontSize: 18,
  },
});
