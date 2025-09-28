/**
 * Elite Nationwide Toll Hub Mobile App
 * 
 * Main application component with navigation, authentication,
 * and global state management.
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import Toast from 'react-native-toast-message';
import SplashScreen from 'react-native-splash-screen';

// Navigation
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { MainNavigator } from './src/navigation/MainNavigator';

// Services
import { authService } from './src/services/authService';

// Utils
import { THEME } from './src/utils/constants';

// Types
import { RootStackParamList } from './src/types';

const Stack = createStackNavigator<RootStackParamList>();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Hide splash screen
      SplashScreen.hide();

      // Check authentication status
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);

      // Listen for auth state changes
      // In a real app, you'd implement a proper auth state listener
      
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthStateChange = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
  };

  if (isLoading) {
    // Show loading screen or keep splash screen visible
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <NavigationContainer>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={THEME.COLORS.WHITE}
          />
          
          <Stack.Navigator
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
            {isAuthenticated ? (
              <Stack.Screen name="Main">
                {() => <MainNavigator onAuthStateChange={handleAuthStateChange} />}
              </Stack.Screen>
            ) : (
              <Stack.Screen name="Auth">
                {() => <AuthNavigator onAuthStateChange={handleAuthStateChange} />}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>

        <Toast />
      </PaperProvider>
    </QueryClientProvider>
  );
};

export default App;
