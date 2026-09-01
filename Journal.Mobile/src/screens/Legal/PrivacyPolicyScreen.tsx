// Privacy Policy Screen
import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Linking, Alert } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { colors, spacing, typography } from '../../theme';

type Props = AuthStackScreenProps<'PrivacyPolicy'>;

export default function PrivacyPolicyScreen({ navigation }: Props) {
  const privacyUrl = 'https://mentalhealthjournal-webapp.azurewebsites.net/PRIVACY_POLICY.md';

  useEffect(() => {
    // Open in system browser to comply with Google's secure browser policy
    const openBrowser = async () => {
      try {
        const supported = await Linking.canOpenURL(privacyUrl);
        if (supported) {
          await Linking.openURL(privacyUrl);
          // Go back after opening the link
          navigation.goBack();
        } else {
          Alert.alert('Error', 'Unable to open privacy policy');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open privacy policy');
      }
    };

    openBrowser();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.message}>Opening Privacy Policy in your browser...</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  backButton: {
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
});
