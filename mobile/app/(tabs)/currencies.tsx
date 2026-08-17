import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { currenciesAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import EmptyState from '../../src/components/ui/EmptyState';
import Modal from '../../src/components/ui/Modal';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface Currency { code: string; name: string; symbol: string; is_base: boolean; }
interface Rate {
  id: number;
  base_currency: string;
  target_currency: string;
  base_currency_symbol: string;
  target_currency_symbol: string;
  rate: string | number;
  updated_at: string;
}

const EMPTY_FORM = { base_currency: 'ZMW', target_currency: '', rate: '' };

export default function CurrenciesScreen() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [currenciesData, ratesData] = await Promise.all([
        currenciesAPI.list(),
        currenciesAPI.getRates(),
      ]);
      setCurrencies(currenciesData || []);
      setRates(ratesData || []);
    } catch (error) {
      console.error('Failed to load currencies:', error);
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
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.target_currency || !form.rate) {
      Alert.alert('Missing info', 'Please select a target currency and rate');
      return;
    }
    setSaving(true);
    try {
      await currenciesAPI.createRate({ ...form, rate: parseFloat(form.rate) });
      setShowModal(false);
      load();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.non_field_errors?.[0] || error.response?.data?.detail || 'Failed to save exchange rate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={typography.title}>Currencies</Text>
        <Button title="Add Rate" size="sm" onPress={openAdd} />
      </View>

      <View style={styles.chips}>
        {currencies.map((c) => (
          <View key={c.code} style={styles.currencyChip}>
            <Text style={styles.currencyCode}>{c.code}</Text>
            <Text style={typography.caption}>{c.symbol} {c.name}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Your exchange rates</Text>
      <FlatList
        data={rates}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, paddingTop: 0, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No exchange rates set up yet." /> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.pair}>
                {item.base_currency_symbol}{item.base_currency} → {item.target_currency_symbol}{item.target_currency}
              </Text>
              <Text style={styles.rate}>{Number(item.rate).toLocaleString()}</Text>
            </View>
            <Text style={typography.caption}>Updated {new Date(item.updated_at).toLocaleDateString()}</Text>
          </Card>
        )}
      />

      <Modal visible={showModal} onClose={() => setShowModal(false)} title="Add exchange rate">
        <Text style={styles.label}>Base currency</Text>
        <View style={styles.chips}>
          {currencies.map((c) => (
            <TouchableOpacity key={c.code} style={[styles.chip, form.base_currency === c.code && styles.chipActive]} onPress={() => setForm({ ...form, base_currency: c.code })}>
              <Text style={[styles.chipText, form.base_currency === c.code && styles.chipTextActive]}>{c.code}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Target currency *</Text>
        <View style={styles.chips}>
          {currencies.filter((c) => c.code !== form.base_currency).map((c) => (
            <TouchableOpacity key={c.code} style={[styles.chip, form.target_currency === c.code && styles.chipActive]} onPress={() => setForm({ ...form, target_currency: c.code })}>
              <Text style={[styles.chipText, form.target_currency === c.code && styles.chipTextActive]}>{c.code}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Rate * (1 {form.base_currency} = ? {form.target_currency || '...'})</Text>
        <TextInput style={styles.input} value={form.rate} onChangeText={(v) => setForm({ ...form, rate: v })} keyboardType="decimal-pad" placeholder="0.00" />
        <Button title="Save rate" loading={saving} onPress={handleSubmit} style={{ marginTop: spacing.sm }} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.gray[500], marginHorizontal: spacing.md, marginTop: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  currencyChip: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200], borderRadius: radius.md, padding: spacing.sm, minWidth: 90 },
  currencyCode: { fontSize: 14, fontWeight: '700', color: colors.gray[900] },
  pair: { fontSize: 15, fontWeight: '600', color: colors.gray[900] },
  rate: { fontSize: 15, fontWeight: '700', color: colors.primary[700] },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, padding: spacing.md, paddingTop: spacing.sm, paddingBottom: 0 },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.gray[200] },
  chipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  chipText: { fontSize: 12, color: colors.gray[600] },
  chipTextActive: { color: colors.white, fontWeight: '600' },
});
