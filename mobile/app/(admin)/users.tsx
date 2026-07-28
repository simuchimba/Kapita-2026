import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AdminUsers() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
      </View>
      <Text style={styles.placeholder}>Users list coming soon!</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  placeholder: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 40 },
});
