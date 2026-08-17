import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { expensesAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import EmptyState from '../../src/components/ui/EmptyState';
import Modal from '../../src/components/ui/Modal';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

const CATEGORY_OPTIONS = [
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'airtime', label: 'Airtime' },
  { value: 'transport', label: 'Transport' },
  { value: 'stock_purchase', label: 'Stock Purchase' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'personal_withdrawal', label: 'Personal Withdrawal' },
  { value: 'other', label: 'Other' },
];

interface Expense {
  id: number;
  title: string;
  amount: string | number;
  category: string;
  date: string;
  notes?: string;
}

const EMPTY_FORM = { title: '', amount: '', category: '', date: new Date().toISOString().slice(0, 10), notes: '' };

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [expensesData, summaryData] = await Promise.all([
        expensesAPI.list(),
        expensesAPI.getSummary(),
      ]);
      setExpenses(expensesData || []);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load expenses:', error);
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
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
      notes: expense.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.amount || !form.category) {
      Alert.alert('Missing info', 'Please fill in title, amount, and category');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await expensesAPI.update(editing.id, form);
      } else {
        await expensesAPI.create(form);
      }
      setShowModal(false);
      load();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (expense: Expense) => {
    Alert.alert('Delete expense', `Delete "${expense.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await expensesAPI.delete(expense.id);
            load();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete expense');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={typography.title}>Expenses</Text>
        <Button title="Add Expense" size="sm" onPress={openAdd} />
      </View>

      {summary && (
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={typography.caption}>Total</Text>
            <Text style={styles.summaryValue}>K{Number(summary.total_expenses || 0).toLocaleString()}</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={typography.caption}>Transactions</Text>
            <Text style={styles.summaryValue}>{summary.expense_count || 0}</Text>
          </Card>
        </View>
      )}

      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, paddingTop: spacing.sm, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No expenses yet." /> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={typography.caption}>
                  {CATEGORY_OPTIONS.find((c) => c.value === item.category)?.label || item.category} · {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.amount}>K{Number(item.amount).toLocaleString()}</Text>
            </View>
            {item.notes ? <Text style={[typography.caption, { marginTop: spacing.xs }]}>{item.notes}</Text> : null}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
                <Pencil size={14} color={colors.gray[600]} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.dangerBg }]} onPress={() => handleDelete(item)}>
                <Trash2 size={14} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      <Modal visible={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit expense' : 'Add expense'}>
        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholder="e.g. Transport to market" />
        <Text style={styles.label}>Amount (K) *</Text>
        <TextInput style={styles.input} value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} keyboardType="decimal-pad" placeholder="0.00" />
        <Text style={styles.label}>Category *</Text>
        <View style={styles.chips}>
          {CATEGORY_OPTIONS.map((opt) => (
            <TouchableOpacity key={opt.value} style={[styles.chip, form.category === opt.value && styles.chipActive]} onPress={() => setForm({ ...form, category: opt.value })}>
              <Text style={[styles.chipText, form.category === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} placeholder="YYYY-MM-DD" />
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput style={styles.input} value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Notes" />
        <Button title="Save expense" loading={saving} onPress={handleSubmit} style={{ marginTop: spacing.sm }} />
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
  title: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  amount: { fontSize: 16, fontWeight: '700', color: colors.danger },
  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, justifyContent: 'flex-end' },
  iconBtn: { padding: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.gray[100] },
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
