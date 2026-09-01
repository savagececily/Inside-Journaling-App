// Grounding Techniques Component
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface GroundingTechnique {
  name: string;
  description: string;
  steps: string[];
  icon: string;
  duration: string;
  category: 'sensory' | 'mental' | 'physical';
}

export const GROUNDING_TECHNIQUES: GroundingTechnique[] = [
  {
    name: '5-4-3-2-1 Technique',
    description: 'Use your five senses to ground yourself in the present moment',
    icon: '👁️',
    duration: '5-10 minutes',
    category: 'sensory',
    steps: [
      'Name 5 things you can see around you',
      'Name 4 things you can touch or feel',
      'Name 3 things you can hear',
      'Name 2 things you can smell',
      'Name 1 thing you can taste',
    ],
  },
  {
    name: 'Body Scan',
    description: 'Focus attention on different parts of your body',
    icon: '🧘',
    duration: '10-15 minutes',
    category: 'physical',
    steps: [
      'Sit or lie down in a comfortable position',
      'Close your eyes and take three deep breaths',
      'Start at your toes - notice any sensations',
      'Slowly move attention up through your legs',
      'Continue through your torso, arms, and head',
      'Notice tension and consciously relax each area',
      'Take three more deep breaths when complete',
    ],
  },
  {
    name: 'Mental Categories',
    description: 'Name items in specific categories to redirect focus',
    icon: '🧠',
    duration: '5 minutes',
    category: 'mental',
    steps: [
      'Choose a category (colors, animals, cities, foods, etc.)',
      'Name as many items as you can in that category',
      'Go through the alphabet naming one item per letter',
      'Try to be as specific as possible',
      'Switch to a new category when ready',
    ],
  },
  {
    name: 'Cold Water Technique',
    description: 'Use cold sensations to interrupt distress',
    icon: '❄️',
    duration: '1-2 minutes',
    category: 'physical',
    steps: [
      'Hold an ice cube in your hand',
      'Run cold water over your hands or wrists',
      'Splash cold water on your face',
      'Focus on the sensation of cold',
      'Notice how it brings you to the present moment',
    ],
  },
  {
    name: 'Square Breathing Visualization',
    description: 'Trace a square with your eyes while breathing',
    icon: '⬜',
    duration: '3-5 minutes',
    category: 'mental',
    steps: [
      'Find a square or rectangular object',
      'Start at top left corner - breathe in for 4',
      'Trace to top right - hold for 4',
      'Trace down to bottom right - exhale for 4',
      'Trace to bottom left - hold for 4',
      'Repeat the square 5-10 times',
    ],
  },
  {
    name: 'Describing Objects',
    description: 'Describe an object in detail to focus your mind',
    icon: '🔍',
    duration: '5 minutes',
    category: 'sensory',
    steps: [
      'Pick an object near you',
      'Describe its color in detail',
      'Describe its shape and size',
      'Describe its texture',
      'Describe what it\'s used for',
      'Describe any memories associated with it',
    ],
  },
];

interface GroundingTechniquesProps {
  techniques?: GroundingTechnique[];
}

export default function GroundingTechniques({ 
  techniques = GROUNDING_TECHNIQUES 
}: GroundingTechniquesProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sensory':
        return colors.info;
      case 'mental':
        return colors.primary;
      case 'physical':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌟 Grounding Techniques</Text>
      <Text style={styles.subtitle}>
        Techniques to help you feel present and reduce anxiety
      </Text>

      <ScrollView 
        style={styles.techniqueList}
        contentContainerStyle={styles.techniqueListContent}
        showsVerticalScrollIndicator={false}
      >
        {techniques.map((technique, index) => (
          <View key={index} style={styles.techniqueCard}>
            <TouchableOpacity
              style={styles.techniqueHeader}
              onPress={() => handleToggle(index)}
              activeOpacity={0.7}
            >
              <View style={styles.techniqueHeaderLeft}>
                <Text style={styles.techniqueIcon}>{technique.icon}</Text>
                <View style={styles.techniqueHeaderText}>
                  <Text style={styles.techniqueName}>{technique.name}</Text>
                  <View style={styles.techniqueMeta}>
                    <View 
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: getCategoryColor(technique.category) + '20' }
                      ]}
                    >
                      <Text 
                        style={[
                          styles.categoryText,
                          { color: getCategoryColor(technique.category) }
                        ]}
                      >
                        {getCategoryLabel(technique.category)}
                      </Text>
                    </View>
                    <Text style={styles.duration}>⏱️ {technique.duration}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.expandIcon}>
                {expandedIndex === index ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {expandedIndex === index && (
              <View style={styles.techniqueContent}>
                <Text style={styles.techniqueDescription}>
                  {technique.description}
                </Text>
                <View style={styles.stepsContainer}>
                  <Text style={styles.stepsTitle}>Steps:</Text>
                  {technique.steps.map((step, stepIndex) => (
                    <View key={stepIndex} style={styles.stepItem}>
                      <Text style={styles.stepNumber}>{stepIndex + 1}.</Text>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    maxHeight: 600,
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
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  techniqueList: {
    flexGrow: 0,
  },
  techniqueListContent: {
    paddingBottom: spacing.md,
  },
  techniqueCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  techniqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  techniqueHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  techniqueIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  techniqueHeaderText: {
    flex: 1,
  },
  techniqueName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  techniqueMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  duration: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  expandIcon: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  techniqueContent: {
    padding: spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  techniqueDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  stepsContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  stepsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  stepNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginRight: spacing.sm,
    minWidth: 20,
  },
  stepText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
});
