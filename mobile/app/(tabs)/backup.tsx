import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { AlertTriangle, CloudDownload, CloudUpload } from 'lucide-react-native';
import { backupAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

function uint8ToBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return global.btoa ? global.btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
}

export default function BackupScreen() {
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await backupAPI.exportBackup();
      const base64 = uint8ToBase64(new Uint8Array(data));
      const filename = `kapita_backup_${new Date().toISOString().slice(0, 10)}.zip`;
      const fileUri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/zip', dialogTitle: 'Save your Kapita backup' });
      } else {
        Alert.alert('Exported', `Backup saved to ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export backup');
    } finally {
      setExporting(false);
    }
  };

  const confirmRestore = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/zip', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;

    Alert.alert(
      'Restore backup?',
      'This will permanently DELETE all your current business data and replace it with the contents of this backup file. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', style: 'destructive', onPress: () => handleRestore(result.assets[0]) },
      ]
    );
  };

  const handleRestore = async (file: DocumentPicker.DocumentPickerAsset) => {
    setRestoring(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: file.name, type: 'application/zip' } as any);
      await backupAPI.restoreBackup(formData);
      Alert.alert('Restored', 'Your data has been restored from the backup.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to restore backup');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      <Text style={typography.title}>Backup & Restore</Text>

      <Card>
        <View style={styles.rowHeader}>
          <CloudDownload size={20} color={colors.primary[600]} />
          <Text style={styles.cardTitle}>Export backup</Text>
        </View>
        <Text style={[typography.caption, { marginBottom: spacing.sm }]}>
          Download a complete copy of your business data (products, sales, customers, and more) as a ZIP file.
        </Text>
        <Button title="Export & share backup" loading={exporting} onPress={handleExport} />
      </Card>

      <Card>
        <View style={styles.rowHeader}>
          <CloudUpload size={20} color={colors.danger} />
          <Text style={styles.cardTitle}>Restore backup</Text>
        </View>
        <View style={styles.warningBox}>
          <AlertTriangle size={14} color={colors.warning} />
          <Text style={styles.warningText}>This replaces ALL current data with the backup file. This cannot be undone.</Text>
        </View>
        <Button title="Choose backup file to restore" variant="danger" loading={restoring} onPress={confirmRestore} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[900] },
  warningBox: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  warningText: { flex: 1, fontSize: 12, color: colors.warning, fontWeight: '500' },
});
