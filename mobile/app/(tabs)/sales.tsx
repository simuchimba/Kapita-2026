import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { salesAPI, productsAPI, customersAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import Badge from '../../src/components/ui/Badge';
import EmptyState from '../../src/components/ui/EmptyState';
import Modal from '../../src/components/ui/Modal';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface Product {
  id: number;
  name: string;
  selling_price: string | number;
  quantity: number;
  unit: string;
}
interface Customer {
  id: number;
  name: string;
}
interface Sale {
  id: number;
  product_details?: Product;
  customer_details?: Customer;
  quantity: number;
  unit_price: string | number;
  total_amount: string | number;
  payment_type: string;
  created_at: string;
}

const PAYMENT_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'credit', label: 'Credit' },
];

export default function SalesScreen() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [paymentType, setPaymentType] = useState('cash');

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [salesData, productsData, customersData] = await Promise.all([
        salesAPI.list(),
        productsAPI.list(),
        customersAPI.list(),
      ]);
      setSales(salesData || []);
      setProducts(productsData || []);
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Failed to load sales data:', error);
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
    setSelectedProduct(null);
    setSelectedCustomer(null);
    setQuantity('1');
    setPaymentType('cash');
    setShowAddModal(true);
  };

  const handleAddSale = async () => {
    const qty = parseInt(quantity, 10);
    if (!selectedProduct || !qty || qty < 1) {
      Alert.alert('Missing info', 'Please select a product and a valid quantity.');
      return;
    }
    if (paymentType === 'credit' && !selectedCustomer) {
      Alert.alert('Customer required', 'Credit sales require a customer to be selected.');
      return;
    }

    setSaving(true);
    try {
      await salesAPI.create({
        product: selectedProduct.id,
        customer: selectedCustomer?.id ?? null,
        quantity: qty,
        unit_price: selectedProduct.selling_price,
        payment_type: paymentType,
        ...(paymentType === 'credit' ? { due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) } : {}),
      });
      setShowAddModal(false);
      load();
    } catch (error: any) {
      const detail = error.response?.data?.detail || error.response?.data?.non_field_errors?.[0];
      Alert.alert('Error', detail || 'Failed to record sale');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.title}>Sales</Text>
        <Button title="New Sale" size="sm" onPress={openAddModal} />
      </View>

      <FlatList
        data={sales}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No sales recorded yet." /> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.product_details?.name || 'Unknown product'}</Text>
                <Text style={typography.caption}>
                  {item.quantity} {item.product_details?.unit || 'pcs'} · {item.customer_details?.name || 'Walk-in customer'}
                </Text>
              </View>
              <Badge label={item.payment_type.replace('_', ' ')} tone={item.payment_type === 'credit' ? 'amber' : 'green'} />
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.amount}>K{Number(item.total_amount).toLocaleString()}</Text>
              <Text style={typography.caption}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          </Card>
        )}
      />

      <Modal visible={showAddModal} onClose={() => setShowAddModal(false)} title="New sale">
        <Text style={styles.label}>Product *</Text>
        <View style={styles.pickerList}>
          {products.length === 0 && <Text style={typography.caption}>No products yet — add one in the Products tab first.</Text>}
          {products.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.pickerRow, selectedProduct?.id === p.id && styles.pickerRowActive]}
              onPress={() => setSelectedProduct(p)}
            >
              <Text style={[styles.pickerRowText, selectedProduct?.id === p.id && styles.pickerRowTextActive]}>
                {p.name} — K{Number(p.selling_price).toLocaleString()} ({p.quantity} {p.unit || 'pcs'} left)
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Quantity *</Text>
        <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />

        <Text style={styles.label}>Payment type *</Text>
        <View style={styles.chipRow}>
          {PAYMENT_TYPES.map((pt) => (
            <TouchableOpacity
              key={pt.value}
              style={[styles.chip, paymentType === pt.value && styles.chipActive]}
              onPress={() => setPaymentType(pt.value)}
            >
              <Text style={[styles.chipText, paymentType === pt.value && styles.chipTextActive]}>{pt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Customer {paymentType === 'credit' ? '*' : '(optional)'}</Text>
        <View style={styles.pickerList}>
          <TouchableOpacity style={[styles.pickerRow, !selectedCustomer && styles.pickerRowActive]} onPress={() => setSelectedCustomer(null)}>
            <Text style={[styles.pickerRowText, !selectedCustomer && styles.pickerRowTextActive]}>Walk-in customer</Text>
          </TouchableOpacity>
          {customers.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.pickerRow, selectedCustomer?.id === c.id && styles.pickerRowActive]}
              onPress={() => setSelectedCustomer(c)}
            >
              <Text style={[styles.pickerRowText, selectedCustomer?.id === c.id && styles.pickerRowTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedProduct && quantity ? (
          <Text style={styles.totalPreview}>
            Total: K{(Number(selectedProduct.selling_price) * (parseInt(quantity, 10) || 0)).toLocaleString()}
          </Text>
        ) : null}

        <Button title="Record sale" loading={saving} onPress={handleAddSale} style={{ marginTop: spacing.sm }} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
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
  pickerList: { borderWidth: 1, borderColor: colors.gray[200], borderRadius: radius.sm, overflow: 'hidden' },
  pickerRow: { paddingHorizontal: spacing.sm, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  pickerRowActive: { backgroundColor: colors.primary[50] },
  pickerRowText: { fontSize: 14, color: colors.gray[700] },
  pickerRowTextActive: { color: colors.primary[700], fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: spacing.xs },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.gray[200] },
  chipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  chipText: { fontSize: 13, color: colors.gray[600] },
  chipTextActive: { color: colors.white, fontWeight: '600' },
  totalPreview: { marginTop: spacing.md, fontSize: 16, fontWeight: '700', color: colors.gray[900], textAlign: 'right' },
});
