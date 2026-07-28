import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, Image, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BadgeCheck, Ban } from 'lucide-react-native';
import { billingAPI, getToken } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import FilterChips from '../../src/components/ui/FilterChips';
import EmptyState from '../../src/components/ui/EmptyState';
import { badgeTone, formatStatus } from '../../src/utils/adminStatus';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface Payment {
  id: number;
  user_username: string;
  user_email: string;
  user_business_name?: string;
  transaction_id: string;
  amount: number;
  status: string;
  admin_notes?: string;
  proof_image_url?: string;
  created_at: string;
}

const FILTERS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: '' },
];

export default function AdminPayments() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState('pending');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    getToken().then(setAuthToken);
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await billingAPI.getAdminPayments({ status: filter });
      setPayments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const approve = async (id: number) => {
    setSaving(true);
    try {
      await billingAPI.approvePayment(id, { notes: notes[id] || '' });
      Alert.alert('Approved', '30-day subscription activated.');
      load();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to approve');
    } finally {
      setSaving(false);
    }
  };

  const reject = async (id: number) => {
    setSaving(true);
    try {
      await billingAPI.rejectPayment(id, { notes: notes[id] || '' });
      Alert.alert('Rejected', 'Payment marked as rejected.');
      load();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to reject');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No payments in this category." /> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.user_business_name || item.user_username}</Text>
                <Text style={typography.caption}>{item.user_email}</Text>
                <Text style={[typography.caption, { marginTop: 2 }]}>TX: {item.transaction_id}</Text>
              </View>
              <Badge label={formatStatus(item.status)} tone={badgeTone(item.status)} />
            </View>

            <View style={styles.metaRow}>
              <Text style={typography.body}>K{Number(item.amount).toLocaleString()}</Text>
              <Text style={typography.caption}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>

            {item.proof_image_url && authToken && (
              <Image
                source={{ uri: `${item.proof_image_url}${item.proof_image_url.includes('?') ? '&' : '?'}token=${authToken}` }}
                style={styles.proofImage}
                resizeMode="contain"
              />
            )}

            {item.status === 'pending' && (
              <>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Admin notes (optional)"
                  placeholderTextColor={colors.gray[400]}
                  multiline
                  value={notes[item.id] || ''}
                  onChangeText={(text) => setNotes((prev) => ({ ...prev, [item.id]: text }))}
                />
                <View style={styles.actions}>
                  <Button title="Approve" size="sm" loading={saving} onPress={() => approve(item.id)} />
                  <Button title="Reject" size="sm" variant="secondary" loading={saving} onPress={() => reject(item.id)} />
                </View>
              </>
            )}

            {item.admin_notes ? (
              <Text style={[typography.caption, { marginTop: spacing.sm }]}>Notes: {item.admin_notes}</Text>
            ) : null}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  filters: { padding: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  name: { fontSize: 15, fontWeight: '600', color: colors.gray[900] },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  proofImage: { width: '100%', height: 180, borderRadius: radius.md, backgroundColor: colors.gray[100], marginTop: spacing.sm },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.gray[900],
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
