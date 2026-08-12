import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AlertTriangle, Package, ShoppingCart, TrendingUp, Users, Wallet } from 'lucide-react-native';
import { analyticsAPI } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import Card from '../../src/components/ui/Card';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface DashboardData {
  summary: {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    current_capital: number;
    cash_available: number;
    inventory_value: number;
    credit_outstanding: number;
  };
  alerts: {
    low_stock_count: number;
    overdue_credits: number;
    negative_cashflow: boolean;
  };
  record_counts: {
    products: number;
    customers: number;
    sales: number;
  };
}

const TONES = {
  primary: { bg: colors.primary[100], fg: colors.primary[700] },
  blue: { bg: '#dbeafe', fg: '#1d4ed8' },
  red: { bg: colors.dangerBg, fg: colors.danger },
};

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: keyof typeof TONES }) {
  const t = TONES[tone];
  return (
    <Card style={styles.statCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={typography.caption}>{label}</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: t.bg }]}>
          <Icon size={20} color={t.fg} />
        </View>
      </View>
    </Card>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const result = await analyticsAPI.getDashboard();
      setData(result);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const s = data?.summary;
  const alerts = data?.alerts;
  const counts = data?.record_counts;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.white} />}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.business_name || user?.first_name || 'there'}</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>

      {!loading && (alerts?.low_stock_count ?? 0) > 0 && (
        <View style={styles.alertBanner}>
          <AlertTriangle size={16} color={colors.warning} />
          <Text style={styles.alertText}>
            {alerts!.low_stock_count} product{alerts!.low_stock_count === 1 ? '' : 's'} running low on stock
          </Text>
        </View>
      )}
      {!loading && (alerts?.overdue_credits ?? 0) > 0 && (
        <View style={[styles.alertBanner, { backgroundColor: colors.dangerBg }]}>
          <AlertTriangle size={16} color={colors.danger} />
          <Text style={[styles.alertText, { color: colors.danger }]}>
            {alerts!.overdue_credits} customer credit{alerts!.overdue_credits === 1 ? '' : 's'} overdue
          </Text>
        </View>
      )}

      <View style={styles.statsContainer}>
        <StatCard label="Total Revenue" value={`K${Number(s?.total_revenue ?? 0).toLocaleString()}`} icon={TrendingUp} tone="primary" />
        <StatCard label="Products" value={String(counts?.products ?? 0)} icon={Package} tone="blue" />
        <StatCard label="Customers" value={String(counts?.customers ?? 0)} icon={Users} tone="blue" />
        <StatCard label="Owed to You" value={`K${Number(s?.credit_outstanding ?? 0).toLocaleString()}`} icon={ShoppingCart} tone="red" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Capital</Text>
        <Card style={styles.capitalCard}>
          <Wallet size={28} color={colors.primary[600]} />
          <Text style={styles.capitalValue}>K{Number(s?.current_capital ?? 0).toLocaleString()}</Text>
          <Text style={typography.caption}>Current capital</Text>
          <View style={styles.capitalRow}>
            <View style={styles.capitalCol}>
              <Text style={styles.capitalColValue}>K{Number(s?.cash_available ?? 0).toLocaleString()}</Text>
              <Text style={typography.caption}>Cash available</Text>
            </View>
            <View style={styles.capitalCol}>
              <Text style={styles.capitalColValue}>K{Number(s?.inventory_value ?? 0).toLocaleString()}</Text>
              <Text style={typography.caption}>Inventory value</Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This period</Text>
        <Card>
          <View style={styles.periodRow}>
            <Text style={typography.body}>Expenses</Text>
            <Text style={styles.periodValueDanger}>K{Number(s?.total_expenses ?? 0).toLocaleString()}</Text>
          </View>
          <View style={styles.periodDivider} />
          <View style={styles.periodRow}>
            <Text style={typography.body}>Net profit</Text>
            <Text style={styles.periodValue}>K{Number(s?.net_profit ?? 0).toLocaleString()}</Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.primary[600],
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  welcomeText: { fontSize: 22, fontWeight: '700', color: colors.white },
  dateText: { fontSize: 13, color: colors.primary[100], marginTop: 4 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  alertText: { fontSize: 13, color: colors.warning, fontWeight: '600', flex: 1 },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  statCard: { flexGrow: 1, minWidth: '45%' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.gray[900], marginTop: 4 },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[900], marginBottom: spacing.sm },
  capitalCard: { alignItems: 'center', paddingVertical: spacing.lg },
  capitalValue: { fontSize: 32, fontWeight: '700', color: colors.gray[900], marginTop: spacing.xs },
  capitalRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.gray[100], width: '100%', justifyContent: 'center' },
  capitalCol: { alignItems: 'center' },
  capitalColValue: { fontSize: 15, fontWeight: '700', color: colors.gray[900] },
  periodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  periodValue: { fontSize: 16, fontWeight: '700', color: colors.primary[700] },
  periodValueDanger: { fontSize: 16, fontWeight: '700', color: colors.danger },
  periodDivider: { height: 1, backgroundColor: colors.gray[100] },
});
