import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { creditsAPI, customersAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import Badge from '../../src/components/ui/Badge';
import EmptyState from '../../src/components/ui/EmptyState';
import Modal from '../../src/components/ui/Modal';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface Customer { id: number; name: string; }
interface Credit {
  id: number;
  customer_details?: Customer;
  amount_owed: string | number;
  amount_paid: string | number;
  status: string;
  due_date: string;
}

const EMPTY_FORM = { customer: '', amount_owed: '', due_date: '', notes: '' };

export default function CreditsScreen() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [paymentAmount, setPaymentAmount] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [creditsData, customersData, summaryData] = await Promise.all([
        creditsAPI.list(),
        customersAPI.list(),
        creditsAPI.getSummary(),
      ]);
      setCredits(creditsData || []);
      setCustomers(customersData || []);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load credits:', error);
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

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setShowAddModal(true);
  };

  const handleAddCredit = async () => {
    if (!form.customer || !form.amount_owed) {
      Alert.alert('Missing info', 'Please select a customer and amount owed');
      return;
    }
    setSaving(true);
    try {
      await creditsAPI.create({ ...form, borrow_date: new Date().toISOString().slice(0, 10) });
      setShowAddModal(false);
      load();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add credit');
    } finally {
      setSaving(false);
    }
  };

  const openPayment = (credit: Credit) => {
    setSelectedCredit(credit);
    setPaymentAmount('');
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!paymentAmount || !selectedCredit) {
      Alert.alert('Missing info', 'Please enter a payment amount');
      return;
    }
    setSaving(true);
    try {
      await creditsAPI.recordPayment(selectedCredit.id, { amount: paymentAmount });
      setShowPaymentModal(false);
      load();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={typography.title}>Credits</Text>
        <Button title="Add Credit" size="sm" onPress={openAddModal} />
      </View>

      {summary && (
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={typography.caption}>Owed</Text>
            <Text style={styles.summaryValue}>K{Number(summary.total_owed || 0).toLocaleString()}</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={typography.caption}>Paid</Text>
            <Text style={[styles.summaryValue, { color: colors.primary[700] }]}>K{Number(summary.total_paid || 0).toLocaleString()}</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={typography.caption}>Outstanding</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>K{Number(summary.total_outstanding || 0).toLocaleString()}</Text>
          </Card>
        </View>
      )}

      <FlatList
        data={credits}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, paddingTop: spacing.sm, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No credits yet." /> : null}
        renderItem={({ item }) => {
          const remaining = Number(item.amount_owed) - Number(item.amount_paid);
          return (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={styles.name}>{item.customer_details?.name || 'N/A'}</Text>
                <Badge label={item.status} tone={item.status === 'paid' ? 'green' : item.status === 'overdue' ? 'red' : 'blue'} />
              </View>
              <View style={styles.metaRow}>
                <Text style={typography.caption}>Owed K{Number(item.amount_owed).toLocaleString()}</Text>
                <Text style={typography.caption}>Paid K{Number(item.amount_paid).toLocaleString()}</Text>
              </View>
              <Text style={styles.remaining}>Remaining K{remaining.toLocaleString()}</Text>
              {item.status !== 'paid' && (
                <Button title="Record Payment" size="sm" variant="secondary" onPress={() => openPayment(item)} style={{ marginTop: spacing.sm }} />
              )}
            </Card>
          );
        }}
      />

      <Modal visible={showAddModal} onClose={() => setShowAddModal(false)} title="Add credit">
        <Text style={styles.label}>Customer *</Text>
        <View style={styles.pickerList}>
          {customers.length === 0 && <Text style={typography.caption}>No customers yet — add one in the Customers tab first.</Text>}
          {customers.map((c) => (
            <Card key={c.id} style={[styles.pickerRow, form.customer === String(c.id) && styles.pickerRowActive]}>
              <Text
                onPress={() => setForm({ ...form, customer: String(c.id) })}
                style={form.customer === String(c.id) ? styles.pickerRowTextActive : styles.pickerRowText}
              >
                {c.name}
              </Text>
            </Card>
          ))}
        </View>

        <Text style={styles.label}>Amount owed (K) *</Text>
        <TextInput style={styles.input} value={form.amount_owed} onChangeText={(v) => setForm({ ...form, amount_owed: v })} keyboardType="decimal-pad" placeholder="0.00" />

        <Text style={styles.label}>Due date (optional)</Text>
        <TextInput style={styles.input} value={form.due_date} onChangeText={(v) => setForm({ ...form, due_date: v })} placeholder="YYYY-MM-DD" />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput style={styles.input} value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Notes" />

        <Button title="Save credit" loading={saving} onPress={handleAddCredit} style={{ marginTop: spacing.sm }} />
      </Modal>

      <Modal visible={showPaymentModal} onClose={() => setShowPaymentModal(false)} title={`Record payment — ${selectedCredit?.customer_details?.name || ''}`}>
        <Text style={styles.label}>Amount (K) *</Text>
        <TextInput style={styles.input} value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="decimal-pad" placeholder="0.00" />
        <Button title="Record payment" loading={saving} onPress={handlePayment} style={{ marginTop: spacing.sm }} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, paddingBottom: 0 },
  summaryCard: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginTop: 4 },
  name: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  remaining: { fontSize: 16, fontWeight: '700', color: colors.danger, marginTop: spacing.xs },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray[700], marginBottom: 4, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  pickerList: { maxHeight: 150, gap: spacing.xs },
  pickerRow: { paddingVertical: spacing.sm },
  pickerRowActive: { backgroundColor: colors.primary[50], borderColor: colors.primary[200] },
  pickerRowText: { fontSize: 14, color: colors.gray[700] },
  pickerRowTextActive: { fontSize: 14, color: colors.primary[700], fontWeight: '600' },
});
