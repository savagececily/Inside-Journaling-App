// Main Tab Navigator (Bottom Tabs)
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { 
  MainTabParamList, 
  JournalStackParamList, 
  InsightsStackParamList, 
  ChatStackParamList,
  ProfileStackParamList 
} from '../types/navigation';
import { colors } from '../theme';

// Screens
import JournalListScreen from '../screens/Journal/JournalListScreen';
import NewEntryScreen from '../screens/Journal/NewEntryScreen';
import JournalDetailScreen from '../screens/Journal/JournalDetailScreen';
import InsightsDashboardScreen from '../screens/Insights/InsightsDashboardScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import BiometricPreferencesScreen from '../screens/settings/BiometricPreferencesScreen';
import CrisisResourcesScreen from '../screens/Crisis/CrisisResourcesScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const JournalStack = createStackNavigator<JournalStackParamList>();
const InsightsStack = createStackNavigator<InsightsStackParamList>();
const ChatStack = createStackNavigator<ChatStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Journal Stack Navigator
function JournalNavigator() {
  return (
    <JournalStack.Navigator>
      <JournalStack.Screen 
        name="JournalList" 
        component={JournalListScreen}
        options={{ title: 'Journal' }}
      />
      <JournalStack.Screen 
        name="NewEntry" 
        component={NewEntryScreen}
        options={{ title: 'New Entry' }}
      />
      <JournalStack.Screen 
        name="JournalDetail" 
        component={JournalDetailScreen}
        options={{ title: 'Entry Details' }}
      />
    </JournalStack.Navigator>
  );
}

// Insights Stack Navigator
function InsightsNavigator() {
  return (
    <InsightsStack.Navigator>
      <InsightsStack.Screen 
        name="InsightsDashboard" 
        component={InsightsDashboardScreen}
        options={{ title: 'Insights' }}
      />
    </InsightsStack.Navigator>
  );
}

// Chat Stack Navigator
function ChatNavigator() {
  return (
    <ChatStack.Navigator>
      <ChatStack.Screen
        name="ChatHome"
        component={ChatScreen}
        options={{ title: 'Virtual Support' }}
      />
    </ChatStack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen 
        name="ProfileHome" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStack.Screen 
        name="Settings" 
        component={BiometricPreferencesScreen}
        options={{ title: 'Biometrics & Security' }}
      />
      <ProfileStack.Screen 
        name="CrisisSupport" 
        component={CrisisResourcesScreen}
        options={{ title: 'Crisis Support' }}
      />
    </ProfileStack.Navigator>
  );
}

// Main Tab Navigator
export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
      }}
    >
      <Tab.Screen 
        name="JournalTab" 
        component={JournalNavigator}
        options={{
          tabBarLabel: 'Journal',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="InsightsTab" 
        component={InsightsNavigator}
        options={{
          tabBarLabel: 'Insights',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="ChatTab" 
        component={ChatNavigator}
        options={{
          tabBarLabel: 'Support',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size || 22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
