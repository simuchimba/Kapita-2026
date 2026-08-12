import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { quotationsAPI, customersAPI, productsAPI } from '../../src/services/api';

interface Customer { id: number; name: string; }
interface Product { id: number; name: string; selling_price: string | number; }

export default function QuotationsScreen() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subject, setSubject] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [validityPeriod, setValidityPeriod] = useState('30 days');
  const [notes, setNotes] = useState('');

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
      setQuotations(quotationsRes || []);
      setCustomers(customersRes || []);
      setProducts(productsRes || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCustomer(null);
    setSubject('');
    setProduct(null);
    setDescription('');
    setQuantity('1');
    setUnitPrice('');
    setValidityPeriod('30 days');
    setNotes('');
  };

  const handleSubmit = async () => {
    const qty = parseInt(quantity, 10);
    const price = parseFloat(unitPrice);
    if (!subject.trim() || !description.trim() || !qty || !price) {
      Alert.alert('Error', 'Please fill in subject, item description, quantity and price');
      return;
    }

    setSaving(true);
    try {
      await quotationsAPI.create({
        customer: customer?.id ?? null,
        subject: subject.trim(),
        validity_period: validityPeriod,
        notes,
        items: [{ description: description.trim(), quantity: qty, unit_price: price }],
      });
      resetForm();
      setShowAddModal(false);
      loadData();
      Alert.alert('Success', 'Quotation created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create quotation');
    } finally {
      setSaving(false);
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
          <Text style={styles.title}>Quotations</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => { resetForm(); setShowAddModal(true); }}
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
                  {quotation.customer_details?.name || 'Walk-in customer'} — {quotation.subject}
                </Text>
                <Text style={styles.quotationTotal}>Total: K{Number(quotation.total_amount).toLocaleString()}</Text>
                <Text style={styles.quotationDate}>
                  Valid for: {quotation.validity_period || 'N/A'}
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
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Quotation</Text>

            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Supply of 50 chairs"
              value={subject}
              onChangeText={setSubject}
            />

            <Text style={styles.label}>Customer (optional)</Text>
            <ScrollView style={styles.pickerList} nestedScrollEnabled>
              <TouchableOpacity style={[styles.pickerRow, !customer && styles.pickerRowActive]} onPress={() => setCustomer(null)}>
                <Text style={!customer ? styles.pickerRowTextActive : styles.pickerRowText}>Walk-in customer</Text>
              </TouchableOpacity>
              {customers.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.pickerRow, customer?.id === c.id && styles.pickerRowActive]}
                  onPress={() => setCustomer(c)}
                >
                  <Text style={customer?.id === c.id ? styles.pickerRowTextActive : styles.pickerRowText}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Item — pick a product (optional shortcut)</Text>
            <ScrollView style={styles.pickerList} nestedScrollEnabled>
              {products.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.pickerRow, product?.id === p.id && styles.pickerRowActive]}
                  onPress={() => {
                    setProduct(p);
                    setDescription(p.name);
                    setUnitPrice(String(p.selling_price));
                  }}
                >
                  <Text style={product?.id === p.id ? styles.pickerRowTextActive : styles.pickerRowText}>
                    {p.name} — K{Number(p.selling_price).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Item description *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Plastic chairs"
              value={description}
              onChangeText={setDescription}
            />
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Unit price (K) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={unitPrice}
              onChangeText={setUnitPrice}
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>Valid for</Text>
            <TextInput
              style={styles.input}
              placeholder="30 days"
              value={validityPeriod}
              onChangeText={setValidityPeriod}
            />
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes"
              value={notes}
              onChangeText={setNotes}
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
    color: '#059669',
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
    maxHeight: 110,
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
    backgroundColor: '#059669',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
