import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
    business_name: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleRegister = async () => {
    const { username, email, password, password2, first_name, last_name, phone, business_name } = form;
    if (!username || !email || !password || !password2 || !first_name || !last_name || !phone || !business_name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== password2) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password, password2, first_name, last_name, phone, business_name);
      Alert.alert('Success', 'Account created! Please sign in.', [
        { text: 'OK', onPress: () => router.push('/(auth)/login') },
      ]);
    } catch (error: any) {
      const data = error.response?.data;
      const msg = data
        ? Object.values(data).flat().join('\n')
        : 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const fields: { key: string; label: string; keyboard?: any; secure?: boolean }[] = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email', keyboard: 'email-address' },
    { key: 'business_name', label: 'Business Name' },
    { key: 'phone', label: 'Phone', keyboard: 'phone-pad' },
    { key: 'password', label: 'Password', secure: true },
    { key: 'password2', label: 'Confirm Password', secure: true },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start your free trial</Text>

        <View style={styles.form}>
          {fields.map(({ key, label, keyboard, secure }) => (
            <TextInput
              key={key}
              style={styles.input}
              placeholder={label}
              placeholderTextColor="#aaa"
              value={(form as any)[key]}
              onChangeText={set(key)}
              autoCapitalize={key === 'email' || key === 'username' ? 'none' : 'words'}
              keyboardType={keyboard || 'default'}
              secureTextEntry={secure}
            />
          ))}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#059669', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
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
  linkText: { color: '#059669', textAlign: 'center', fontSize: 14 },
});
