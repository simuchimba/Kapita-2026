import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { BadgeCheck, Ban, Clock3, TrendingUp, UploadCloud, Users, Wallet } from 'lucide-react-native';
import { billingAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import EmptyState from '../../src/components/ui/EmptyState';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface ActivityLog {
  id: number;
  action: string;
  created_at: string;
  actor_username?: string;
  target_username?: string;
}

interface OverviewData {
  total_users: number;
  active_trials: number;
  active_subscriptions: number;
  expired_users: number;
  pending_payment_verifications: number;
  total_revenue: number;
  total_payments: number;
  recent_activity?: ActivityLog[];
}

const TONES = {
  primary: { bg: colors.primary[100], fg: colors.primary[700] },
  yellow: { bg: '#fef3c7', fg: '#b45309' },
  red: { bg: colors.dangerBg, fg: colors.danger },
  blue: { bg: '#dbeafe', fg: '#1d4ed8' },
};

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: any; tone: keyof typeof TONES }) {
  const t = TONES[tone];
  return (
    <Card style={styles.statCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={typography.caption}>{label}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: t.bg }]}>
          <Icon size={20} color={t.fg} />
        </View>
      </View>
    </Card>
  );
}

function formatAction(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<OverviewData | null>(null);
  const router = useRouter();

  const loadData = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const overview = await billingAPI.getAdminOverview();
      setData(overview);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={typography.subtitle}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={colors.primary[600]} />}
    >
      <View style={styles.grid}>
        <StatCard label="Total Users" value={data?.total_users ?? 0} icon={Users} tone="primary" />
        <StatCard label="Active Trials" value={data?.active_trials ?? 0} icon={Clock3} tone="yellow" />
        <StatCard label="Active Subs" value={data?.active_subscriptions ?? 0} icon={BadgeCheck} tone="primary" />
        <StatCard label="Expired Users" value={data?.expired_users ?? 0} icon={Ban} tone="red" />
      </View>

      <View style={styles.grid}>
        <StatCard label="Pending Payments" value={data?.pending_payment_verifications ?? 0} icon={UploadCloud} tone="blue" />
        <StatCard label="Revenue" value={`K${Number(data?.total_revenue ?? 0).toLocaleString()}`} icon={Wallet} tone="primary" />
        <StatCard label="Payment Submissions" value={data?.total_payments ?? 0} icon={TrendingUp} tone="primary" />
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
          <Button title="Review payments" size="sm" onPress={() => router.push('/(admin)/payments')} />
          <Button title="Manage users" size="sm" variant="secondary" onPress={() => router.push('/(admin)/users')} />
          <Button title="Subscriptions" size="sm" variant="secondary" onPress={() => router.push('/(admin)/subscriptions')} />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Recent activity</Text>
        <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
          {(data?.recent_activity || []).length === 0 && <EmptyState message="No activity yet." />}
          {(data?.recent_activity || []).map((log) => (
            <View key={log.id} style={styles.logRow}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.logAction}>{formatAction(log.action)}</Text>
                <Text style={typography.caption}>{new Date(log.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={[typography.caption, { marginTop: 2 }]}>
                {log.actor_username || 'system'} → {log.target_username || 'N/A'}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: { flexGrow: 1, minWidth: '45%' },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.gray[900], marginTop: 4 },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  logRow: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  logAction: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
});
