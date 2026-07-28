import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { usePathname } from 'expo-router';
import { MessageSquarePlus, X, Star, Send, CheckCircle2 } from 'lucide-react-native';
import { feedbackAPI } from '../services/api';
import { colors, radius, shadow, spacing, typography } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORIES = [
  { value: 'bug', label: '🐛 Bug' },
  { value: 'feature', label: '✨ Feature' },
  { value: 'ux', label: '🎨 UX' },
  { value: 'performance', label: '⚡ Performance' },
  { value: 'general', label: '💬 General' },
];

const EMPTY = { category: 'general', rating: 0, title: '', message: '' };

export default function FeedbackBar() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const pathname = usePathname();

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setError('Title and message are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await feedbackAPI.submit({
        ...form,
        rating: form.rating || null,
        page: pathname,
      });
      setSubmitted(true);
      setForm(EMPTY);
      setTimeout(() => {
        setSubmitted(false);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {open && (
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <MessageSquarePlus size={18} color={colors.primary[600]} />
              <Text style={styles.headerTitle}>Beta Feedback</Text>
            </View>
            <TouchableOpacity onPress={toggle} style={styles.closeBtn}>
              <X size={16} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={styles.thankYou}>
              <CheckCircle2 size={40} color={colors.primary[500]} />
              <Text style={styles.thankYouTitle}>Thank you for your feedback!</Text>
              <Text style={typography.caption}>It'll help improve Kapita.</Text>
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    onPress={() => setForm({ ...form, category: c.value })}
                    style={[styles.categoryChip, form.category === c.value && styles.categoryChipActive]}
                  >
                    <Text style={[styles.categoryLabel, form.category === c.value && styles.categoryLabelActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Overall rating (optional)</Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setForm({ ...form, rating: n === form.rating ? 0 : n })}>
                    <Star size={24} color={n <= form.rating ? '#f59e0b' : colors.gray[300]} fill={n <= form.rating ? '#f59e0b' : 'transparent'} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Short title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Summarise your feedback"
                placeholderTextColor={colors.gray[400]}
                maxLength={150}
                value={form.title}
                onChangeText={(text) => setForm({ ...form, title: text })}
              />

              <Text style={styles.label}>Details *</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Describe the issue or idea in detail…"
                placeholderTextColor={colors.gray[400]}
                multiline
                value={form.message}
                onChangeText={(text) => setForm({ ...form, message: text })}
              />

              <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
                <Send size={16} color={colors.white} />
                <Text style={styles.submitText}>{loading ? 'Submitting…' : 'Submit Feedback'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.trigger} onPress={toggle} activeOpacity={0.85}>
        <MessageSquarePlus size={18} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: spacing.md, bottom: 76, alignItems: 'flex-end' },
  trigger: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.raised,
  },
  panel: {
    width: 300,
    maxWidth: '90%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.raised,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  headerTitle: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  closeBtn: { padding: spacing.xs },
  label: { fontSize: 12, fontWeight: '600', color: colors.gray[700] },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  categoryChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  categoryChipActive: { backgroundColor: colors.primary[50], borderColor: colors.primary[300] },
  categoryLabel: { fontSize: 12, color: colors.gray[600] },
  categoryLabelActive: { color: colors.primary[700], fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.gray[900],
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[600],
    borderRadius: radius.sm,
    paddingVertical: 12,
    marginTop: spacing.xs,
  },
  submitText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 12, backgroundColor: colors.dangerBg, padding: spacing.xs, borderRadius: radius.sm },
  thankYou: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  thankYouTitle: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
});
