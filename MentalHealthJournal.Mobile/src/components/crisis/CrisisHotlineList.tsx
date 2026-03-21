// Crisis Hotline Quick Dial Component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface CrisisHotline {
  name: string;
  phone: string;
  description: string;
  icon: string;
  available: string;
  country?: string;
}

// Default crisis hotlines (US-based, can be expanded)
export const DEFAULT_HOTLINES: CrisisHotline[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    description: '24/7 free and confidential support for people in distress',
    icon: '☎️',
    available: '24/7',
    country: 'US',
  },
  {
    name: 'Crisis Text Line',
    phone: '741741',
    description: 'Text HOME to 741741 for free, 24/7 crisis counseling',
    icon: '💬',
    available: '24/7',
    country: 'US',
  },
  {
    name: 'SAMHSA National Helpline',
    phone: '1-800-662-4357',
    description: 'Treatment referral and information service',
    icon: '🏥',
    available: '24/7',
    country: 'US',
  },
  {
    name: 'Veterans Crisis Line',
    phone: '988',
    description: 'Press 1 for Veterans, service members, and families',
    icon: '🎖️',
    available: '24/7',
    country: 'US',
  },
  {
    name: 'NAMI HelpLine',
    phone: '1-800-950-6264',
    description: 'Mental health support and resources',
    icon: '🧠',
    available: 'M-F 10am-10pm ET',
    country: 'US',
  },
];

interface CrisisHotlineListProps {
  hotlines?: CrisisHotline[];
}

export default function CrisisHotlineList({ hotlines = DEFAULT_HOTLINES }: CrisisHotlineListProps) {
  const handleCall = async (hotline: CrisisHotline) => {
    const phoneNumber = Platform.OS === 'ios' ? `tel:${hotline.phone}` : `tel:${hotline.phone}`;

    Alert.alert(
      `Call ${hotline.name}?`,
      `You're about to call ${hotline.phone}\n\n${hotline.description}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: async () => {
            try {
              const canOpen = await Linking.canOpenURL(phoneNumber);
              if (canOpen) {
                await Linking.openURL(phoneNumber);
              } else {
                Alert.alert(
                  'Unable to Make Call',
                  'Your device cannot make phone calls. Please manually dial: ' + hotline.phone,
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Error making call:', error);
              Alert.alert(
                'Call Failed',
                'Failed to initiate call. Please manually dial: ' + hotline.phone,
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📞 Crisis Hotlines</Text>
      <Text style={styles.subtitle}>
        Tap any hotline to call immediately. All services are confidential.
      </Text>

      <View style={styles.hotlineList}>
        {hotlines.map((hotline, index) => (
          <TouchableOpacity
            key={index}
            style={styles.hotlineCard}
            onPress={() => handleCall(hotline)}
            activeOpacity={0.7}
          >
            <View style={styles.hotlineIcon}>
              <Text style={styles.iconText}>{hotline.icon}</Text>
            </View>
            
            <View style={styles.hotlineInfo}>
              <Text style={styles.hotlineName}>{hotline.name}</Text>
              <Text style={styles.hotlinePhone}>{hotline.phone}</Text>
              <Text style={styles.hotlineDescription}>{hotline.description}</Text>
              <Text style={styles.hotlineAvailable}>⏰ {hotline.available}</Text>
            </View>
            
            <View style={styles.callButton}>
              <Text style={styles.callButtonText}>Call</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.emergencyNote}>
        <Text style={styles.emergencyIcon}>🚨</Text>
        <Text style={styles.emergencyText}>
          If you're in immediate danger, call 911 or go to your nearest emergency room.
        </Text>
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
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  hotlineList: {
    gap: spacing.md,
  },
  hotlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hotlineIcon: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 28,
  },
  hotlineInfo: {
    flex: 1,
  },
  hotlineName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  hotlinePhone: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  hotlineDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  hotlineAvailable: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  callButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  callButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.background,
  },
  emergencyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  emergencyIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  emergencyText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 20,
  },
});
