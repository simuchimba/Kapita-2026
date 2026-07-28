import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { billingAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import SearchInput from '../../src/components/ui/SearchInput';
import EmptyState from '../../src/components/ui/EmptyState';
import { badgeTone, formatStatus } from '../../src/utils/adminStatus';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  access_status?: string;
  days_remaining?: number;
  expiry_date?: string;
}

interface Subscription {
  id: number;
  start_date: string;
  end_date: string;
  status: string;
  notes?: string;
  source_payment_id?: number | null;
}

export default function AdminSubscriptions() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [history, setHistory] = useState<Subscription[]>([]);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState('30');
  const [notes, setNotes] = useState('');

  useFocusEffect(
    useCallback(() => {
      billingAPI.getAdminUsers().then((data) => setUsers(data || [])).catch(console.error);
    }, [])
  );

  const filtered = users.filter((u) =>
    !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectUser = async (user: AdminUser) => {
    setSelected(user);
    setHistory([]);
    try {
      const data = await billingAPI.getSubscriptionHistory(user.id);
      setHistory(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshHistory = async () => {
    if (!selected) return;
    const data = await billingAPI.getSubscriptionHistory(selected.id);
    setHistory(data || []);
  };

  const runAction = async (action: 'create' | 'extend' | 'revoke') => {
    if (!selected) return;
    const numDays = Number(days);
    if (action !== 'revoke' && (!numDays || numDays < 1)) {
      Alert.alert('Invalid', 'Enter a valid number of days.');
      return;
    }
    setSaving(true);
    try {
      if (action === 'revoke') {
        await billingAPI.revokeSubscription(selected.id);
        Alert.alert('Done', 'Subscription revoked.');
      } else {
        await billingAPI.extendSubscription(selected.id, { days: numDays, notes: notes || (action === 'create' ? 'Manual subscription' : '') });
        Alert.alert('Done', action === 'create' ? 'Manual subscription created.' : 'Subscription extended.');
        setNotes('');
      }
      refreshHistory();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      <Card>
        <Text style={styles.sectionTitle}>Select user</Text>
        <View style={{ marginTop: spacing.sm }}>
          <SearchInput placeholder="Search users…" value={search} onChangeText={setSearch} />
        </View>
        <View style={{ marginTop: spacing.sm, maxHeight: 220 }}>
          <ScrollView nestedScrollEnabled>
            {filtered.slice(0, 30).map((u) => (
              <TouchableOpacity
                key={u.id}
                style={[styles.userRow, selected?.id === u.id && styles.userRowActive]}
                onPress={() => selectUser(u)}
              >
                <Text style={styles.userRowText}>{u.username}</Text>
                <Text style={typography.caption}>{u.days_remaining ?? 0}d left</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Card>

      {selected && (
        <>
          <Card>
            <Text style={styles.sectionTitle}>{selected.username}</Text>
            <Text style={typography.caption}>{selected.email}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
              <Badge label={formatStatus(selected.access_status)} tone={badgeTone(selected.access_status)} />
              <Text style={typography.caption}>{selected.days_remaining ?? 0} days remaining</Text>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Manual actions</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="Days to extend"
              placeholderTextColor={colors.gray[400]}
              value={days}
              onChangeText={setDays}
            />
            <TextInput
              style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.gray[400]}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <Button title="Create manual subscription" loading={saving} onPress={() => runAction('create')} />
              <Button title="Extend subscription" variant="secondary" loading={saving} onPress={() => runAction('extend')} />
              <Button title="Revoke subscription" variant="secondary" loading={saving} onPress={() => runAction('revoke')} />
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>History</Text>
            <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
              {history.length === 0 && <EmptyState message="No subscription records yet." />}
              {history.map((entry) => (
                <View key={entry.id} style={styles.historyRow}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={typography.body}>
                      {new Date(entry.start_date).toLocaleDateString()} → {new Date(entry.end_date).toLocaleDateString()}
                    </Text>
                    <Badge label={entry.status} tone={badgeTone(entry.status)} />
                  </View>
                  {entry.notes ? <Text style={[typography.caption, { marginTop: spacing.xs }]}>{entry.notes}</Text> : null}
                </View>
              ))}
            </View>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  userRowActive: { backgroundColor: colors.primary[50] },
  userRowText: { fontSize: 14, color: colors.gray[800] },
  divider: { height: 1, backgroundColor: colors.gray[100], marginVertical: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.gray[900],
  },
  historyRow: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.md,
    padding: spacing.sm,
  },
});
