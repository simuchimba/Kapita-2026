import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';
import { productsAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import Badge from '../../src/components/ui/Badge';
import SearchInput from '../../src/components/ui/SearchInput';
import EmptyState from '../../src/components/ui/EmptyState';
import Modal from '../../src/components/ui/Modal';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface Product {
  id: number;
  name: string;
  category: string;
  sku: string;
  buying_price: string | number;
  selling_price: string | number;
  quantity: number;
  unit: string;
  minimum_stock: number;
  is_low_stock: boolean;
}

const UNIT_OPTIONS = ['pcs', 'kg', 'heap', 'pack', 'bundle', 'box', 'litre', 'dozen'];

function generateSku() {
  const letters = Array.from({ length: 2 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
  const digits = Math.floor(10000000 + Math.random() * 90000000);
  return `SKU-${letters}${digits}`;
}

const EMPTY_FORM = {
  name: '', category: '', buying_price: '', selling_price: '', quantity: '', unit: 'pcs', minimum_stock: '10',
};

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await productsAPI.list();
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
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

  const handleAddProduct = async () => {
    if (!form.name.trim() || !form.category.trim() || !form.buying_price || !form.selling_price || !form.quantity) {
      Alert.alert('Missing info', 'Name, category, buying price, selling price, and quantity are required.');
      return;
    }
    setSaving(true);
    try {
      await productsAPI.create({
        name: form.name.trim(),
        category: form.category.trim(),
        sku: generateSku(),
        buying_price: parseFloat(form.buying_price),
        selling_price: parseFloat(form.selling_price),
        quantity: parseInt(form.quantity, 10),
        unit: form.unit.trim() || 'pcs',
        minimum_stock: parseInt(form.minimum_stock, 10) || 10,
      });
      setShowAddModal(false);
      load();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert('Delete product', `Delete "${product.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await productsAPI.delete(product.id);
            load();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete product');
          }
        },
      },
    ]);
  };

  const filtered = products.filter((p) =>
    !search.trim() ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchInput placeholder="Search products" value={search} onChangeText={setSearch} />
        <Button title="Add Product" size="sm" onPress={openAddModal} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No products yet. Tap Add Product to create your first one." /> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={typography.caption}>{item.category} · {item.sku}</Text>
              </View>
              {item.is_low_stock && <Badge label="Low stock" tone="red" />}
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.price}>K{Number(item.selling_price).toLocaleString()}</Text>
              <Text style={typography.caption}>
                {item.quantity} {item.unit || 'pcs'} in stock
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(item)}>
                <Trash2 size={16} color={colors.danger} />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      <Modal visible={showAddModal} onClose={() => setShowAddModal(false)} title="Add product">
        <View>
          <Text style={styles.label}>Name *</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="e.g. Tomatoes" />

          <Text style={styles.label}>Category *</Text>
          <TextInput style={styles.input} value={form.category} onChangeText={(v) => setForm({ ...form, category: v })} placeholder="e.g. Vegetables" />

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Buying price (K) *</Text>
              <TextInput style={styles.input} value={form.buying_price} onChangeText={(v) => setForm({ ...form, buying_price: v })} keyboardType="decimal-pad" placeholder="0.00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Selling price (K) *</Text>
              <TextInput style={styles.input} value={form.selling_price} onChangeText={(v) => setForm({ ...form, selling_price: v })} keyboardType="decimal-pad" placeholder="0.00" />
            </View>
          </View>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput style={styles.input} value={form.quantity} onChangeText={(v) => setForm({ ...form, quantity: v })} keyboardType="number-pad" placeholder="0" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Unit</Text>
              <TextInput style={styles.input} value={form.unit} onChangeText={(v) => setForm({ ...form, unit: v })} placeholder="pcs" />
            </View>
          </View>

          <View style={styles.unitChips}>
            {UNIT_OPTIONS.map((u) => (
              <TouchableOpacity key={u} style={[styles.unitChip, form.unit === u && styles.unitChipActive]} onPress={() => setForm({ ...form, unit: u })}>
                <Text style={[styles.unitChipText, form.unit === u && styles.unitChipTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Minimum stock (low-stock alert threshold)</Text>
          <TextInput style={styles.input} value={form.minimum_stock} onChangeText={(v) => setForm({ ...form, minimum_stock: v })} keyboardType="number-pad" placeholder="10" />

          <Button title="Save product" loading={saving} onPress={handleAddProduct} style={{ marginTop: spacing.sm }} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  name: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  price: { fontSize: 16, fontWeight: '700', color: colors.primary[700] },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.sm },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.dangerBg },
  deleteText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
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
  row2: { flexDirection: 'row', gap: spacing.sm },
  unitChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  unitChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.gray[200] },
  unitChipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  unitChipText: { fontSize: 12, color: colors.gray[600] },
  unitChipTextActive: { color: colors.white },
});
