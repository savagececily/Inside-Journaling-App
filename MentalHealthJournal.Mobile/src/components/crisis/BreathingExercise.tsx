// Breathing Exercise Component with Animations
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface BreathingPattern {
  name: string;
  description: string;
  inhale: number; // seconds
  hold: number; // seconds
  exhale: number; // seconds
  icon: string;
}

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    name: '4-7-8 Relaxation',
    description: 'Calming technique for anxiety and sleep',
    inhale: 4,
    hold: 7,
    exhale: 8,
    icon: '🌙',
  },
  {
    name: 'Box Breathing',
    description: 'Used by Navy SEALs for focus and calm',
    inhale: 4,
    hold: 4,
    exhale: 4,
    icon: '📦',
  },
  {
    name: 'Resonant Breathing',
    description: 'Optimal breathing for stress reduction',
    inhale: 5,
    hold: 0,
    exhale: 5,
    icon: '🎯',
  },
  {
    name: 'Energizing Breath',
    description: 'Quick technique to boost energy',
    inhale: 2,
    hold: 1,
    exhale: 2,
    icon: '⚡',
  },
];

interface BreathingExerciseProps {
  pattern?: BreathingPattern;
  onComplete?: () => void;
}

export default function BreathingExercise({ 
  pattern = BREATHING_PATTERNS[0],
  onComplete 
}: BreathingExerciseProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(pattern.inhale);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (!isActive) {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = 1;
      opacity.value = 0.3;
      return;
    }

    let interval: NodeJS.Timeout;
    let phaseTimer: NodeJS.Timeout;

    const runCycle = () => {
      // Inhale phase
      setCurrentPhase('inhale');
      setTimeLeft(pattern.inhale);
      scale.value = withTiming(1.5, {
        duration: pattern.inhale * 1000,
        easing: Easing.bezier(0.5, 0, 0.5, 1),
      });
      opacity.value = withTiming(1, {
        duration: pattern.inhale * 1000,
      });

      phaseTimer = setTimeout(() => {
        if (pattern.hold > 0) {
          // Hold phase
          setCurrentPhase('hold');
          setTimeLeft(pattern.hold);

          phaseTimer = setTimeout(() => {
            // Exhale phase
            setCurrentPhase('exhale');
            setTimeLeft(pattern.exhale);
            scale.value = withTiming(1, {
              duration: pattern.exhale * 1000,
              easing: Easing.bezier(0.5, 0, 0.5, 1),
            });
            opacity.value = withTiming(0.3, {
              duration: pattern.exhale * 1000,
            });

            phaseTimer = setTimeout(() => {
              setCycleCount(prev => prev + 1);
            }, pattern.exhale * 1000);
          }, pattern.hold * 1000);
        } else {
          // Exhale phase (no hold)
          setCurrentPhase('exhale');
          setTimeLeft(pattern.exhale);
          scale.value = withTiming(1, {
            duration: pattern.exhale * 1000,
            easing: Easing.bezier(0.5, 0, 0.5, 1),
          });
          opacity.value = withTiming(0.3, {
            duration: pattern.exhale * 1000,
          });

          phaseTimer = setTimeout(() => {
            setCycleCount(prev => prev + 1);
          }, pattern.exhale * 1000);
        }
      }, pattern.inhale * 1000);
    };

    // Start first cycle
    runCycle();

    // Countdown timer
    interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return currentPhase === 'inhale' ? pattern.inhale :
                 currentPhase === 'hold' ? pattern.hold :
                 pattern.exhale;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(phaseTimer);
    };
  }, [isActive, cycleCount, pattern]);

  const handleToggle = () => {
    if (isActive) {
      setIsActive(false);
      setCycleCount(0);
      setCurrentPhase('inhale');
      setTimeLeft(pattern.inhale);
    } else {
      setIsActive(true);
      setCycleCount(0);
    }
  };

  const getPhaseText = () => {
    switch (currentPhase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
    }
  };

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'inhale':
        return colors.info;
      case 'hold':
        return colors.warning;
      case 'exhale':
        return colors.success;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{pattern.icon} {pattern.name}</Text>
      <Text style={styles.description}>{pattern.description}</Text>

      <View style={styles.exerciseContainer}>
        {/* Animated Circle */}
        <View style={styles.circleContainer}>
          <Animated.View 
            style={[
              styles.circle,
              animatedStyle,
              { backgroundColor: getPhaseColor() }
            ]}
          />
        </View>

        {/* Phase Instructions */}
        <View style={styles.instructionContainer}>
          <Text style={[styles.phaseText, { color: getPhaseColor() }]}>
            {getPhaseText()}
          </Text>
          {isActive && (
            <Text style={styles.timerText}>{timeLeft}s</Text>
          )}
          {isActive && (
            <Text style={styles.cycleText}>Cycle {cycleCount + 1}</Text>
          )}
        </View>

        {/* Control Button */}
        <TouchableOpacity
          style={[styles.button, isActive && styles.buttonActive]}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            {isActive ? '⏸️ Pause' : '▶️ Start'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pattern Info */}
      <View style={styles.patternInfo}>
        <View style={styles.patternStep}>
          <Text style={styles.patternLabel}>Inhale</Text>
          <Text style={styles.patternValue}>{pattern.inhale}s</Text>
        </View>
        {pattern.hold > 0 && (
          <>
            <Text style={styles.patternArrow}>→</Text>
            <View style={styles.patternStep}>
              <Text style={styles.patternLabel}>Hold</Text>
              <Text style={styles.patternValue}>{pattern.hold}s</Text>
            </View>
          </>
        )}
        <Text style={styles.patternArrow}>→</Text>
        <View style={styles.patternStep}>
          <Text style={styles.patternLabel}>Exhale</Text>
          <Text style={styles.patternValue}>{pattern.exhale}s</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  exerciseContainer: {
    alignItems: 'center',
    width: '100%',
  },
  circleContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    minHeight: 100,
  },
  phaseText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  timerText: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cycleText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: colors.warning,
  },
  buttonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.background,
  },
  patternInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  patternStep: {
    alignItems: 'center',
  },
  patternLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  patternValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  patternArrow: {
    fontSize: typography.fontSize.xl,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
});
