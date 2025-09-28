/**
 * Elite Authentication Navigator
 * 
 * Navigation stack for authentication screens including
 * login, registration, forgot password, and OTP verification.
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from '../types';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { VerifyOTPScreen } from '../screens/auth/VerifyOTPScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';

const Stack = createStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
  onAuthStateChange: (authenticated: boolean) => void;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthStateChange }) => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen 
            {...props} 
            onAuthStateChange={onAuthStateChange} 
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="Register">
        {(props) => (
          <RegisterScreen 
            {...props} 
            onAuthStateChange={onAuthStateChange} 
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="ForgotPassword">
        {(props) => (
          <ForgotPasswordScreen 
            {...props} 
            onAuthStateChange={onAuthStateChange} 
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="VerifyOTP">
        {(props) => (
          <VerifyOTPScreen 
            {...props} 
            onAuthStateChange={onAuthStateChange} 
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="ResetPassword">
        {(props) => (
          <ResetPasswordScreen 
            {...props} 
            onAuthStateChange={onAuthStateChange} 
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
