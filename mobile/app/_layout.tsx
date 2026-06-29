import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { NetworkProvider } from '../src/context/NetworkContext';
import { OfflineIndicator } from '../src/components/OfflineIndicator';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);

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
        setIsInitialized(true);
      }
    };
    initializeApp();
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NetworkProvider>
        <OfflineIndicator />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          <Stack.Screen name="admin/login" options={{ headerShown: false }} />
        </Stack>
      </NetworkProvider>
    </AuthProvider>
  );
}
