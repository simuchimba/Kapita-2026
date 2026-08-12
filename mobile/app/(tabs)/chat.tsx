import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Send, Sparkles } from 'lucide-react-native';
import { chatAPI } from '../../src/services/api';
import { colors, radius, spacing } from '../../src/constants/theme';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'How much did I make this week?',
  'Who owes me money?',
  'What are my best-selling products?',
  'How much cash do I have?',
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi, I'm Mumu — ask me anything about your business, like your revenue, top products, or who owes you money." },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const nextMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const result = await chatAPI.sendMessage(trimmed, nextMessages);
      setMessages((prev) => [...prev, { role: 'assistant', content: result?.response || "Sorry, I couldn't process that." }]);
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Mumu is not available right now. Please try again later.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }]);
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <Sparkles size={18} color={colors.white} />
        <Text style={styles.headerTitle}>Ask Mumu</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
            <Text style={item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant}>{item.content}</Text>
          </View>
        )}
        ListFooterComponent={
          sending ? (
            <View style={[styles.bubble, styles.bubbleAssistant, { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }]}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.bubbleTextAssistant}>Thinking…</Text>
            </View>
          ) : null
        }
      />

      {messages.length <= 1 && (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => send(s)}>
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask about your business…"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => send(input)} disabled={sending}>
          <Send size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.primary[600],
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.white },
  bubble: { maxWidth: '85%', padding: spacing.sm, borderRadius: radius.lg },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.primary[600], borderBottomRightRadius: 4 },
  bubbleAssistant: { alignSelf: 'flex-start', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200], borderBottomLeftRadius: 4 },
  bubbleTextUser: { color: colors.white, fontSize: 14 },
  bubbleTextAssistant: { color: colors.gray[900], fontSize: 14 },
  suggestions: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  suggestionChip: { paddingHorizontal: spacing.sm, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.primary[50], borderWidth: 1, borderColor: colors.primary[100] },
  suggestionText: { fontSize: 12, color: colors.primary[700], fontWeight: '500' },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary[600], alignItems: 'center', justifyContent: 'center' },
});
