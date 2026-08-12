import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Phone, Mail } from 'lucide-react-native';
import { customersAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import SearchInput from '../../src/components/ui/SearchInput';
import EmptyState from '../../src/components/ui/EmptyState';
import Modal from '../../src/components/ui/Modal';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

const EMPTY_FORM = { name: '', phone: '', email: '' };

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await customersAPI.list();
      setCustomers(data || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
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

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setShowAddModal(true);
  };

  const handleAddCustomer = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      Alert.alert('Missing info', 'Please enter customer name and phone number');
      return;
    }
    setSaving(true);
    try {
      await customersAPI.create(form);
      setShowAddModal(false);
      load();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add customer');
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers.filter((c) =>
    !search.trim() ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchInput placeholder="Search customers" value={search} onChangeText={setSearch} />
        <Button title="Add Customer" size="sm" onPress={openAddModal} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No customers yet. Tap Add Customer to create your first one." /> : null}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.metaRow}>
              <Phone size={13} color={colors.gray[400]} />
              <Text style={typography.caption}>{item.phone}</Text>
            </View>
            {item.email ? (
              <View style={styles.metaRow}>
                <Mail size={13} color={colors.gray[400]} />
                <Text style={typography.caption}>{item.email}</Text>
              </View>
            ) : null}
          </Card>
        )}
      />

      <Modal visible={showAddModal} onClose={() => setShowAddModal(false)} title="Add customer">
        <Text style={styles.label}>Name *</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Customer name" />

        <Text style={styles.label}>Phone *</Text>
        <TextInput style={styles.input} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="Phone number" keyboardType="phone-pad" />

        <Text style={styles.label}>Email (optional)</Text>
        <TextInput style={styles.input} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />

        <Button title="Save customer" loading={saving} onPress={handleAddCustomer} style={{ marginTop: spacing.sm }} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  name: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
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
});
