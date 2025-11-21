import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { SessionProvider, useSession } from '../context/ctx';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/constants/theme';

function RootLayoutNav() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (session && !inTabsGroup) {
      // Si hay usuario y NO está en los tabs, mandarlo al dashboard
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup) {
      // Si NO hay usuario y trata de entrar a la app, mandarlo al welcome
      router.replace('/(auth)/welcome');
    }
  }, [session, segments, isLoading]);

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="scanner/index"
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade_from_bottom'
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootLayoutNav />
    </SessionProvider>
  );
}