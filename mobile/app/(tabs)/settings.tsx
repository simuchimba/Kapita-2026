import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ChevronRight, KeyRound, LogOut, UserCog } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { authAPI } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import Modal from '../../src/components/ui/Modal';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

export default function SettingsScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [profileData, setProfileData] = useState({ business_name: '', phone: '', address: '' });

  useEffect(() => {
    if (user) {
      setProfileData({
        business_name: user.business_name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handlePasswordChange = async () => {
    if (!passwordData.old_password || !passwordData.new_password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword(passwordData);
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      setShowPasswordModal(false);
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.old_password?.[0] || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      await authAPI.updateProfile(profileData);
      setShowProfileModal(false);
      refreshUser();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account information</Text>
        <Card>
          <View style={styles.infoRow}>
            <Text style={typography.caption}>Business Name</Text>
            <Text style={styles.infoValue}>{user?.business_name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={typography.caption}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={typography.caption}>Phone</Text>
            <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account actions</Text>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <TouchableOpacity style={styles.actionRow} onPress={() => setShowProfileModal(true)}>
            <UserCog size={18} color={colors.gray[500]} />
            <Text style={styles.actionText}>Edit Profile</Text>
            <ChevronRight size={16} color={colors.gray[300]} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={() => setShowPasswordModal(true)}>
            <KeyRound size={18} color={colors.gray[500]} />
            <Text style={styles.actionText}>Change Password</Text>
            <ChevronRight size={16} color={colors.gray[300]} />
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.section}>
        <Button title="Logout" variant="danger" onPress={handleLogout} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs }}>
          <LogOut size={12} color={colors.gray[400]} />
        </View>
      </View>

      <Modal visible={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change password">
        <TextInput style={styles.input} placeholder="Current password" secureTextEntry value={passwordData.old_password} onChangeText={(v) => setPasswordData({ ...passwordData, old_password: v })} />
        <TextInput style={styles.input} placeholder="New password" secureTextEntry value={passwordData.new_password} onChangeText={(v) => setPasswordData({ ...passwordData, new_password: v })} />
        <TextInput style={styles.input} placeholder="Confirm new password" secureTextEntry value={passwordData.confirm_password} onChangeText={(v) => setPasswordData({ ...passwordData, confirm_password: v })} />
        <Button title="Change password" loading={loading} onPress={handlePasswordChange} style={{ marginTop: spacing.sm }} />
      </Modal>

      <Modal visible={showProfileModal} onClose={() => setShowProfileModal(false)} title="Edit profile">
        <TextInput style={styles.input} placeholder="Business name" value={profileData.business_name} onChangeText={(v) => setProfileData({ ...profileData, business_name: v })} />
        <TextInput style={styles.input} placeholder="Phone" value={profileData.phone} onChangeText={(v) => setProfileData({ ...profileData, phone: v })} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Address" value={profileData.address} onChangeText={(v) => setProfileData({ ...profileData, address: v })} />
        <Button title="Save changes" loading={loading} onPress={handleProfileUpdate} style={{ marginTop: spacing.sm }} />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: { padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  section: { padding: spacing.md, paddingTop: spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  actionText: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.gray[900] },
  divider: { height: 1, backgroundColor: colors.gray[100] },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.gray[900],
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
});
