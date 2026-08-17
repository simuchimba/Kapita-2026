import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { analyticsAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import { colors, spacing, typography } from '../../src/constants/theme';

export default function ProjectionsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const result = await analyticsAPI.getProjections();
      setData(result);
    } catch (error) {
      console.error('Failed to load projections:', error);
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

  const projections = data?.projections_30_days;
  const insights = data?.insights;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
    >
      <Card style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        {insights?.is_profitable ? <TrendingUp size={28} color={colors.primary[600]} /> : <TrendingDown size={28} color={colors.danger} />}
        <Text style={typography.caption}>30-day projected profit</Text>
        <Text style={[styles.bigValue, { color: insights?.is_profitable ? colors.primary[700] : colors.danger }]}>
          K{Number(projections?.projected_profit ?? 0).toLocaleString()}
        </Text>
        <Badge label={insights?.is_profitable ? 'On track' : 'At risk'} tone={insights?.is_profitable ? 'green' : 'red'} />
      </Card>

      <View style={styles.grid}>
        <Card style={styles.gridCard}>
          <Text style={typography.caption}>Projected revenue</Text>
          <Text style={styles.metricValue}>K{Number(projections?.projected_revenue ?? 0).toLocaleString()}</Text>
        </Card>
        <Card style={styles.gridCard}>
          <Text style={typography.caption}>Projected expenses</Text>
          <Text style={[styles.metricValue, { color: colors.danger }]}>K{Number(projections?.projected_expenses ?? 0).toLocaleString()}</Text>
        </Card>
        <Card style={styles.gridCard}>
          <Text style={typography.caption}>Outstanding credit</Text>
          <Text style={styles.metricValue}>K{Number(projections?.outstanding_credit ?? 0).toLocaleString()}</Text>
        </Card>
        <Card style={styles.gridCard}>
          <Text style={typography.caption}>Expected income</Text>
          <Text style={styles.metricValue}>K{Number(projections?.expected_income ?? 0).toLocaleString()}</Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Based on your current averages</Text>
        <View style={styles.row}>
          <Text style={typography.caption}>Avg. transaction value</Text>
          <Text style={styles.rowValue}>K{Number(data?.averages?.avg_transaction ?? 0).toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={typography.caption}>Avg. expense</Text>
          <Text style={styles.rowValue}>K{Number(data?.averages?.avg_expense ?? 0).toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={typography.caption}>Projected margin</Text>
          <Text style={styles.rowValue}>{Number(insights?.profit_margin ?? 0).toFixed(1)}%</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] },
  bigValue: { fontSize: 28, fontWeight: '700', marginTop: 4, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridCard: { flexGrow: 1, minWidth: '45%' },
  metricValue: { fontSize: 17, fontWeight: '700', color: colors.gray[900], marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[900], marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowValue: { fontSize: 13, fontWeight: '600', color: colors.gray[900] },
});
