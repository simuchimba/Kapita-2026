import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { billingAPI } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';

interface OverviewData {
  total_users: number;
  active_trials: number;
  active_subscriptions: number;
  expired_users: number;
  pending_payment_verifications: number;
  total_revenue: number;
  total_payments: number;
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData | null>(null);
  const { logout } = useAuth();
  const router = useRouter();

  const loadData = async () => {
    setLoading(true);
    try {
      const overview = await billingAPI.getAdminOverview();
      setData(overview);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            logout();
            router.replace('/admin/login');
          }}
        >
          <LogOut size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Users</Text>
          <Text style={styles.statValue}>{data?.total_users ?? 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active Trials</Text>
          <Text style={[styles.statValue, styles.yellow]}>{data?.active_trials ?? 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active Subs</Text>
          <Text style={[styles.statValue, styles.green]}>{data?.active_subscriptions ?? 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Expired Users</Text>
          <Text style={[styles.statValue, styles.red]}>{data?.expired_users ?? 0}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pending Payments</Text>
          <Text style={[styles.statValue, styles.blue]}>{data?.pending_payment_verifications ?? 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={[styles.statValue, styles.green]}>K{Number(data?.total_revenue ?? 0).toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Payments</Text>
          <Text style={styles.statValue}>{data?.total_payments ?? 0}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  logoutButton: { backgroundColor: '#ef4444', padding: 12, borderRadius: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#111' },
  green: { color: '#10b981' },
  red: { color: '#ef4444' },
  blue: { color: '#3b82f6' },
  yellow: { color: '#f59e0b' },
});
