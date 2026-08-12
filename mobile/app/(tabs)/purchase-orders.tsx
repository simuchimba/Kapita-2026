import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { purchaseOrdersAPI, suppliersAPI, productsAPI } from '../../src/services/api';

interface Supplier { id: number; name: string; }
interface Product { id: number; name: string; buying_price: string | number; unit: string; }

export default function PurchaseOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        purchaseOrdersAPI.list(),
        suppliersAPI.list(),
        productsAPI.list(),
      ]);
      setOrders(ordersRes || []);
      setSuppliers(suppliersRes || []);
      setProducts(productsRes || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSupplier(null);
    setProduct(null);
    setQuantity('');
    setUnitPrice('');
    setExpectedDeliveryDate('');
    setNotes('');
  };

  const handleSubmit = async () => {
    const qty = parseInt(quantity, 10);
    const price = parseFloat(unitPrice);
    if (!supplier || !product || !qty || qty < 1 || !price) {
      Alert.alert('Error', 'Please select a supplier, product, quantity, and unit price');
      return;
    }

    setSaving(true);
    try {
      await purchaseOrdersAPI.create({
        supplier: supplier.id,
        expected_delivery_date: expectedDeliveryDate || null,
        notes,
        items: [{ product: product.id, quantity: qty, unit_price: price }],
      });
      resetForm();
      setShowAddModal(false);
      loadData();
      Alert.alert('Success', 'Purchase order created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create purchase order');
    } finally {
      setSaving(false);
    }
  };

  const handleReceive = async (id: number) => {
    Alert.alert(
      'Receive Order',
      'Mark this order as received? This will add the ordered quantity to your stock.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Receive',
          onPress: async () => {
            try {
              await purchaseOrdersAPI.receive(id);
              loadData();
              Alert.alert('Success', 'Order marked as received');
            } catch (error) {
              Alert.alert('Error', 'Failed to receive order');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Purchase Orders</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => { resetForm(); setShowAddModal(true); }}
          >
            <Text style={styles.addButtonText}>+ New Order</Text>
          </TouchableOpacity>
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No purchase orders yet</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderSupplier}>
                  {order.supplier_details?.name || 'N/A'}
                </Text>
                {(order.items || []).map((item: any) => (
                  <Text key={item.id} style={styles.orderProduct}>
                    {item.product_details?.name || 'Product'} × {item.quantity} {item.product_details?.unit || 'pcs'}
                  </Text>
                ))}
                <Text style={styles.orderQuantity}>Total: K{Number(order.total_amount).toLocaleString()}</Text>
                <Text style={styles.orderDate}>
                  Expected: {order.expected_delivery_date || 'TBD'}
                </Text>
                <View style={[
                  styles.statusBadge,
                  order.status === 'received' ? styles.statusReceived : styles.statusPending
                ]}>
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>
              </View>
              {order.status !== 'received' && (
                <TouchableOpacity
                  style={styles.receiveButton}
                  onPress={() => handleReceive(order.id)}
                >
                  <Text style={styles.receiveButtonText}>Mark Received</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {showAddModal && (
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Purchase Order</Text>

            <Text style={styles.label}>Supplier</Text>
            <ScrollView style={styles.pickerList} nestedScrollEnabled>
              {suppliers.length === 0 && <Text style={styles.emptyText}>No suppliers yet — add one in the Suppliers tab first.</Text>}
              {suppliers.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.pickerRow, supplier?.id === s.id && styles.pickerRowActive]}
                  onPress={() => setSupplier(s)}
                >
                  <Text style={supplier?.id === s.id ? styles.pickerRowTextActive : styles.pickerRowText}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Product</Text>
            <ScrollView style={styles.pickerList} nestedScrollEnabled>
              {products.length === 0 && <Text style={styles.emptyText}>No products yet — add one in the Products tab first.</Text>}
              {products.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.pickerRow, product?.id === p.id && styles.pickerRowActive]}
                  onPress={() => { setProduct(p); setUnitPrice(String(p.buying_price)); }}
                >
                  <Text style={product?.id === p.id ? styles.pickerRowTextActive : styles.pickerRowText}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Unit cost (K)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={unitPrice}
              onChangeText={setUnitPrice}
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>Expected Delivery Date (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={expectedDeliveryDate}
              onChangeText={setExpectedDeliveryDate}
            />
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Notes"
              value={notes}
              onChangeText={setNotes}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSubmit}
                disabled={saving}
              >
                <Text style={styles.modalButtonText}>{saving ? 'Creating…' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  orderCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderInfo: {
    marginBottom: 12,
  },
  orderSupplier: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderProduct: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  orderQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  statusReceived: {
    backgroundColor: '#059669',
  },
  statusPending: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  receiveButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  receiveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 420,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  pickerList: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  pickerRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerRowActive: {
    backgroundColor: '#f0fdf4',
  },
  pickerRowText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerRowTextActive: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#059669',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
