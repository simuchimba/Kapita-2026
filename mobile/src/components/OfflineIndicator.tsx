import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNetwork } from '../context/NetworkContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingOperations, syncNow } = useNetwork();

  if (isOnline && pendingOperations === 0 && !isSyncing) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      isOnline ? styles.online : styles.offline
    ]}>
      <View style={styles.content}>
        <Text style={styles.text}>
          {!isOnline ? '🔴 Offline' : isSyncing ? '🔄 Syncing...' : `⏳ ${pendingOperations} pending`}
        </Text>
        {isOnline && pendingOperations > 0 && !isSyncing && (
          <TouchableOpacity onPress={syncNow} style={styles.syncButton}>
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  online: {
    backgroundColor: '#fef3c7',
  },
  offline: {
    backgroundColor: '#fee2e2',
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  syncButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
