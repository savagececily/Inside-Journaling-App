// Navigation types for type-safe navigation
import { StackScreenProps } from '@react-navigation/stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

// Root Stack Navigator (handles authentication flow)
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Login: undefined;
  Onboarding: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  JournalTab: undefined;
  InsightsTab: undefined;
  ProfileTab: undefined;
};

// Journal Stack Navigator
export type JournalStackParamList = {
  JournalList: undefined;
  JournalDetail: { entryId: string };
  NewEntry: undefined;
  VoiceRecording: undefined;
};

// Insights Stack Navigator
export type InsightsStackParamList = {
  InsightsDashboard: undefined;
  Trends: undefined;
  Calendar: undefined;
};

// Profile Stack Navigator
export type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
  About: undefined;
  CrisisSupport: undefined;
};

// Screen props types
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  StackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  CompositeScreenProps<
    StackScreenProps<AuthStackParamList, T>,
    RootStackScreenProps<'Auth'>
  >;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<'Main'>
  >;

export type JournalStackScreenProps<T extends keyof JournalStackParamList> = 
  CompositeScreenProps<
    StackScreenProps<JournalStackParamList, T>,
    MainTabScreenProps<'JournalTab'>
  >;

export type InsightsStackScreenProps<T extends keyof InsightsStackParamList> = 
  CompositeScreenProps<
    StackScreenProps<InsightsStackParamList, T>,
    MainTabScreenProps<'InsightsTab'>
  >;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = 
  CompositeScreenProps<
    StackScreenProps<ProfileStackParamList, T>,
    MainTabScreenProps<'ProfileTab'>
  >;

// Declare global types for React Navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
