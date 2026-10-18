import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { LocaleProvider, useLocale } from '@/hooks/useLocale';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { KeyboardProvider } from '@/hooks/useKeyboard';
import { palette } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { status } = useAuth();
  const { ready } = useLocale();

  useEffect(() => {
    if (status !== 'loading' && ready) SplashScreen.hideAsync().catch(() => {});
  }, [status, ready]);

  if (status === 'loading' || !ready) return null;

  const authed = status === 'authed';

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.canvas } }}>
      {/* Signed-out: the only things reachable are the welcome gateway and sign-in. */}
      <Stack.Protected guard={!authed}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* An account (customer or professional) is required for everything else. */}
      <Stack.Protected guard={authed}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="business/[slug]" />
        <Stack.Screen name="booking/[slug]" options={{ presentation: 'card' }} />
        <Stack.Screen name="order/[slug]" options={{ presentation: 'card' }} />
        <Stack.Screen name="quote/[slug]" options={{ presentation: 'card' }} />
        <Stack.Screen name="how-it-works" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding/business" options={{ presentation: 'card' }} />
        <Stack.Screen name="admin/index" />
        <Stack.Screen name="favourites" options={{ presentation: 'card' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
        <Stack.Screen name="edit-profile" options={{ presentation: 'card' }} />
        {/* Internal design comparison of the homepage directions; gated in-page
            to development builds and never linked from the app UI. */}
        <Stack.Screen name="design-preview" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LocaleProvider>
          <KeyboardProvider>
            <AuthProvider>
              <StatusBar style="dark" />
              <RootStack />
            </AuthProvider>
          </KeyboardProvider>
        </LocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
