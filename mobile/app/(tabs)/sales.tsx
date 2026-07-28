import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { salesAPI, productsAPI, customersAPI } from '../../src/services/api';

export default function SalesScreen() {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSale, setNewSale] = useState({ product: '', customer: '', quantity: '1' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesData, productsData, customersData] = await Promise.all([
        salesAPI.list(),
        productsAPI.list(),
        customersAPI.list(),
      ]);
      setSales(salesData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSale = async () => {
    if (!newSale.product || !newSale.quantity) {
      Alert.alert('Error', 'Please select a product and quantity');
      return;
    }

    try {
      await salesAPI.create({
        product: parseInt(newSale.product),
        customer: newSale.customer ? parseInt(newSale.customer) : null,
        quantity: parseInt(newSale.quantity),
      });
      setNewSale({ product: '', customer: '', quantity: '1' });
      setShowAddModal(false);
      loadData();
      Alert.alert('Success', 'Sale recorded successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to record sale');
    }
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
          <Text style={styles.title}>Sales</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ New Sale</Text>
          </TouchableOpacity>
        </View>

        {sales.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sales yet</Text>
          </View>
        ) : (
          sales.map((sale) => (
            <View key={sale.id} style={styles.saleCard}>
              <View style={styles.saleInfo}>
                <Text style={styles.saleProduct}>{sale.product_name || 'Product'}</Text>
                <Text style={styles.saleCustomer}>
                  {sale.customer_name || 'Walk-in customer'}
                </Text>
              </View>
              <View style={styles.saleMeta}>
                <Text style={styles.saleQuantity}>Qty: {sale.quantity}</Text>
                <Text style={styles.saleTotal}>${sale.total}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {showAddModal && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Sale</Text>
            
            <Text style={styles.label}>Product</Text>
            <TextInput
              style={styles.input}
              placeholder="Select product"
              value={newSale.product}
              onChangeText={(text) => setNewSale({ ...newSale, product: text })}
            />
            
            <Text style={styles.label}>Customer (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Select customer"
              value={newSale.customer}
              onChangeText={(text) => setNewSale({ ...newSale, customer: text })}
            />
            
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="Quantity"
              value={newSale.quantity}
              onChangeText={(text) => setNewSale({ ...newSale, quantity: text })}
              keyboardType="number-pad"
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
                onPress={handleAddSale}
              >
                <Text style={styles.modalButtonText}>Record Sale</Text>
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
    fontSize: 16,
    color: '#999',
  },
  saleCard: {
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
  saleInfo: {
    marginBottom: 12,
  },
  saleProduct: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saleCustomer: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  saleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleQuantity: {
    fontSize: 14,
    color: '#666',
  },
  saleTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
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
    backgroundColor: '#059669',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
