import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { quotationsAPI, customersAPI, productsAPI } from '../../src/services/api';

export default function QuotationsScreen() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    items: '',
    valid_until: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [quotationsRes, customersRes, productsRes] = await Promise.all([
        quotationsAPI.list(),
        customersAPI.list(),
        productsAPI.list(),
      ]);
      setQuotations(quotationsRes.results || quotationsRes);
      setCustomers(customersRes.results || customersRes);
      setProducts(productsRes.results || productsRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.customer || !formData.items) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      await quotationsAPI.create({
        ...formData,
        items: JSON.parse(formData.items),
      });
      setFormData({
        customer: '',
        items: '',
        valid_until: '',
        notes: '',
      });
      setShowAddModal(false);
      loadData();
      Alert.alert('Success', 'Quotation created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create quotation');
    }
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
          <Text style={styles.title}>Quotations</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ New Quote</Text>
          </TouchableOpacity>
        </View>

        {quotations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No quotations yet</Text>
          </View>
        ) : (
          quotations.map((quotation) => (
            <View key={quotation.id} style={styles.quotationCard}>
              <View style={styles.quotationInfo}>
                <Text style={styles.quotationCustomer}>
                  {quotation.customer_details?.name || 'N/A'}
                </Text>
                <Text style={styles.quotationTotal}>Total: ${quotation.total}</Text>
                <Text style={styles.quotationDate}>
                  Valid until: {quotation.valid_until || 'TBD'}
                </Text>
                <View style={[
                  styles.statusBadge,
                  quotation.status === 'accepted' ? styles.statusAccepted : styles.statusPending
                ]}>
                  <Text style={styles.statusText}>{quotation.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {showAddModal && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Quotation</Text>
            <Text style={styles.label}>Customer</Text>
            <TextInput
              style={styles.input}
              placeholder="Select customer"
              value={formData.customer}
              onChangeText={(text) => setFormData({ ...formData, customer: text })}
            />
            <Text style={styles.label}>Items (JSON)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder='[{"product": 1, "quantity": 2}]'
              value={formData.items}
              onChangeText={(text) => setFormData({ ...formData, items: text })}
              multiline
            />
            <Text style={styles.label}>Valid Until</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.valid_until}
              onChangeText={(text) => setFormData({ ...formData, valid_until: text })}
            />
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
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
  quotationCard: {
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
  quotationInfo: {
    marginBottom: 12,
  },
  quotationCustomer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  quotationTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 4,
  },
  quotationDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  statusAccepted: {
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
