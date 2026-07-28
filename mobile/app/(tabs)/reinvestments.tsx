import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { reinvestmentsAPI } from '../../src/services/api';

export default function ReinvestmentsScreen() {
  const [reinvestments, setReinvestments] = useState<any[]>([]);
  const [purposes, setPurposes] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    expected_margin: '20',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reinvestmentsRes, purposesRes, summaryRes] = await Promise.all([
        reinvestmentsAPI.list(),
        reinvestmentsAPI.getPurposes(),
        reinvestmentsAPI.getSummary(),
      ]);
      setReinvestments(reinvestmentsRes.results || reinvestmentsRes);
      setPurposes(purposesRes);
      setSummary(summaryRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReinvestment = async () => {
    if (!formData.amount || !formData.purpose) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      await reinvestmentsAPI.create(formData);
      setFormData({
        amount: '',
        purpose: '',
        date: new Date().toISOString().split('T')[0],
        expected_margin: '20',
        notes: '',
      });
      setShowAddModal(false);
      loadData();
      Alert.alert('Success', 'Reinvestment added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add reinvestment');
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
          <Text style={styles.title}>Reinvestments</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add Reinvestment</Text>
          </TouchableOpacity>
        </View>

        {summary && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Invested</Text>
              <Text style={styles.summaryValue}>${summary.total_invested || '0.00'}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Projected Profit</Text>
              <Text style={styles.summaryValue}>${summary.projected_profit || '0.00'}</Text>
            </View>
          </View>
        )}

        {reinvestments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reinvestments yet</Text>
          </View>
        ) : (
          reinvestments.map((reinvestment) => (
            <View key={reinvestment.id} style={styles.reinvestmentCard}>
              <View style={styles.reinvestmentInfo}>
                <Text style={styles.reinvestmentPurpose}>
                  {reinvestment.purpose.replace('_', ' ')}
                </Text>
                <Text style={styles.reinvestmentDate}>
                  {new Date(reinvestment.date).toLocaleDateString()}
                </Text>
                <Text style={styles.reinvestmentAmount}>${reinvestment.amount}</Text>
                <Text style={styles.reinvestmentMargin}>
                  Expected Margin: {reinvestment.expected_margin}%
                </Text>
                <Text style={styles.reinvestmentProfit}>
                  Projected Profit: ${reinvestment.projected_profit}
                </Text>
                <Text style={styles.reinvestmentReturn}>
                  Projected Return: ${reinvestment.projected_return}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {showAddModal && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Reinvestment</Text>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>Purpose</Text>
            <TextInput
              style={styles.input}
              placeholder="Purpose"
              value={formData.purpose}
              onChangeText={(text) => setFormData({ ...formData, purpose: text })}
            />
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
            />
            <Text style={styles.label}>Expected Margin (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="20"
              value={formData.expected_margin}
              onChangeText={(text) => setFormData({ ...formData, expected_margin: text })}
              keyboardType="decimal-pad"
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
                onPress={handleAddReinvestment}
              >
                <Text style={styles.modalButtonText}>Save</Text>
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
    color: '#059669',
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
  reinvestmentCard: {
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
  reinvestmentInfo: {
    marginBottom: 12,
  },
  reinvestmentPurpose: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reinvestmentDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  reinvestmentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 4,
  },
  reinvestmentMargin: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  reinvestmentProfit: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginTop: 4,
  },
  reinvestmentReturn: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 4,
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
