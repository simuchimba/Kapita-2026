import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { analyticsAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={bold ? styles.rowLabelBold : typography.caption}>{label}</Text>
      <Text style={bold ? styles.rowValueBold : styles.rowValue}>K{Number(value).toLocaleString()}</Text>
    </View>
  );
}

export default function CashFlowScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const result = await analyticsAPI.getCashFlowStatement();
      setData(result);
    } catch (error) {
      console.error('Failed to load cash flow statement:', error);
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
    >
      {data?.period && <Text style={typography.caption}>{data.period.label}</Text>}

      <Card style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        <Text style={typography.caption}>Net cash change</Text>
        <Text style={[styles.netValue, { color: data?.summary?.is_positive ? colors.primary[700] : colors.danger }]}>
          K{Number(data?.summary?.net_cash_change ?? 0).toLocaleString()}
        </Text>
        <Badge label={data?.summary?.is_positive ? 'Positive' : 'Negative'} tone={data?.summary?.is_positive ? 'green' : 'red'} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Operating activities</Text>
        <Row label="Cash sales" value={data?.operating_activities?.inflows?.cash_sales ?? 0} />
        <Row label="Mobile money sales" value={data?.operating_activities?.inflows?.mobile_money_sales ?? 0} />
        <Row label="Credit collected" value={data?.operating_activities?.inflows?.credit_deposits_collected ?? 0} />
        <Row label="Total inflows" value={data?.operating_activities?.inflows?.total ?? 0} bold />
        <View style={styles.divider} />
        <Row label="Stock purchases" value={data?.operating_activities?.outflows?.stock_purchases ?? 0} />
        <Row label="Salaries" value={data?.operating_activities?.outflows?.salaries ?? 0} />
        <Row label="Rent" value={data?.operating_activities?.outflows?.rent ?? 0} />
        <Row label="Utilities" value={data?.operating_activities?.outflows?.utilities ?? 0} />
        <Row label="Total outflows" value={data?.operating_activities?.outflows?.total ?? 0} bold />
        <View style={styles.divider} />
        <Row label="Net operating" value={data?.operating_activities?.net ?? 0} bold />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Investing activities</Text>
        <Row label="Reinvestments" value={data?.investing_activities?.reinvestments ?? 0} />
        <Row label="Net investing" value={data?.investing_activities?.net ?? 0} bold />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Financing activities</Text>
        <Row label="Personal withdrawals" value={data?.financing_activities?.personal_withdrawals ?? 0} />
        <Row label="Net financing" value={data?.financing_activities?.net ?? 0} bold />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] },
  netValue: { fontSize: 28, fontWeight: '700', marginTop: 4, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[900], marginBottom: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowValue: { fontSize: 13, color: colors.gray[700] },
  rowLabelBold: { fontSize: 13, fontWeight: '700', color: colors.gray[900] },
  rowValueBold: { fontSize: 13, fontWeight: '700', color: colors.gray[900] },
  divider: { height: 1, backgroundColor: colors.gray[100], marginVertical: spacing.xs },
});
