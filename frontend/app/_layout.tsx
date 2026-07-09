import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';
import { ReportorialProvider } from '../context/ReportorialContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <DataProvider>
        <ReportorialProvider>
          <ThemeProvider>
            <TamaguiWrapper />
          </ThemeProvider>
        </ReportorialProvider>
      </DataProvider>
    </AuthProvider>
  );
}

function TamaguiWrapper() {
  const { isDark, colors } = useTheme();
  
  return (
    <TamaguiProvider config={config} defaultTheme={isDark ? 'dark' : 'light'}>
      <NavigationWrapper />
    </TamaguiProvider>
  );
}

function NavigationWrapper() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
