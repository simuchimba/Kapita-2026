import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CheckCircle2 } from 'lucide-react-native';
import { billingAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import Badge from '../../src/components/ui/Badge';
import EmptyState from '../../src/components/ui/EmptyState';
import Modal from '../../src/components/ui/Modal';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

export default function BillingScreen() {
  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        billingAPI.getMyStatus(),
        billingAPI.getHistory(),
      ]);
      setBillingStatus(statusRes);
      setPaymentHistory(historyRes || []);
    } catch (error) {
      console.error('Failed to load billing data:', error);
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

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach your payment proof.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0]);
    }
  };

  const resetForm = () => {
    setTransactionId('');
    setAmount('');
    setNotes('');
    setImage(null);
  };

  const handleSubmit = async () => {
    if (!transactionId.trim() || !amount || !image) {
      Alert.alert('Missing info', 'Please attach a proof image and fill in transaction ID and amount.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('transaction_id', transactionId.trim());
      formData.append('amount', amount);
      if (notes.trim()) formData.append('notes', notes.trim());
      formData.append('proof_image', {
        uri: image.uri,
        name: image.fileName || 'payment-proof.jpg',
        type: image.mimeType || 'image/jpeg',
      } as any);

      await billingAPI.submitPaymentProof(formData);
      setShowModal(false);
      resetForm();
      load();
      Alert.alert('Submitted', 'Your payment proof was submitted for review.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit payment proof');
    } finally {
      setSubmitting(false);
    }
  };

  const isActive = billingStatus?.access_status === 'active_subscription' || billingStatus?.access_status === 'active_trial';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
    >
      <View style={styles.header}>
        <Text style={typography.title}>Billing</Text>
      </View>

      {billingStatus && (
        <View style={styles.section}>
          <Card style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
            <Text style={typography.caption}>Subscription status</Text>
            <View style={{ marginTop: spacing.sm }}>
              <Badge label={(billingStatus.access_status || 'unknown').replace(/_/g, ' ')} tone={isActive ? 'green' : 'red'} />
            </View>
            {billingStatus.subscription_end_date && (
              <Text style={[typography.caption, { marginTop: spacing.sm }]}>
                Valid until {new Date(billingStatus.subscription_end_date).toLocaleDateString()}
              </Text>
            )}
            {billingStatus.days_remaining != null && (
              <Text style={[typography.caption, { marginTop: 2 }]}>{billingStatus.days_remaining} day(s) remaining</Text>
            )}
          </Card>
        </View>
      )}

      {!isActive && (
        <View style={styles.section}>
          <Button title="Submit Payment Proof" onPress={() => setShowModal(true)} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        {paymentHistory.length === 0 ? (
          <EmptyState message="No payment history yet." />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {paymentHistory.map((payment) => (
              <Card key={payment.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={styles.paymentAmount}>K{Number(payment.amount).toLocaleString()}</Text>
                    <Text style={typography.caption}>{new Date(payment.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Badge
                    label={payment.status}
                    tone={payment.status === 'approved' ? 'green' : payment.status === 'rejected' ? 'red' : 'amber'}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>

      <Modal visible={showModal} onClose={() => setShowModal(false)} title="Submit payment proof">
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Camera size={24} color={colors.gray[400]} />
              <Text style={typography.caption}>Tap to attach proof of payment</Text>
            </View>
          )}
        </TouchableOpacity>
        {image ? (
          <View style={styles.imageConfirm}>
            <CheckCircle2 size={14} color={colors.primary[600]} />
            <Text style={[typography.caption, { color: colors.primary[700] }]}>Image attached — tap to change</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Transaction ID *</Text>
        <TextInput style={styles.input} value={transactionId} onChangeText={setTransactionId} placeholder="e.g. MP240101.1234.A56789" />
        <Text style={styles.label}>Amount (K) *</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Notes" />

        <Button title="Submit for review" loading={submitting} onPress={handleSubmit} style={{ marginTop: spacing.sm }} />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: { padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  section: { padding: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[900], marginBottom: spacing.sm },
  paymentAmount: { fontSize: 16, fontWeight: '700', color: colors.gray[900] },
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
  imagePicker: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.gray[300],
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  imagePlaceholder: { height: 140, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  imagePreview: { width: '100%', height: 180, resizeMode: 'cover' },
  imageConfirm: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
});
