import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { suppliersAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import SearchInput from '../../src/components/ui/SearchInput';
import EmptyState from '../../src/components/ui/EmptyState';
import Modal from '../../src/components/ui/Modal';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

const EMPTY_FORM = { name: '', contact_person: '', phone: '', email: '', address: '' };

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await suppliersAPI.list();
      setSuppliers(data || []);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
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

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Missing info', 'Please enter a supplier name');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await suppliersAPI.update(editing.id, form);
      } else {
        await suppliersAPI.create(form);
      }
      setShowModal(false);
      load();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (supplier: Supplier) => {
    Alert.alert('Delete supplier', `Delete "${supplier.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await suppliersAPI.delete(supplier.id);
            load();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete supplier');
          }
        },
      },
    ]);
  };

  const filtered = suppliers.filter((s) => !search.trim() || s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchInput placeholder="Search suppliers" value={search} onChangeText={setSearch} />
        <Button title="Add Supplier" size="sm" onPress={openAdd} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No suppliers yet." /> : null}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.name}>{item.name}</Text>
            {item.contact_person ? <Text style={typography.caption}>{item.contact_person}</Text> : null}
            {item.phone ? <Text style={typography.caption}>{item.phone}</Text> : null}
            {item.email ? <Text style={typography.caption}>{item.email}</Text> : null}
            {item.address ? <Text style={typography.caption}>{item.address}</Text> : null}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
                <Pencil size={14} color={colors.gray[600]} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.dangerBg }]} onPress={() => handleDelete(item)}>
                <Trash2 size={14} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      <Modal visible={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit supplier' : 'Add supplier'}>
        <Text style={styles.label}>Name *</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Supplier name" />
        <Text style={styles.label}>Contact person</Text>
        <TextInput style={styles.input} value={form.contact_person} onChangeText={(v) => setForm({ ...form, contact_person: v })} placeholder="Contact person" />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="Phone number" keyboardType="phone-pad" />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.label}>Address</Text>
        <TextInput style={styles.input} value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} placeholder="Address" />
        <Button title="Save supplier" loading={saving} onPress={handleSubmit} style={{ marginTop: spacing.sm }} />
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
  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, justifyContent: 'flex-end' },
  iconBtn: { padding: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.gray[100] },
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
