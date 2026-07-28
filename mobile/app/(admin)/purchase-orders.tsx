import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { billingAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import SearchInput from '../../src/components/ui/SearchInput';
import FilterChips from '../../src/components/ui/FilterChips';
import EmptyState from '../../src/components/ui/EmptyState';
import { colors, spacing, typography } from '../../src/constants/theme';

interface PurchaseOrder {
  id: number;
  user?: { username: string; email: string; first_name?: string; last_name?: string };
  supplier_details?: { name: string };
  order_date?: string;
  expected_delivery_date?: string;
  status: string;
  total_amount: number;
}

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Ordered', value: 'ordered' },
  { label: 'Received', value: 'received' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_TONE: Record<string, 'amber' | 'blue' | 'green' | 'red' | 'gray'> = {
  pending: 'amber',
  ordered: 'blue',
  received: 'green',
  cancelled: 'red',
};

export default function AdminPurchaseOrders() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await billingAPI.getAdminPurchaseOrders({ search, status });
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, status]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <SearchInput placeholder="Search PO ID or supplier…" value={search} onChangeText={setSearch} onSubmitEditing={() => load()} returnKeyType="search" />
        <FilterChips options={STATUS_OPTIONS} value={status} onChange={setStatus} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No purchase orders found." /> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>PO #{item.id} — {item.supplier_details?.name || '—'}</Text>
                <Text style={typography.caption}>
                  {item.user ? `${item.user.first_name || ''} ${item.user.last_name || ''}`.trim() || item.user.username : '—'} · {item.user?.email}
                </Text>
              </View>
              <Badge label={item.status} tone={STATUS_TONE[item.status] || 'gray'} />
            </View>
            <View style={styles.metaRow}>
              <Text style={typography.caption}>
                {item.order_date ? new Date(item.order_date).toLocaleDateString() : '—'}
                {item.expected_delivery_date ? ` → ${new Date(item.expected_delivery_date).toLocaleDateString()}` : ''}
              </Text>
              <Text style={styles.amount}>K{Number(item.total_amount).toLocaleString()}</Text>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  filters: { padding: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  title: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  amount: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
});
