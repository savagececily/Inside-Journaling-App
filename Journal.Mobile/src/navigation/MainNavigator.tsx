// Main Tab Navigator (Bottom Tabs)
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { 
  MainTabParamList, 
  JournalStackParamList, 
  InsightsStackParamList, 
  ProfileStackParamList 
} from '../types/navigation';
import { colors } from '../theme';

// Screens
import JournalListScreen from '../screens/Journal/JournalListScreen';
import NewEntryScreen from '../screens/Journal/NewEntryScreen';
import JournalDetailScreen from '../screens/Journal/JournalDetailScreen';
import InsightsDashboardScreen from '../screens/Insights/InsightsDashboardScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const JournalStack = createStackNavigator<JournalStackParamList>();
const InsightsStack = createStackNavigator<InsightsStackParamList>();
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

// Profile Stack Navigator
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen 
        name="ProfileHome" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </ProfileStack.Navigator>
  );
}

// Main Tab Navigator
export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // Hide tab navigator header (stacks have their own)
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
          tabBarIcon: ({ color }) => <TabIcon icon="📝" color={color} />,
        }}
      />
      <Tab.Screen 
        name="InsightsTab" 
        component={InsightsNavigator}
        options={{
          tabBarLabel: 'Insights',
          tabBarIcon: ({ color }) => <TabIcon icon="📊" color={color} />,
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Simple tab icon component (using emojis for now)
function TabIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <span style={{ fontSize: 24, color }}>{icon}</span>
  );
}
