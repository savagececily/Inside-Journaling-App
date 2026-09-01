// Crisis Resources Screen - Main hub for crisis support
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import CrisisHotlineList from '../../components/crisis/CrisisHotlineList';
import BreathingExercise from '../../components/crisis/BreathingExercise';
import GroundingTechniques from '../../components/crisis/GroundingTechniques';

type SectionType = 'hotlines' | 'breathing' | 'grounding' | 'all';

export default function CrisisResourcesScreen() {
  const [activeSection, setActiveSection] = useState<SectionType>('all');

  const renderEmergencyBanner = () => (
    <View style={styles.emergencyBanner}>
      <Text style={styles.emergencyIcon}>🚨</Text>
      <View style={styles.emergencyTextContainer}>
        <Text style={styles.emergencyTitle}>In Immediate Danger?</Text>
        <Text style={styles.emergencyText}>
          Call 911 or go to your nearest emergency room
        </Text>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.quickActionsTitle}>Quick Access</Text>
      <View style={styles.quickActionsButtons}>
        <TouchableOpacity
          style={[
            styles.quickActionButton,
            activeSection === 'hotlines' && styles.quickActionButtonActive,
          ]}
          onPress={() => setActiveSection('hotlines')}
        >
          <Text style={styles.quickActionIcon}>📞</Text>
          <Text style={styles.quickActionText}>Hotlines</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickActionButton,
            activeSection === 'breathing' && styles.quickActionButtonActive,
          ]}
          onPress={() => setActiveSection('breathing')}
        >
          <Text style={styles.quickActionIcon}>🫁</Text>
          <Text style={styles.quickActionText}>Breathing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickActionButton,
            activeSection === 'grounding' && styles.quickActionButtonActive,
          ]}
          onPress={() => setActiveSection('grounding')}
        >
          <Text style={styles.quickActionIcon}>🌟</Text>
          <Text style={styles.quickActionText}>Grounding</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickActionButton,
            activeSection === 'all' && styles.quickActionButtonActive,
          ]}
          onPress={() => setActiveSection('all')}
        >
          <Text style={styles.quickActionIcon}>📋</Text>
          <Text style={styles.quickActionText}>All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    if (activeSection === 'all') {
      return (
        <>
          <CrisisHotlineList />
          <BreathingExercise />
          <GroundingTechniques />
        </>
      );
    }

    if (activeSection === 'hotlines') {
      return <CrisisHotlineList />;
    }

    if (activeSection === 'breathing') {
      return <BreathingExercise />;
    }

    if (activeSection === 'grounding') {
      return <GroundingTechniques />;
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {renderEmergencyBanner()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Crisis Support Resources</Text>
          <Text style={styles.subtitle}>
            You're not alone. Help is available 24/7.
          </Text>
        </View>

        {renderQuickActions()}
        
        {renderContent()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💙 These resources are here to support you. If you're experiencing a mental health emergency, please reach out to one of the hotlines above or visit your nearest emergency room.
          </Text>
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
  emergencyBanner: {
    backgroundColor: colors.error,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.error + 'CC',
  },
  emergencyIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  emergencyTextContainer: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
    marginBottom: 2,
  },
  emergencyText: {
    fontSize: typography.fontSize.sm,
    color: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  quickActionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  quickActionsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  quickActionsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  quickActionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  quickActionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  footer: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
});
