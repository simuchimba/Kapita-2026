import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { creditsAPI, customersAPI } from '../../src/services/api';

export default function CreditsScreen() {
  const [credits, setCredits] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<any>(null);
  const [newCredit, setNewCredit] = useState({ customer: '', amount_owed: '', due_date: '', notes: '' });
  const [paymentData, setPaymentData] = useState({ amount: '', notes: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [creditsRes, customersRes, summaryRes] = await Promise.all([
        creditsAPI.list(),
        customersAPI.list(),
        creditsAPI.getSummary(),
      ]);
      setCredits(creditsRes.results || creditsRes);
      setCustomers(customersRes.results || customersRes);
      setSummary(summaryRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredit = async () => {
    if (!newCredit.customer || !newCredit.amount_owed) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      await creditsAPI.create(newCredit);
      setNewCredit({ customer: '', amount_owed: '', due_date: '', notes: '' });
      setShowAddModal(false);
      loadData();
      Alert.alert('Success', 'Credit added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add credit');
    }
  };

  const handlePayment = async () => {
    if (!paymentData.amount) {
      Alert.alert('Error', 'Please enter payment amount');
      return;
    }

    try {
      await creditsAPI.recordPayment(selectedCredit.id, paymentData);
      setPaymentData({ amount: '', notes: '' });
      setShowPaymentModal(false);
      loadData();
      Alert.alert('Success', 'Payment recorded successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment');
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
          <Text style={styles.title}>Credits</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add Credit</Text>
          </TouchableOpacity>
        </View>

        {summary && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Owed</Text>
              <Text style={styles.summaryValue}>${summary.total_owed || '0.00'}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={styles.summaryValue}>${summary.total_paid || '0.00'}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={styles.summaryValue}>${summary.remaining || '0.00'}</Text>
            </View>
          </View>
        )}

        {credits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No credits yet</Text>
          </View>
        ) : (
          credits.map((credit) => (
            <View key={credit.id} style={styles.creditCard}>
              <View style={styles.creditInfo}>
                <Text style={styles.creditCustomer}>
                  {credit.customer_details?.name || 'N/A'}
                </Text>
                <Text style={styles.creditAmount}>Owed: ${credit.amount_owed}</Text>
                <Text style={styles.creditPaid}>Paid: ${credit.amount_paid}</Text>
                <Text style={styles.creditRemaining}>
                  Remaining: ${(parseFloat(credit.amount_owed) - parseFloat(credit.amount_paid)).toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.paymentButton}
                onPress={() => {
                  setSelectedCredit(credit);
                  setShowPaymentModal(true);
                }}
              >
                <Text style={styles.paymentButtonText}>Record Payment</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {showAddModal && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Credit</Text>
            <Text style={styles.label}>Customer</Text>
            <TextInput
              style={styles.input}
              placeholder="Select customer"
              value={newCredit.customer}
              onChangeText={(text) => setNewCredit({ ...newCredit, customer: text })}
            />
            <Text style={styles.label}>Amount Owed</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={newCredit.amount_owed}
              onChangeText={(text) => setNewCredit({ ...newCredit, amount_owed: text })}
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>Due Date (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={newCredit.due_date}
              onChangeText={(text) => setNewCredit({ ...newCredit, due_date: text })}
            />
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Notes"
              value={newCredit.notes}
              onChangeText={(text) => setNewCredit({ ...newCredit, notes: text })}
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
                onPress={handleAddCredit}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showPaymentModal && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Payment amount"
              value={paymentData.amount}
              onChangeText={(text) => setPaymentData({ ...paymentData, amount: text })}
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Notes"
              value={paymentData.notes}
              onChangeText={(text) => setPaymentData({ ...paymentData, notes: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handlePayment}
              >
                <Text style={styles.modalButtonText}>Record</Text>
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
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
  creditCard: {
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
  creditInfo: {
    marginBottom: 12,
  },
  creditCustomer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  creditAmount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  creditPaid: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 4,
  },
  creditRemaining: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 4,
  },
  paymentButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  paymentButtonText: {
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
