import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Star, Trash2 } from 'lucide-react-native';
import { feedbackAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import SearchInput from '../../src/components/ui/SearchInput';
import FilterChips from '../../src/components/ui/FilterChips';
import EmptyState from '../../src/components/ui/EmptyState';
import Modal from '../../src/components/ui/Modal';
import { badgeTone } from '../../src/utils/adminStatus';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface Feedback {
  id: number;
  username: string;
  email: string;
  business_name?: string;
  category: string;
  category_display: string;
  rating?: number;
  rating_display?: string;
  title: string;
  message: string;
  page?: string;
  status: string;
  status_display: string;
  admin_notes?: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'New', value: 'new' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Resolved', value: 'resolved' },
];

function Stars({ rating }: { rating?: number }) {
  if (!rating) return <Text style={typography.caption}>—</Text>;
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={13} color={n <= rating ? '#f59e0b' : colors.gray[200]} fill={n <= rating ? '#f59e0b' : 'transparent'} />
      ))}
    </View>
  );
}

export default function AdminFeedback() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<{ total: number; by_status: Record<string, number> } | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [selected, setSelected] = useState<Feedback | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [listData, statsData] = await Promise.all([
        feedbackAPI.getAll({ search, status }),
        feedbackAPI.getStats(),
      ]);
      setItems(listData?.results ?? listData ?? []);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, status]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openDetail = (item: Feedback) => {
    setSelected(item);
    setNotes(item.admin_notes || '');
    setShowDetail(true);
  };

  const updateStatus = async (newStatus: string) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const updated = await feedbackAPI.updateStatus(selected.id, { status: newStatus, admin_notes: notes });
      setItems((prev) => prev.map((i) => (i.id === selected.id ? updated : i)));
      setSelected(updated);
    } catch (err) {
      Alert.alert('Error', 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const deleteFeedback = () => {
    if (!selected) return;
    Alert.alert('Delete feedback', `Delete feedback from ${selected.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await feedbackAPI.deleteFeedback(selected.id);
            setItems((prev) => prev.filter((i) => i.id !== selected.id));
            setShowDetail(false);
          } catch (err) {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {stats && (
          <View style={styles.statsRow}>
            <Text style={styles.statChip}>Total {stats.total}</Text>
            <Text style={[styles.statChip, { color: '#1d4ed8' }]}>New {stats.by_status?.new ?? 0}</Text>
            <Text style={[styles.statChip, { color: '#b45309' }]}>Reviewed {stats.by_status?.reviewed ?? 0}</Text>
            <Text style={[styles.statChip, { color: colors.primary[700] }]}>Resolved {stats.by_status?.resolved ?? 0}</Text>
          </View>
        )}
        <SearchInput placeholder="Search title, message, user…" value={search} onChangeText={setSearch} onSubmitEditing={() => load()} returnKeyType="search" />
        <FilterChips options={STATUS_OPTIONS} value={status} onChange={setStatus} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
        ListEmptyComponent={!loading ? <EmptyState message="No feedback submitted yet." /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openDetail(item)}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={typography.caption}>{item.username} · {item.category_display}</Text>
                </View>
                <Badge label={item.status_display} tone={badgeTone(item.status)} />
              </View>
              <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
              <View style={styles.metaRow}>
                <Stars rating={item.rating} />
                <Text style={typography.caption}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />

      <Modal visible={showDetail} onClose={() => setShowDetail(false)} title={selected ? `#${selected.id} — ${selected.title}` : ''}>
        {selected && (
          <>
            <View style={styles.detailGrid}>
              <View style={styles.detailCell}>
                <Text style={typography.caption}>User</Text>
                <Text style={typography.body}>{selected.username}</Text>
                <Text style={typography.caption}>{selected.email}</Text>
              </View>
              <View style={styles.detailCell}>
                <Text style={typography.caption}>Rating</Text>
                <Stars rating={selected.rating} />
              </View>
            </View>

            <View>
              <Text style={typography.caption}>Message</Text>
              <View style={styles.messageBox}>
                <Text style={typography.body}>{selected.message}</Text>
              </View>
            </View>

            <View>
              <Text style={typography.caption}>Admin notes</Text>
              <TextInput
                style={styles.notesInput}
                multiline
                placeholder="Add internal notes…"
                placeholderTextColor={colors.gray[400]}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <View>
              <Text style={[typography.caption, { marginBottom: spacing.xs }]}>Update status</Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
                {['new', 'reviewed', 'resolved'].map((s) => (
                  <Button
                    key={s}
                    title={s}
                    size="sm"
                    variant={selected.status === s ? 'primary' : 'outline'}
                    loading={updating}
                    onPress={() => updateStatus(s)}
                  />
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <Button title="Delete" variant="danger" style={{ flex: 1 }} onPress={deleteFeedback} />
              <Button title="Close" style={{ flex: 1 }} onPress={() => setShowDetail(false)} />
            </View>
          </>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  filters: { padding: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statChip: { fontSize: 12, fontWeight: '600', color: colors.gray[700] },
  title: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  message: { fontSize: 13, color: colors.gray[600], marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  detailGrid: { flexDirection: 'row', gap: spacing.md },
  detailCell: { flex: 1 },
  messageBox: { backgroundColor: colors.gray[50], borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.xs },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
    minHeight: 60,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.gray[900],
  },
});
