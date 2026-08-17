import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { outgoingPaymentsAPI, suppliersAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import Badge from '../../src/components/ui/Badge';
import EmptyState from '../../src/components/ui/EmptyState';
import Modal from '../../src/components/ui/Modal';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

const PAYMENT_TYPES = [
  { value: 'supplier', label: 'Supplier Payment' },
  { value: 'staff', label: 'Staff Salary/Wages' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'rent', label: 'Rent' },
  { value: 'other', label: 'Other Expense' },
];
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

interface Supplier { id: number; name: string; }
interface Payment {
  id: number;
  supplier_details?: Supplier;
  payment_type: string;
  payment_method: string;
  amount: string | number;
  status: string;
  transaction_date: string;
}

const EMPTY_FORM = { supplier: '', payment_type: 'other', payment_method: 'cash', amount: '', reference: '', notes: '' };

export default function OutgoingPaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [paymentsData, suppliersData] = await Promise.all([
        outgoingPaymentsAPI.list(),
        suppliersAPI.list(),
      ]);
      setPayments(paymentsData || []);
      setSuppliers(suppliersData || []);
    } catch (error) {
      console.error('Failed to load outgoing payments:', error);
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

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.amount) {
      Alert.alert('Missing info', 'Please enter an amount');
      return;
    }
    setSaving(true);
    try {
      await outgoingPaymentsAPI.create({ ...form, supplier: form.supplier || null });
      setShowModal(false);
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
        <Text style={typography.title}>Outgoing Payments</Text>
        <Button title="Add" size="sm" onPress={openAdd} />
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No outgoing payments yet." /> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{PAYMENT_TYPES.find((t) => t.value === item.payment_type)?.label || item.payment_type}</Text>
                <Text style={typography.caption}>
                  {item.supplier_details?.name || 'No supplier'} · {PAYMENT_METHODS.find((m) => m.value === item.payment_method)?.label}
                </Text>
              </View>
              <Text style={styles.amount}>K{Number(item.amount).toLocaleString()}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={typography.caption}>{new Date(item.transaction_date).toLocaleDateString()}</Text>
              <Badge label={item.status} tone={item.status === 'completed' ? 'green' : 'amber'} />
            </View>
          </Card>
        )}
      />

      <Modal visible={showModal} onClose={() => setShowModal(false)} title="Record outgoing payment">
        <Text style={styles.label}>Amount (K) *</Text>
        <TextInput style={styles.input} value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} keyboardType="decimal-pad" placeholder="0.00" />

        <Text style={styles.label}>Payment type</Text>
        <View style={styles.chips}>
          {PAYMENT_TYPES.map((opt) => (
            <TouchableOpacity key={opt.value} style={[styles.chip, form.payment_type === opt.value && styles.chipActive]} onPress={() => setForm({ ...form, payment_type: opt.value })}>
              <Text style={[styles.chipText, form.payment_type === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Payment method</Text>
        <View style={styles.chips}>
          {PAYMENT_METHODS.map((opt) => (
            <TouchableOpacity key={opt.value} style={[styles.chip, form.payment_method === opt.value && styles.chipActive]} onPress={() => setForm({ ...form, payment_method: opt.value })}>
              <Text style={[styles.chipText, form.payment_method === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {form.payment_type === 'supplier' && (
          <>
            <Text style={styles.label}>Supplier</Text>
            <View style={styles.chips}>
              {suppliers.map((s) => (
                <TouchableOpacity key={s.id} style={[styles.chip, form.supplier === String(s.id) && styles.chipActive]} onPress={() => setForm({ ...form, supplier: String(s.id) })}>
                  <Text style={[styles.chipText, form.supplier === String(s.id) && styles.chipTextActive]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Reference (optional)</Text>
        <TextInput style={styles.input} value={form.reference} onChangeText={(v) => setForm({ ...form, reference: v })} placeholder="Reference number" />
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput style={styles.input} value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Notes" />

        <Button title="Record payment" loading={saving} onPress={handleSubmit} style={{ marginTop: spacing.sm }} />
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
  name: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  amount: { fontSize: 16, fontWeight: '700', color: colors.danger },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.gray[200] },
  chipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  chipText: { fontSize: 12, color: colors.gray[600] },
  chipTextActive: { color: colors.white, fontWeight: '600' },
});
