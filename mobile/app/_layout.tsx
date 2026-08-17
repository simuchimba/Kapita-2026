import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from '../src/context/AuthContext';
import { NetworkProvider } from '../src/context/NetworkContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { OfflineIndicator } from '../src/components/OfflineIndicator';
import { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isDataReady, setIsDataReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // SQLite is not available in Expo Go — skip gracefully.
        // A development build (expo run:ios / expo run:android) is required for offline storage.
        const { getDatabase } = await import('../src/services/database');
        await getDatabase();

        const { syncService } = await import('../src/services/sync');
        await syncService.startAutoSync(60000);
      } catch (error) {
        // Expo Go doesn't include the SQLite native module.
        // The app will still work online — offline sync is disabled.
        console.warn('[Kapita] Offline storage unavailable (Expo Go):', error);
      } finally {
        setIsDataReady(true);
      }
    };
    initializeApp();
  }, []);

  const isReady = isDataReady && (fontsLoaded || !!fontError);

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ThemeProvider>
        <AuthProvider>
          <NetworkProvider>
            <OfflineIndicator />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(admin)" options={{ headerShown: false }} />
              <Stack.Screen name="admin/login" options={{ headerShown: false }} />
            </Stack>
          </NetworkProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
