import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { invoicesAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import Badge from '../../src/components/ui/Badge';
import EmptyState from '../../src/components/ui/EmptyState';
import Modal from '../../src/components/ui/Modal';
import { badgeTone, formatStatus } from '../../src/utils/adminStatus';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  issue_date: string;
  due_date: string;
  total_amount: string | number;
  amount_paid: string | number;
  balance_due: string | number;
  status: string;
}

const EMPTY_FORM = {
  customer_name: '', customer_email: '', customer_phone: '',
  due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  description: '', quantity: '1', unit_price: '', notes: '',
};

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await invoicesAPI.list();
      setInvoices(data || []);
    } catch (error) {
      console.error('Failed to load invoices:', error);
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
    const qty = parseInt(form.quantity, 10);
    const price = parseFloat(form.unit_price);
    if (!form.customer_name.trim() || !form.due_date || !form.description.trim() || !qty || !price) {
      Alert.alert('Missing info', 'Please fill in customer name, due date, item description, quantity, and price');
      return;
    }
    setSaving(true);
    try {
      await invoicesAPI.create({
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim() || undefined,
        customer_phone: form.customer_phone.trim() || undefined,
        due_date: form.due_date,
        notes: form.notes,
        items: [{ description: form.description.trim(), quantity: qty, unit_price: price }],
      });
      setShowModal(false);
      load();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = (invoice: Invoice) => {
    Alert.alert('Mark as paid', `Mark invoice ${invoice.invoice_number} as fully paid?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Paid',
        onPress: async () => {
          try {
            await invoicesAPI.markPaid(invoice.id, { amount: invoice.balance_due });
            load();
          } catch (error) {
            Alert.alert('Error', 'Failed to update invoice');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={typography.title}>Invoices</Text>
        <Button title="New Invoice" size="sm" onPress={openAdd} />
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No invoices yet." /> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.customer_name}</Text>
                <Text style={typography.caption}>{item.invoice_number} · Due {new Date(item.due_date).toLocaleDateString()}</Text>
              </View>
              <Badge label={formatStatus(item.status)} tone={badgeTone(item.status)} />
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.amount}>K{Number(item.total_amount).toLocaleString()}</Text>
              <Text style={typography.caption}>Balance K{Number(item.balance_due).toLocaleString()}</Text>
            </View>
            {item.status !== 'paid' && Number(item.balance_due) > 0 && (
              <Button title="Mark Paid" size="sm" variant="secondary" onPress={() => handleMarkPaid(item)} style={{ marginTop: spacing.sm }} />
            )}
          </Card>
        )}
      />

      <Modal visible={showModal} onClose={() => setShowModal(false)} title="New invoice">
        <Text style={styles.label}>Customer name *</Text>
        <TextInput style={styles.input} value={form.customer_name} onChangeText={(v) => setForm({ ...form, customer_name: v })} placeholder="Customer name" />
        <Text style={styles.label}>Customer email (optional)</Text>
        <TextInput style={styles.input} value={form.customer_email} onChangeText={(v) => setForm({ ...form, customer_email: v })} keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.label}>Customer phone (optional)</Text>
        <TextInput style={styles.input} value={form.customer_phone} onChangeText={(v) => setForm({ ...form, customer_phone: v })} keyboardType="phone-pad" />
        <Text style={styles.label}>Due date *</Text>
        <TextInput style={styles.input} value={form.due_date} onChangeText={(v) => setForm({ ...form, due_date: v })} placeholder="YYYY-MM-DD" />

        <Text style={styles.label}>Item description *</Text>
        <TextInput style={styles.input} value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder="e.g. Consulting services" />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput style={styles.input} value={form.quantity} onChangeText={(v) => setForm({ ...form, quantity: v })} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Unit price (K) *</Text>
            <TextInput style={styles.input} value={form.unit_price} onChangeText={(v) => setForm({ ...form, unit_price: v })} keyboardType="decimal-pad" />
          </View>
        </View>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput style={styles.input} value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Notes" />

        <Button title="Create invoice" loading={saving} onPress={handleSubmit} style={{ marginTop: spacing.sm }} />
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
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  amount: { fontSize: 16, fontWeight: '700', color: colors.primary[700] },
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
});
