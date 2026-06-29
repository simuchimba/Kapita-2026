import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { promotionsAPI, productsAPI } from '../../src/services/api';

export default function PromotionsScreen() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    start_date: '',
    end_date: '',
    applicable_products: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [promotionsRes, productsRes] = await Promise.all([
        promotionsAPI.list(),
        productsAPI.list(),
      ]);
      setPromotions(promotionsRes.results || promotionsRes);
      setProducts(productsRes.results || productsRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.discount_value) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      await promotionsAPI.create({
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        applicable_products: formData.applicable_products ? 
          formData.applicable_products.split(',').map((id: string) => parseInt(id.trim())) : [],
      });
      setFormData({
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        start_date: '',
        end_date: '',
        applicable_products: '',
      });
      setShowAddModal(false);
      loadData();
      Alert.alert('Success', 'Promotion created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create promotion');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await promotionsAPI.toggleStatus(id);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle promotion status');
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
          <Text style={styles.title}>Promotions</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add Promotion</Text>
          </TouchableOpacity>
        </View>

        {promotions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No promotions yet</Text>
          </View>
        ) : (
          promotions.map((promotion) => (
            <View key={promotion.id} style={styles.promotionCard}>
              <View style={styles.promotionInfo}>
                <Text style={styles.promotionName}>{promotion.name}</Text>
                {promotion.description && (
                  <Text style={styles.promotionDescription}>{promotion.description}</Text>
                )}
                <View style={styles.promotionDetails}>
                  <Text style={styles.promotionDiscount}>
                    {promotion.discount_type === 'percentage' 
                      ? `${promotion.discount_value}% OFF` 
                      : `$${promotion.discount_value} OFF`}
                  </Text>
                  <Text style={styles.promotionDates}>
                    {promotion.start_date} - {promotion.end_date}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  promotion.is_active ? styles.statusActive : styles.statusInactive
                ]}>
                  <Text style={styles.statusText}>
                    {promotion.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => handleToggleStatus(promotion.id)}
              >
                <Text style={styles.toggleButtonText}>
                  {promotion.is_active ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {showAddModal && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Promotion</Text>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Promotion name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
            />
            <Text style={styles.label}>Discount Type</Text>
            <TextInput
              style={styles.input}
              placeholder="percentage or fixed"
              value={formData.discount_type}
              onChangeText={(text) => setFormData({ ...formData, discount_type: text })}
            />
            <Text style={styles.label}>Discount Value *</Text>
            <TextInput
              style={styles.input}
              placeholder="Discount value"
              value={formData.discount_value}
              onChangeText={(text) => setFormData({ ...formData, discount_value: text })}
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.start_date}
              onChangeText={(text) => setFormData({ ...formData, start_date: text })}
            />
            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.end_date}
              onChangeText={(text) => setFormData({ ...formData, end_date: text })}
            />
            <Text style={styles.label}>Applicable Products (comma-separated IDs)</Text>
            <TextInput
              style={styles.input}
              placeholder="1, 2, 3"
              value={formData.applicable_products}
              onChangeText={(text) => setFormData({ ...formData, applicable_products: text })}
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
  promotionCard: {
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
  promotionInfo: {
    marginBottom: 12,
  },
  promotionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  promotionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  promotionDetails: {
    marginTop: 8,
  },
  promotionDiscount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  promotionDates: {
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
  statusActive: {
    backgroundColor: '#10b981',
  },
  statusInactive: {
    backgroundColor: '#6b7280',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  toggleButtonText: {
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
