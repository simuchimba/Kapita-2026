import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/constants/theme';

export default function Index() {
  const { isAuthenticated, isStaff, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] }}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={isStaff ? '/(admin)' : '/(tabs)'} />;
}
