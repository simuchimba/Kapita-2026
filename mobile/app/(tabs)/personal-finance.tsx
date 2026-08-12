import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { personalFinanceAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import EmptyState from '../../src/components/ui/EmptyState';
import Modal from '../../src/components/ui/Modal';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface Option { value: string; label: string; }
interface Transaction {
  id: number;
  title: string;
  amount: string | number;
  transaction_type: string;
  category_label: string;
  date: string;
}

const EMPTY_FORM = { title: '', amount: '', transaction_type: 'expense', category: 'other', date: new Date().toISOString().slice(0, 10), notes: '' };

export default function PersonalFinanceScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [types, setTypes] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [txData, typesData, categoriesData, summaryData] = await Promise.all([
        personalFinanceAPI.getTransactions(),
        personalFinanceAPI.getTypes(),
        personalFinanceAPI.getCategories(),
        personalFinanceAPI.getSummary(),
      ]);
      setTransactions(txData || []);
      setTypes(typesData || []);
      setCategories(categoriesData || []);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load personal finance:', error);
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
    if (!form.title.trim() || !form.amount || !form.transaction_type) {
      Alert.alert('Missing info', 'Please fill in title, amount, and type');
      return;
    }
    setSaving(true);
    try {
      await personalFinanceAPI.create(form);
      setShowModal(false);
      load();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={typography.title}>Personal Finance</Text>
        <Button title="Add" size="sm" onPress={openAdd} />
      </View>

      {summary && (
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={typography.caption}>Income</Text>
            <Text style={[styles.summaryValue, { color: colors.primary[700] }]}>K{Number(summary.total_income || 0).toLocaleString()}</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={typography.caption}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>K{Number(summary.total_expenses || 0).toLocaleString()}</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={typography.caption}>Balance</Text>
            <Text style={styles.summaryValue}>K{Number(summary.net_balance || 0).toLocaleString()}</Text>
          </Card>
        </View>
      )}

      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, paddingTop: spacing.sm, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No personal transactions yet." /> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.title}</Text>
                <Text style={typography.caption}>{item.category_label} · {new Date(item.date).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.amount, { color: item.transaction_type === 'expense' ? colors.danger : colors.primary[700] }]}>
                {item.transaction_type === 'expense' ? '-' : '+'}K{Number(item.amount).toLocaleString()}
              </Text>
            </View>
          </Card>
        )}
      />

      <Modal visible={showModal} onClose={() => setShowModal(false)} title="Add transaction">
        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholder="e.g. Salary" />
        <Text style={styles.label}>Amount (K) *</Text>
        <TextInput style={styles.input} value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} keyboardType="decimal-pad" placeholder="0.00" />

        <Text style={styles.label}>Type *</Text>
        <View style={styles.chips}>
          {types.map((opt) => (
            <TouchableOpacity key={opt.value} style={[styles.chip, form.transaction_type === opt.value && styles.chipActive]} onPress={() => setForm({ ...form, transaction_type: opt.value })}>
              <Text style={[styles.chipText, form.transaction_type === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {categories.map((opt) => (
            <TouchableOpacity key={opt.value} style={[styles.chip, form.category === opt.value && styles.chipActive]} onPress={() => setForm({ ...form, category: opt.value })}>
              <Text style={[styles.chipText, form.category === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} placeholder="YYYY-MM-DD" />
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput style={styles.input} value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Notes" />

        <Button title="Save transaction" loading={saving} onPress={handleSubmit} style={{ marginTop: spacing.sm }} />
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
  summaryValue: { fontSize: 15, fontWeight: '700', color: colors.gray[900], marginTop: 4 },
  name: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  amount: { fontSize: 16, fontWeight: '700' },
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
