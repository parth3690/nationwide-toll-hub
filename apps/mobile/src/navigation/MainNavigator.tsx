/**
 * Elite Main Navigation for Nationwide Toll Hub Mobile App
 * 
 * Main navigation structure with bottom tabs and stack navigators
 * for the authenticated user experience.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainTabParamList, DashboardStackParamList } from '../types';
import { THEME } from '../utils/constants';

// Screens
import { DashboardHomeScreen } from '../screens/dashboard/DashboardHomeScreen';
import { TollsScreen } from '../screens/tolls/TollsScreen';
import { TollDetailScreen } from '../screens/tolls/TollDetailScreen';
import { StatementsScreen } from '../screens/statements/StatementsScreen';
import { PaymentScreen } from '../screens/payment/PaymentScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const DashboardStack = createStackNavigator<DashboardStackParamList>();
const TollsStack = createStackNavigator();

interface MainNavigatorProps {
  onAuthStateChange: (authenticated: boolean) => void;
}

// Tolls Stack Navigator
const TollsStackNavigator: React.FC = () => {
  return (
    <TollsStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <TollsStack.Screen 
        name="TollsList" 
        component={TollsScreen} 
      />
      <TollsStack.Screen 
        name="TollDetail" 
        component={TollDetailScreen}
        options={{
          headerShown: true,
          title: 'Toll Details',
          headerBackTitle: 'Back',
        }}
      />
    </TollsStack.Navigator>
  );
};

// Dashboard Stack Navigator
const DashboardStackNavigator: React.FC = () => {
  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <DashboardStack.Screen 
        name="DashboardHome" 
        component={DashboardHomeScreen} 
      />
      <DashboardStack.Screen 
        name="TollDetail" 
        component={TollDetailScreen}
        options={{
          headerShown: true,
          title: 'Toll Details',
          headerBackTitle: 'Back',
        }}
      />
      <DashboardStack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{
          headerShown: true,
          title: 'Payment',
          headerBackTitle: 'Back',
        }}
      />
    </DashboardStack.Navigator>
  );
};

// Main Tab Navigator
export const MainNavigator: React.FC<MainNavigatorProps> = ({ onAuthStateChange }) => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Tolls':
              iconName = 'toll';
              break;
            case 'Statements':
              iconName = 'description';
              break;
            case 'Payments':
              iconName = 'payment';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return (
            <Icon
              name={iconName}
              size={size}
              color={focused ? THEME.COLORS.PRIMARY : THEME.COLORS.TEXT_SECONDARY}
            />
          );
        },
        tabBarActiveTintColor: THEME.COLORS.PRIMARY,
        tabBarInactiveTintColor: THEME.COLORS.TEXT_SECONDARY,
        tabBarStyle: {
          backgroundColor: THEME.COLORS.WHITE,
          borderTopColor: THEME.COLORS.BORDER,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
          ...THEME.SHADOWS.MEDIUM,
        },
        tabBarLabelStyle: {
          fontSize: THEME.SIZES.FONT_XS,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStackNavigator}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      
      <Tab.Screen 
        name="Tolls" 
        component={TollsStackNavigator}
        options={{
          tabBarLabel: 'Tolls',
        }}
      />
      
      <Tab.Screen 
        name="Statements" 
        component={StatementsScreen}
        options={{
          tabBarLabel: 'Statements',
        }}
      />
      
      <Tab.Screen 
        name="Payments" 
        component={PaymentScreen}
        options={{
          tabBarLabel: 'Payments',
        }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};
