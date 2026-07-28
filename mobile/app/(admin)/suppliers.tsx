import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { billingAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import SearchInput from '../../src/components/ui/SearchInput';
import EmptyState from '../../src/components/ui/EmptyState';
import { colors, spacing, typography } from '../../src/constants/theme';

interface Supplier {
  id: number;
  user?: { username: string; email: string; first_name?: string; last_name?: string };
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  created_at?: string;
}

export default function AdminSuppliers() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await billingAPI.getAdminSuppliers({ search });
      setSuppliers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <SearchInput placeholder="Search name, email, or phone…" value={search} onChangeText={setSearch} onSubmitEditing={() => load()} returnKeyType="search" />
      </View>

      <FlatList
        data={suppliers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No suppliers found." /> : null}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={typography.caption}>
              {item.user ? `${item.user.first_name || ''} ${item.user.last_name || ''}`.trim() || item.user.username : '—'} · {item.user?.email}
            </Text>
            <View style={styles.metaRow}>
              <Text style={typography.caption}>{item.contact_person || '—'}</Text>
              <Text style={typography.caption}>{item.phone || item.email || '—'}</Text>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  filters: { padding: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  title: { fontSize: 15, fontWeight: '600', color: colors.gray[900] },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
});
