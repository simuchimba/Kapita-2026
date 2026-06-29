import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { purchaseOrdersAPI, suppliersAPI, productsAPI } from '../../src/services/api';

export default function PurchaseOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    supplier: '',
    product: '',
    quantity: '',
    expected_delivery_date: '',
    notes: '',
  });

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
      setOrders(ordersRes.results || ordersRes);
      setSuppliers(suppliersRes.results || suppliersRes);
      setProducts(productsRes.results || productsRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.supplier || !formData.product || !formData.quantity) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      await purchaseOrdersAPI.create(formData);
      setFormData({
        supplier: '',
        product: '',
        quantity: '',
        expected_delivery_date: '',
        notes: '',
      });
      setShowAddModal(false);
      loadData();
      Alert.alert('Success', 'Purchase order created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create purchase order');
    }
  };

  const handleReceive = async (id: number) => {
    Alert.alert(
      'Receive Order',
      'Mark this order as received?',
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
        <ActivityIndicator size="large" color="#10b981" />
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
            onPress={() => setShowAddModal(true)}
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
                <Text style={styles.orderProduct}>
                  {order.product_details?.name || 'N/A'}
                </Text>
                <Text style={styles.orderQuantity}>Qty: {order.quantity}</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Purchase Order</Text>
            <Text style={styles.label}>Supplier</Text>
            <TextInput
              style={styles.input}
              placeholder="Select supplier"
              value={formData.supplier}
              onChangeText={(text) => setFormData({ ...formData, supplier: text })}
            />
            <Text style={styles.label}>Product</Text>
            <TextInput
              style={styles.input}
              placeholder="Select product"
              value={formData.product}
              onChangeText={(text) => setFormData({ ...formData, product: text })}
            />
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="Quantity"
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Expected Delivery Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.expected_delivery_date}
              onChangeText={(text) => setFormData({ ...formData, expected_delivery_date: text })}
            />
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Notes"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
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
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#10b981',
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
    fontSize: 16,
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
    backgroundColor: '#10b981',
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
    backgroundColor: '#10b981',
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
    width: '80%',
    maxWidth: 400,
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
    backgroundColor: '#10b981',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
