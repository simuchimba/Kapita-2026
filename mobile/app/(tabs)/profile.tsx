import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { Mail, MapPin, Phone } from 'lucide-react-native';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const initial = (user?.business_name || user?.first_name || user?.username || '?').charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{user?.business_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.content}>
        <Card>
          <View style={styles.row}>
            <Mail size={16} color={colors.gray[400]} />
            <View style={{ flex: 1 }}>
              <Text style={typography.caption}>Email</Text>
              <Text style={styles.value}>{user?.email || 'N/A'}</Text>
            </View>
          </View>
          {user?.phone ? (
            <View style={styles.row}>
              <Phone size={16} color={colors.gray[400]} />
              <View style={{ flex: 1 }}>
                <Text style={typography.caption}>Phone</Text>
                <Text style={styles.value}>{user.phone}</Text>
              </View>
            </View>
          ) : null}
          {user?.address ? (
            <View style={styles.row}>
              <MapPin size={16} color={colors.gray[400]} />
              <View style={{ flex: 1 }}>
                <Text style={typography.caption}>Address</Text>
                <Text style={styles.value}>{user.address}</Text>
              </View>
            </View>
          ) : null}
        </Card>

        <Button title="Logout" variant="danger" onPress={handleLogout} style={{ marginTop: spacing.md }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.primary[600],
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: colors.white },
  name: { fontSize: 18, fontWeight: '700', color: colors.white },
  email: { fontSize: 13, color: colors.primary[100], marginTop: 2 },
  content: { padding: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  value: { fontSize: 15, fontWeight: '600', color: colors.gray[900], marginTop: 2 },
});
