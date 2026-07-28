import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isStaff } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!usernameOrEmail || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(usernameOrEmail, password);
      // If user is staff, redirect to admin, else to regular tabs
      if (isStaff) {
        router.replace('/(admin)');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.non_field_errors?.[0] ||
        error.response?.data?.detail ||
        'Invalid credentials. Please try again.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Kapita</Text>
        <Text style={styles.subtitle}>Smart Business Tracking</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Username or Email"
            placeholderTextColor="#aaa"
            value={usernameOrEmail}
            onChangeText={setUsernameOrEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.links}>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>Don't have an account? Register</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/admin/login')}>
            <Text style={[styles.linkText, styles.adminLink]}>Admin Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#059669', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 48 },
  form: { marginBottom: 24 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#111',
  },
  button: { backgroundColor: '#059669', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#a7f3d0' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  links: { gap: 16, alignItems: 'center' },
  linkText: { color: '#059669', textAlign: 'center', fontSize: 14 },
  adminLink: { color: '#3b82f6' },
});
