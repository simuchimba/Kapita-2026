import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { History, Trash2 } from 'lucide-react-native';
import { billingAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import SearchInput from '../../src/components/ui/SearchInput';
import FilterChips from '../../src/components/ui/FilterChips';
import EmptyState from '../../src/components/ui/EmptyState';
import Modal from '../../src/components/ui/Modal';
import { badgeTone, formatStatus, statusOptions } from '../../src/utils/adminStatus';
import { colors, spacing, typography } from '../../src/constants/theme';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  business_name?: string;
  date_joined?: string;
  access_status?: string;
  days_remaining?: number;
}

interface Subscription {
  id: number;
  start_date: string;
  end_date: string;
  status: string;
  notes?: string;
}

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [history, setHistory] = useState<Subscription[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const data = await billingAPI.getAdminUsers({ search, status: statusFilter });
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      setUsers([]);
      setError('Failed to load users. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openHistory = async (user: AdminUser) => {
    setSelectedUser(user);
    setShowHistory(true);
    try {
      const data = await billingAPI.getSubscriptionHistory(user.id);
      setHistory(data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load subscription history');
    }
  };

  const confirmDelete = (user: AdminUser) => {
    setUserToDelete(user);
    setShowDelete(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    try {
      await billingAPI.deleteUser(userToDelete.id);
      setShowDelete(false);
      setUserToDelete(null);
      load();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete user');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <SearchInput
          placeholder="Search name, email, or business"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load()}
          returnKeyType="search"
        />
        <FilterChips options={statusOptions} value={statusFilter} onChange={(v) => setStatusFilter(v)} />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        onScrollBeginDrag={() => {}}
        ListEmptyComponent={!loading ? <EmptyState message="No users found." /> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {`${item.first_name || ''} ${item.last_name || ''}`.trim() || item.username}
                </Text>
                <Text style={typography.caption}>{item.email}</Text>
                {item.business_name ? <Text style={typography.caption}>{item.business_name}</Text> : null}
              </View>
              <Badge label={formatStatus(item.access_status)} tone={badgeTone(item.access_status)} />
            </View>

            <View style={styles.metaRow}>
              <Text style={typography.caption}>
                {item.days_remaining ?? 0} day{item.days_remaining === 1 ? '' : 's'} left
              </Text>
              <Text style={typography.caption}>
                Joined {item.date_joined ? new Date(item.date_joined).toLocaleDateString() : '—'}
              </Text>
            </View>

            <View style={styles.actions}>
              <Button title="Subscriptions" size="sm" variant="secondary" onPress={() => openHistory(item)} />
              <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(item)}>
                <Trash2 size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      <Modal visible={showHistory} onClose={() => setShowHistory(false)} title={`Subscriptions — ${selectedUser?.username || ''}`}>
        {history.length === 0 ? (
          <EmptyState message="No subscription history found." />
        ) : (
          history.map((sub) => (
            <Card key={sub.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.name}>Subscription #{sub.id}</Text>
                <Badge label={sub.status} tone={badgeTone(sub.status)} />
              </View>
              <Text style={[typography.caption, { marginTop: spacing.xs }]}>
                {new Date(sub.start_date).toLocaleDateString()} → {new Date(sub.end_date).toLocaleDateString()}
              </Text>
              {sub.notes ? <Text style={[typography.caption, { marginTop: 2 }]}>{sub.notes}</Text> : null}
            </Card>
          ))
        )}
      </Modal>

      <Modal visible={showDelete} onClose={() => setShowDelete(false)} title="Delete user">
        <Text style={typography.body}>
          Delete <Text style={{ fontWeight: '700' }}>{userToDelete?.username}</Text>? This cannot be undone.
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <Button title="Cancel" variant="secondary" style={{ flex: 1 }} onPress={() => setShowDelete(false)} />
          <Button title="Delete" variant="danger" style={{ flex: 1 }} onPress={deleteUser} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  filters: { padding: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  errorBox: { marginHorizontal: spacing.md, marginTop: spacing.sm, backgroundColor: colors.dangerBg, borderRadius: 12, padding: spacing.sm },
  errorText: { color: colors.danger, fontSize: 13 },
  name: { fontSize: 15, fontWeight: '600', color: colors.gray[900] },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  deleteBtn: { padding: spacing.xs, borderRadius: 8, backgroundColor: colors.dangerBg },
});
