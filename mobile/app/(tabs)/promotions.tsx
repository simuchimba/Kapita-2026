import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { promotionsAPI, productsAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import Badge from '../../src/components/ui/Badge';
import EmptyState from '../../src/components/ui/EmptyState';
import Modal from '../../src/components/ui/Modal';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface Product { id: number; name: string; }
interface Promotion {
  id: number;
  name: string;
  description?: string;
  discount_type: string;
  discount_value: string | number;
  start_date: string;
  end_date: string;
  status: string;
  is_currently_active: boolean;
}

const EMPTY_FORM = {
  name: '', description: '', discount_type: 'percentage', discount_value: '',
  start_date: new Date().toISOString().slice(0, 10), end_date: '', applicable_products: '',
};

export default function PromotionsScreen() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [promotionsData, productsData] = await Promise.all([
        promotionsAPI.list(),
        productsAPI.list(),
      ]);
      setPromotions(promotionsData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Failed to load promotions:', error);
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
    if (!form.name.trim() || !form.discount_value || !form.end_date) {
      Alert.alert('Missing info', 'Please fill in name, discount value, and end date');
      return;
    }
    setSaving(true);
    try {
      const { applicable_products, ...rest } = form;
      await promotionsAPI.create({
        ...rest,
        discount_value: parseFloat(form.discount_value),
        product_ids: applicable_products
          ? applicable_products.split(',').map((id) => parseInt(id.trim(), 10)).filter((n) => !isNaN(n))
          : [],
      });
      setShowModal(false);
      load();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create promotion');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (promotion: Promotion) => {
    try {
      await promotionsAPI.toggleStatus(promotion.id);
      load();
    } catch (error) {
      Alert.alert('Error', 'Failed to update promotion');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={typography.title}>Promotions</Text>
        <Button title="New Promotion" size="sm" onPress={openAdd} />
      </View>

      <FlatList
        data={promotions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No promotions yet." /> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                {item.description ? <Text style={typography.caption}>{item.description}</Text> : null}
              </View>
              <Badge label={item.is_currently_active ? 'Active' : 'Inactive'} tone={item.is_currently_active ? 'green' : 'gray'} />
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.discount}>
                {item.discount_type === 'percentage' ? `${item.discount_value}% OFF` : `K${item.discount_value} OFF`}
              </Text>
              <Text style={typography.caption}>{item.start_date} → {item.end_date}</Text>
            </View>
            <Button
              title={item.status === 'active' ? 'Deactivate' : 'Activate'}
              size="sm"
              variant="secondary"
              onPress={() => handleToggle(item)}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        )}
      />

      <Modal visible={showModal} onClose={() => setShowModal(false)} title="New promotion">
        <Text style={styles.label}>Name *</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="e.g. Weekend Special" />
        <Text style={styles.label}>Description</Text>
        <TextInput style={styles.input} value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder="Optional description" />

        <Text style={styles.label}>Discount type</Text>
        <View style={styles.chips}>
          {[{ value: 'percentage', label: 'Percentage' }, { value: 'fixed', label: 'Fixed amount' }].map((opt) => (
            <TouchableOpacity key={opt.value} style={[styles.chip, form.discount_type === opt.value && styles.chipActive]} onPress={() => setForm({ ...form, discount_type: opt.value })}>
              <Text style={[styles.chipText, form.discount_type === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Discount value * {form.discount_type === 'percentage' ? '(%)' : '(K)'}</Text>
        <TextInput style={styles.input} value={form.discount_value} onChangeText={(v) => setForm({ ...form, discount_value: v })} keyboardType="decimal-pad" placeholder="10" />

        <Text style={styles.label}>Start date</Text>
        <TextInput style={styles.input} value={form.start_date} onChangeText={(v) => setForm({ ...form, start_date: v })} placeholder="YYYY-MM-DD" />
        <Text style={styles.label}>End date *</Text>
        <TextInput style={styles.input} value={form.end_date} onChangeText={(v) => setForm({ ...form, end_date: v })} placeholder="YYYY-MM-DD" />

        <Text style={styles.label}>Products (optional)</Text>
        <Text style={[typography.caption, { marginBottom: 4 }]}>
          {products.length > 0 ? `Available IDs: ${products.map((p) => `${p.id}=${p.name}`).join(', ')}` : 'No products yet'}
        </Text>
        <TextInput style={styles.input} value={form.applicable_products} onChangeText={(v) => setForm({ ...form, applicable_products: v })} placeholder="e.g. 1,2,3 (leave blank for all)" />

        <Button title="Create promotion" loading={saving} onPress={handleSubmit} style={{ marginTop: spacing.sm }} />
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
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  discount: { fontSize: 15, fontWeight: '700', color: colors.primary[700] },
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
