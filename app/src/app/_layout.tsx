import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useEffect } from 'react';

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen as soon as layout is mounted
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0B" />
        <Stack screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0B' },
        }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="dashboard" />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
