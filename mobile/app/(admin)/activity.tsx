import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { billingAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import EmptyState from '../../src/components/ui/EmptyState';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface ActivityLog {
  id: number;
  action: string;
  created_at: string;
  actor_username?: string;
  target_username?: string;
  details?: Record<string, any>;
}

function formatAction(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminActivity() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await billingAPI.getActivityLogs();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
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

  return (
    <FlatList
      style={styles.container}
      data={logs}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary[600]} />}
      ListEmptyComponent={!loading ? <EmptyState message="No activity recorded yet." /> : null}
      renderItem={({ item }) => (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.action}>{formatAction(item.action)}</Text>
            <Text style={typography.caption}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
          <Text style={[typography.caption, { marginTop: spacing.xs }]}>
            {item.actor_username || 'system'} → {item.target_username || 'N/A'}
          </Text>
          {item.details && Object.keys(item.details).length > 0 && (
            <View style={styles.detailsBox}>
              <Text style={styles.detailsText}>{JSON.stringify(item.details, null, 2)}</Text>
            </View>
          )}
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  action: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  detailsBox: { marginTop: spacing.sm, backgroundColor: colors.gray[50], borderRadius: radius.sm, padding: spacing.sm },
  detailsText: { fontSize: 11, color: colors.gray[600], fontFamily: 'Courier' },
});
