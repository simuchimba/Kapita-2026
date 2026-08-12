import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { analyticsAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Summary {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  current_capital: number;
}
interface Cashflow {
  money_in: { total: number; sales: number; credit_payments: number };
  money_out: { total: number; expenses: number; reinvestments: number; outgoing_payments: number };
  net_cashflow: number;
}
interface MonthRow {
  month_short: string;
  total_sales: number;
  net_profit: number;
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0.03, Math.min(1, value / max)) : 0.03;
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={typography.caption}>{label}</Text>
        <Text style={styles.barValue}>K{Number(value).toLocaleString()}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [cashflow, setCashflow] = useState<Cashflow | null>(null);
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [dashboard, cashflowData, monthly] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getCashflow(),
        analyticsAPI.getMonthly(),
      ]);
      setSummary(dashboard?.summary || null);
      setCashflow(cashflowData || null);
      setMonths(monthly?.months || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={typography.subtitle}>Loading…</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: colors.white,
    backgroundGradientFrom: colors.white,
    backgroundGradientTo: colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
    style: { borderRadius: radius.lg },
    propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary[600] },
  };

  const hasSalesData = months.some((m) => m.total_sales > 0);
  const maxMoney = Math.max(cashflow?.money_in.total ?? 0, cashflow?.money_out.total ?? 0, 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
    >
      <View style={styles.metricsContainer}>
        <Card style={styles.metricCard}>
          <Text style={typography.caption}>Revenue</Text>
          <Text style={styles.metricValue}>K{Number(summary?.total_revenue ?? 0).toLocaleString()}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={typography.caption}>Expenses</Text>
          <Text style={[styles.metricValue, styles.loss]}>K{Number(summary?.total_expenses ?? 0).toLocaleString()}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={typography.caption}>Net Profit</Text>
          <Text style={[styles.metricValue, (summary?.net_profit ?? 0) >= 0 ? styles.profit : styles.loss]}>
            K{Number(summary?.net_profit ?? 0).toLocaleString()}
          </Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={typography.caption}>Capital</Text>
          <Text style={styles.metricValue}>K{Number(summary?.current_capital ?? 0).toLocaleString()}</Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Sales trend (this year)</Text>
        {hasSalesData ? (
          <LineChart
            data={{
              labels: months.map((m) => m.month_short),
              datasets: [{ data: months.map((m) => m.total_sales) }],
            }}
            width={SCREEN_WIDTH - spacing.md * 2 - spacing.md * 2}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: radius.lg, marginTop: spacing.sm }}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={typography.caption}>No sales recorded yet this year.</Text>
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Cash flow</Text>
        <View style={{ marginTop: spacing.sm }}>
          <Bar label="Money in" value={cashflow?.money_in.total ?? 0} max={maxMoney} color={colors.primary[600]} />
          <Bar label="Money out" value={cashflow?.money_out.total ?? 0} max={maxMoney} color={colors.danger} />
        </View>
        <View style={styles.netCashflowRow}>
          <Text style={typography.body}>Net cash flow</Text>
          <Text style={[styles.metricValue, (cashflow?.net_cashflow ?? 0) >= 0 ? styles.profit : styles.loss]}>
            K{Number(cashflow?.net_cashflow ?? 0).toLocaleString()}
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] },
  metricsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { flexGrow: 1, minWidth: '45%' },
  metricValue: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginTop: 4 },
  profit: { color: colors.primary[700] },
  loss: { color: colors.danger },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  emptyChart: { height: 120, alignItems: 'center', justifyContent: 'center' },
  barTrack: { height: 10, borderRadius: radius.full, backgroundColor: colors.gray[100], overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.full },
  barValue: { fontSize: 12, fontWeight: '600', color: colors.gray[700] },
  netCashflowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});
