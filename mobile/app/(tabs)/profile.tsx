import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronRight, KeyRound, Mail, MapPin, Moon, Phone, Sun } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { authAPI } from '../../src/services/api';
import { useAppTheme } from '../../src/context/ThemeContext';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import Modal from '../../src/components/ui/Modal';
import { radius, spacing } from '../../src/constants/theme';

const CURRENCIES = ['ZMW', 'USD', 'ZAR', 'GBP', 'EUR'];

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { colors, typography, isDark, toggleTheme } = useAppTheme();
  const router = useRouter();

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    business_name: user?.business_name || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    currency: user?.currency || 'ZMW',
  });
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });

  const initial = (user?.business_name || user?.first_name || user?.username || '?').charAt(0).toUpperCase();
  const logoUrl = user?.logo;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to update your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('logo', { uri: asset.uri, name: asset.fileName || 'profile.jpg', type: asset.mimeType || 'image/jpeg' } as any);
      await authAPI.updateProfile(formData);
      await refreshUser();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile(profileData);
      await refreshUser();
      setShowEditModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.old_password || !passwordData.new_password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword(passwordData);
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      setShowPasswordModal(false);
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.old_password?.[0] || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.primary[600] }]}>
        <TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto} disabled={uploadingPhoto}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
          <View style={[styles.cameraBadge, { backgroundColor: colors.white }]}>
            <Camera size={13} color={colors.primary[700]} />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{user?.business_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username}</Text>
        <Text style={[styles.email, { color: colors.primary[100] }]}>{user?.email}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Account details</Text>
        <Card>
          <View style={styles.row}>
            <Mail size={16} color={colors.gray[400]} />
            <View style={{ flex: 1 }}>
              <Text style={typography.caption}>Email</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.email || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Phone size={16} color={colors.gray[400]} />
            <View style={{ flex: 1 }}>
              <Text style={typography.caption}>Phone</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.phone || 'Not set'}</Text>
            </View>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <MapPin size={16} color={colors.gray[400]} />
            <View style={{ flex: 1 }}>
              <Text style={typography.caption}>Address</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.address || 'Not set'}</Text>
            </View>
          </View>
        </Card>
        <Button title="Edit profile" variant="secondary" size="sm" onPress={() => setShowEditModal(true)} style={{ marginTop: spacing.sm }} />

        <Text style={styles.sectionTitle}>Appearance</Text>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={styles.actionRow}>
            {isDark ? <Moon size={18} color={colors.gray[500]} /> : <Sun size={18} color={colors.gray[500]} />}
            <Text style={[styles.actionText, { color: colors.text }]}>Dark mode</Text>
            <Button title={isDark ? 'On' : 'Off'} size="sm" variant={isDark ? 'primary' : 'secondary'} onPress={toggleTheme} />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Security</Text>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <TouchableOpacity style={styles.actionRow} onPress={() => setShowPasswordModal(true)}>
            <KeyRound size={18} color={colors.gray[500]} />
            <Text style={[styles.actionText, { color: colors.text }]}>Change Password</Text>
            <ChevronRight size={16} color={colors.gray[300]} />
          </TouchableOpacity>
        </Card>

        <Button title="Logout" variant="danger" onPress={handleLogout} style={{ marginTop: spacing.lg }} />
      </View>

      <Modal visible={showEditModal} onClose={() => setShowEditModal(false)} title="Edit profile">
        <Text style={[styles.label, { color: colors.gray[700] }]}>Business name</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]} value={profileData.business_name} onChangeText={(v) => setProfileData({ ...profileData, business_name: v })} placeholderTextColor={colors.gray[400]} />
        <Text style={[styles.label, { color: colors.gray[700] }]}>First name</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]} value={profileData.first_name} onChangeText={(v) => setProfileData({ ...profileData, first_name: v })} placeholderTextColor={colors.gray[400]} />
        <Text style={[styles.label, { color: colors.gray[700] }]}>Last name</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]} value={profileData.last_name} onChangeText={(v) => setProfileData({ ...profileData, last_name: v })} placeholderTextColor={colors.gray[400]} />
        <Text style={[styles.label, { color: colors.gray[700] }]}>Phone</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]} value={profileData.phone} onChangeText={(v) => setProfileData({ ...profileData, phone: v })} keyboardType="phone-pad" placeholderTextColor={colors.gray[400]} />
        <Text style={[styles.label, { color: colors.gray[700] }]}>Address</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]} value={profileData.address} onChangeText={(v) => setProfileData({ ...profileData, address: v })} placeholderTextColor={colors.gray[400]} />

        <Text style={[styles.label, { color: colors.gray[700] }]}>Currency</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setProfileData({ ...profileData, currency: c })}
              style={{
                paddingHorizontal: spacing.sm, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1,
                backgroundColor: profileData.currency === c ? colors.primary[600] : colors.card,
                borderColor: profileData.currency === c ? colors.primary[600] : colors.border,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: profileData.currency === c ? colors.white : colors.gray[600] }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title="Save changes" loading={saving} onPress={handleSaveProfile} style={{ marginTop: spacing.md }} />
      </Modal>

      <Modal visible={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change password">
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]} placeholder="Current password" placeholderTextColor={colors.gray[400]} secureTextEntry value={passwordData.old_password} onChangeText={(v) => setPasswordData({ ...passwordData, old_password: v })} />
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]} placeholder="New password" placeholderTextColor={colors.gray[400]} secureTextEntry value={passwordData.new_password} onChangeText={(v) => setPasswordData({ ...passwordData, new_password: v })} />
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]} placeholder="Confirm new password" placeholderTextColor={colors.gray[400]} secureTextEntry value={passwordData.confirm_password} onChangeText={(v) => setPasswordData({ ...passwordData, confirm_password: v })} />
        <Button title="Change password" loading={saving} onPress={handlePasswordChange} style={{ marginTop: spacing.sm }} />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  avatarWrap: { marginBottom: spacing.sm },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  cameraBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)',
  },
  name: { fontSize: 18, fontWeight: '700', color: '#fff' },
  email: { fontSize: 13, marginTop: 2 },
  content: { padding: spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#9ca3af', marginBottom: spacing.sm, marginTop: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  value: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  actionText: { flex: 1, fontSize: 15, fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 4, marginTop: spacing.sm },
  input: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 10, fontSize: 15 },
});
