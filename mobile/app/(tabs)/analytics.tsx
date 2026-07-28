import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { analyticsAPI } from '../../src/services/api';
import { LineChart, BarChart } from 'react-native-chart-kit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [cashflowData, setCashflowData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashboard, cashflow] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getCashflow(),
      ]);
      setDashboardData(dashboard);
      setCashflowData(cashflow);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#059669',
    },
  };

  const salesData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: dashboardData?.daily_sales || [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const expenseData = {
    labels: ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Other'],
    datasets: [
      {
        data: dashboardData?.expenses_by_category || [0, 0, 0, 0, 0],
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales Trend</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={salesData}
            width={SCREEN_WIDTH - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expenses by Category</Text>
        <View style={styles.chartContainer}>
          <BarChart
            data={expenseData}
            width={SCREEN_WIDTH - 32}
            height={220}
            chartConfig={chartConfig}
            yAxisLabel="$"
            yAxisSuffix=""
            style={styles.chart}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Revenue</Text>
            <Text style={styles.metricValue}>${dashboardData?.total_revenue || '0.00'}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Expenses</Text>
            <Text style={styles.metricValue}>${dashboardData?.total_expenses || '0.00'}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Net Profit</Text>
            <Text style={[
              styles.metricValue,
              (parseFloat(dashboardData?.net_profit || 0) >= 0) ? styles.profit : styles.loss
            ]}>
              ${dashboardData?.net_profit || '0.00'}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Profit Margin</Text>
            <Text style={styles.metricValue}>{dashboardData?.profit_margin || '0'}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cash Flow Summary</Text>
        {cashflowData && (
          <View style={styles.cashflowContainer}>
            <View style={styles.cashflowItem}>
              <Text style={styles.cashflowLabel}>Money In</Text>
              <Text style={styles.cashflowIn}>${cashflowData.money_in || '0.00'}</Text>
            </View>
            <View style={styles.cashflowItem}>
              <Text style={styles.cashflowLabel}>Money Out</Text>
              <Text style={styles.cashflowOut}>${cashflowData.money_out || '0.00'}</Text>
            </View>
            <View style={styles.cashflowItem}>
              <Text style={styles.cashflowLabel}>Net Cash Flow</Text>
              <Text style={[
                styles.cashflowNet,
                (parseFloat(cashflowData.net || 0) >= 0) ? styles.profit : styles.loss
              ]}>
                ${cashflowData.net || '0.00'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    borderRadius: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  profit: {
    color: '#059669',
  },
  loss: {
    color: '#dc2626',
  },
  cashflowContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cashflowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cashflowLabel: {
    fontSize: 14,
    color: '#666',
  },
  cashflowIn: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  cashflowOut: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  cashflowNet: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
