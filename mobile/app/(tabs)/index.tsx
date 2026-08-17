import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AlertTriangle, Mic, Package, ShoppingCart, TrendingUp, Users, Wallet } from 'lucide-react-native';
import { analyticsAPI } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useAppTheme } from '../../src/context/ThemeContext';
import Card from '../../src/components/ui/Card';
import VoiceEntryModal from '../../src/components/voice/VoiceEntryModal';
import { radius, spacing } from '../../src/constants/theme';

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

function StatCard({ label, value, icon: Icon, tone, colors }: { label: string; value: string; icon: any; tone: { bg: string; fg: string }; colors: any }) {
  return (
    <Card style={styles.statCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>{label}</Text>
          <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
          <Icon size={20} color={tone.fg} />
        </View>
      </View>
    </Card>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showVoiceEntry, setShowVoiceEntry] = useState(false);

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

  const tones = {
    primary: { bg: colors.primary[100], fg: colors.primary[700] },
    blue: { bg: '#dbeafe', fg: '#1d4ed8' },
    red: { bg: colors.dangerBg, fg: colors.danger },
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.white} />}
      >
        <View style={[styles.header, { backgroundColor: colors.primary[600] }]}>
          <Text style={styles.welcomeText}>Welcome, {user?.business_name || user?.first_name || 'there'}</Text>
          <Text style={[styles.dateText, { color: colors.primary[100] }]}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        <TouchableOpacity style={[styles.tellKapita, { backgroundColor: colors.card, borderColor: colors.primary[200] }]} onPress={() => setShowVoiceEntry(true)}>
          <View style={[styles.tellKapitaIcon, { backgroundColor: colors.primary[600] }]}>
            <Mic size={22} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tellKapitaTitle, { color: colors.text }]}>Tell Kapita</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>Just say what happened — Kapita records it</Text>
          </View>
        </TouchableOpacity>

        {!loading && (alerts?.low_stock_count ?? 0) > 0 && (
          <View style={[styles.alertBanner, { backgroundColor: colors.warningBg }]}>
            <AlertTriangle size={16} color={colors.warning} />
            <Text style={[styles.alertText, { color: colors.warning }]}>
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
          <StatCard label="Total Revenue" value={`K${Number(s?.total_revenue ?? 0).toLocaleString()}`} icon={TrendingUp} tone={tones.primary} colors={colors} />
          <StatCard label="Products" value={String(counts?.products ?? 0)} icon={Package} tone={tones.blue} colors={colors} />
          <StatCard label="Customers" value={String(counts?.customers ?? 0)} icon={Users} tone={tones.blue} colors={colors} />
          <StatCard label="Owed to You" value={`K${Number(s?.credit_outstanding ?? 0).toLocaleString()}`} icon={ShoppingCart} tone={tones.red} colors={colors} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Business Capital</Text>
          <Card style={styles.capitalCard}>
            <Wallet size={28} color={colors.primary[600]} />
            <Text style={[styles.capitalValue, { color: colors.text }]}>K{Number(s?.current_capital ?? 0).toLocaleString()}</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>Current capital</Text>
            <View style={[styles.capitalRow, { borderTopColor: colors.border }]}>
              <View style={styles.capitalCol}>
                <Text style={[styles.capitalColValue, { color: colors.text }]}>K{Number(s?.cash_available ?? 0).toLocaleString()}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Cash available</Text>
              </View>
              <View style={styles.capitalCol}>
                <Text style={[styles.capitalColValue, { color: colors.text }]}>K{Number(s?.inventory_value ?? 0).toLocaleString()}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Inventory value</Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>This period</Text>
          <Card>
            <View style={styles.periodRow}>
              <Text style={{ fontSize: 15, color: colors.text }}>Expenses</Text>
              <Text style={[styles.periodValue, { color: colors.danger }]}>K{Number(s?.total_expenses ?? 0).toLocaleString()}</Text>
            </View>
            <View style={[styles.periodDivider, { backgroundColor: colors.border }]} />
            <View style={styles.periodRow}>
              <Text style={{ fontSize: 15, color: colors.text }}>Net profit</Text>
              <Text style={[styles.periodValue, { color: colors.primary[700] }]}>K{Number(s?.net_profit ?? 0).toLocaleString()}</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      <VoiceEntryModal visible={showVoiceEntry} onClose={() => setShowVoiceEntry(false)} onSaved={() => load(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  welcomeText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  dateText: { fontSize: 13, marginTop: 4 },
  tellKapita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  tellKapitaIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tellKapitaTitle: { fontSize: 15, fontWeight: '700' },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  alertText: { fontSize: 13, fontWeight: '600', flex: 1 },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  statCard: { flexGrow: 1, minWidth: '45%' },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.sm },
  capitalCard: { alignItems: 'center', paddingVertical: spacing.lg },
  capitalValue: { fontSize: 32, fontWeight: '700', marginTop: spacing.xs },
  capitalRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, width: '100%', justifyContent: 'center' },
  capitalCol: { alignItems: 'center' },
  capitalColValue: { fontSize: 15, fontWeight: '700' },
  periodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  periodValue: { fontSize: 16, fontWeight: '700' },
  periodDivider: { height: 1 },
});
