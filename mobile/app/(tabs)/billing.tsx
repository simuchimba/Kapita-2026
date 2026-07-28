import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { billingAPI } from '../../src/services/api';

export default function BillingScreen() {
  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const [statusRes, historyRes] = await Promise.all([
        billingAPI.getMyStatus(),
        billingAPI.getHistory(),
      ]);
      setBillingStatus(statusRes);
      setPaymentHistory(historyRes.results || historyRes);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Billing</Text>
      </View>

      {billingStatus && (
        <View style={styles.section}>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Subscription Status</Text>
            <View style={[
              styles.statusBadge,
              billingStatus.access_status === 'active' ? styles.statusActive : styles.statusInactive
            ]}>
              <Text style={styles.statusBadgeText}>
                {billingStatus.access_status?.toUpperCase() || 'UNKNOWN'}
              </Text>
            </View>
            {billingStatus.subscription_end_date && (
              <Text style={styles.endDate}>
                Valid until: {new Date(billingStatus.subscription_end_date).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      )}

      {billingStatus?.access_status !== 'active' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Required</Text>
          <TouchableOpacity
            style={styles.paymentButton}
            onPress={() => Alert.alert('Payment', 'Payment integration coming soon')}
          >
            <Text style={styles.paymentButtonText}>Submit Payment Proof</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        {paymentHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No payment history</Text>
          </View>
        ) : (
          paymentHistory.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentAmount}>${payment.amount}</Text>
                <Text style={styles.paymentDate}>
                  {new Date(payment.payment_date).toLocaleDateString()}
                </Text>
                <View style={[
                  styles.paymentStatus,
                  payment.status === 'approved' ? styles.paymentApproved : styles.paymentPending
                ]}>
                  <Text style={styles.paymentStatusText}>{payment.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusActive: {
    backgroundColor: '#059669',
  },
  statusInactive: {
    backgroundColor: '#dc2626',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  endDate: {
    fontSize: 14,
    color: '#666',
  },
  paymentButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paymentApproved: {
    backgroundColor: '#059669',
  },
  paymentPending: {
    backgroundColor: '#f59e0b',
  },
  paymentStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
