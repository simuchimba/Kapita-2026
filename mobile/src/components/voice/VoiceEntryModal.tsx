import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, TextInput, Animated, Easing, Alert } from 'react-native';
import { Mic, Square, X, Pencil, Check, RotateCcw } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { chatAPI, voiceAPI, salesAPI, expensesAPI } from '../../services/api';
import { useAppTheme } from '../../context/ThemeContext';
import { radius, spacing } from '../../constants/theme';

type Stage =
  | 'idle' | 'requesting_permission' | 'recording' | 'processing'
  | 'clarification' | 'ambiguous' | 'review' | 'saving' | 'success' | 'error';

interface SaleProposal {
  product_id: number; product_name: string; unit: string; quantity: number;
  unit_price: number; total_amount: number; cost_of_goods: number;
  estimated_profit: number; payment_method: string; customer_name: string | null;
}
interface ExpenseProposal { title: string; amount: number; category: string }
interface Candidate { id: number; name: string; selling_price: number; unit: string; quantity_available: number }

export default function VoiceEntryModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const { colors } = useAppTheme();
  const [stage, setStage] = useState<Stage>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [transactionType, setTransactionType] = useState<'sale' | 'expense' | null>(null);
  const [saleProposal, setSaleProposal] = useState<SaleProposal | null>(null);
  const [expenseProposal, setExpenseProposal] = useState<ExpenseProposal | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pendingSaleContext, setPendingSaleContext] = useState<{ quantity: number; payment_method: string | null; customer_name: string | null } | null>(null);
  const [editing, setEditing] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  const reset = useCallback(() => {
    setStage('idle');
    setTranscript('');
    setErrorMessage('');
    setSeconds(0);
    setTransactionType(null);
    setSaleProposal(null);
    setExpenseProposal(null);
    setCandidates([]);
    setPendingSaleContext(null);
    setEditing(false);
  }, []);

  useEffect(() => {
    if (!visible) reset();
  }, [visible, reset]);

  useEffect(() => {
    if (stage === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [stage, pulse]);

  const startRecording = async () => {
    setStage('requesting_permission');
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage('Microphone access is needed to use Tell Kapita.');
        setStage('error');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setSeconds(0);
      setStage('recording');
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (error) {
      setErrorMessage('Could not start recording. Please try again.');
      setStage('error');
    }
  };

  const cancelRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await recordingRef.current?.stopAndUnloadAsync();
    } catch {}
    recordingRef.current = null;
    reset();
  };

  const stopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const recording = recordingRef.current;
    if (!recording) return;

    setStage('processing');
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      if (!uri || seconds < 1) {
        setErrorMessage("I didn't catch anything. Please try again.");
        setStage('error');
        return;
      }

      const sttResult = await chatAPI.speechToText(uri);
      const text = (sttResult?.text || '').trim();
      setTranscript(text);
      if (!text) {
        setErrorMessage("I didn't catch anything. Please try again.");
        setStage('error');
        return;
      }

      const result = await voiceAPI.parse(text);
      applyParseResult(result);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || error.response?.data?.detail || 'Something went wrong while processing your entry. Please try again.');
      setStage('error');
    }
  };

  const applyParseResult = (result: any) => {
    if (result.status === 'clarification_needed' || result.status === 'product_not_found' || result.status === 'insufficient_stock') {
      setErrorMessage(result.message || (result.status === 'product_not_found' ? `"${result.product_name}" isn't in your inventory yet.` : 'Please try again.'));
      setStage('clarification');
      return;
    }
    if (result.status === 'ambiguous_product') {
      setCandidates(result.candidates || []);
      setPendingSaleContext({ quantity: result.quantity, payment_method: result.payment_method, customer_name: result.customer_name });
      setStage('ambiguous');
      return;
    }
    if (result.status === 'ready') {
      setTransactionType(result.transaction_type);
      if (result.transaction_type === 'sale') setSaleProposal(result.proposal);
      else setExpenseProposal(result.proposal);
      setStage('review');
    }
  };

  const pickCandidate = async (candidate: Candidate) => {
    if (!pendingSaleContext) return;
    setStage('processing');
    try {
      const result = await voiceAPI.resolveProduct({
        product_id: candidate.id,
        quantity: pendingSaleContext.quantity,
        payment_method: pendingSaleContext.payment_method,
        customer_name: pendingSaleContext.customer_name,
      });
      applyParseResult(result);
    } catch (error) {
      setErrorMessage('Failed to resolve product. Please try again.');
      setStage('error');
    }
  };

  const handleConfirm = async () => {
    setStage('saving');
    try {
      if (transactionType === 'sale' && saleProposal) {
        await salesAPI.create({
          product: saleProposal.product_id,
          quantity: saleProposal.quantity,
          unit_price: saleProposal.unit_price,
          payment_type: saleProposal.payment_method,
          customer: null,
          source: 'voice',
        });
      } else if (transactionType === 'expense' && expenseProposal) {
        await expensesAPI.create({
          title: expenseProposal.title,
          amount: expenseProposal.amount,
          category: expenseProposal.category,
          date: new Date().toISOString().slice(0, 10),
          source: 'voice',
        });
      }
      setStage('success');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1400);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Failed to save. Please try again.');
      setStage('error');
    }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: 'rgba(15,23,42,0.6)' }]}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          {stage === 'idle' && (
            <View style={styles.center}>
              <Text style={[styles.title, { color: colors.text }]}>Tell Kapita</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Tell me what happened in your business.</Text>
              <TouchableOpacity style={[styles.micBtn, { backgroundColor: colors.primary[600] }]} onPress={startRecording}>
                <Mic size={32} color={colors.white} />
              </TouchableOpacity>
              <Text style={[styles.hint, { color: colors.textMuted }]}>e.g. "I sold five tomatoes for thirty kwacha cash"</Text>
            </View>
          )}

          {stage === 'requesting_permission' && (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary[600]} />
              <Text style={[styles.subtitle, { color: colors.textMuted, marginTop: spacing.sm }]}>Requesting microphone access…</Text>
            </View>
          )}

          {stage === 'recording' && (
            <View style={styles.center}>
              <Text style={[styles.title, { color: colors.text }]}>Listening…</Text>
              <Animated.View style={[styles.micBtn, styles.micBtnRecording, { backgroundColor: colors.danger, transform: [{ scale: pulse }] }]}>
                <Mic size={32} color={colors.white} />
              </Animated.View>
              <Text style={[styles.timer, { color: colors.text }]}>{mm}:{ss}</Text>
              <View style={styles.rowGap}>
                <TouchableOpacity style={[styles.pillBtn, { backgroundColor: colors.gray[100] }]} onPress={cancelRecording}>
                  <Text style={{ color: colors.gray[700], fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pillBtn, { backgroundColor: colors.primary[600] }]} onPress={stopRecording}>
                  <Square size={14} color={colors.white} />
                  <Text style={{ color: colors.white, fontWeight: '600', marginLeft: 6 }}>Stop</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {stage === 'processing' && (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary[600]} />
              {transcript ? (
                <>
                  <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.md }]}>You said:</Text>
                  <Text style={[styles.transcriptText, { color: colors.text }]}>"{transcript}"</Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted, marginTop: spacing.sm }]}>Understanding your entry…</Text>
                </>
              ) : (
                <Text style={[styles.subtitle, { color: colors.textMuted, marginTop: spacing.sm }]}>Transcribing…</Text>
              )}
            </View>
          )}

          {(stage === 'clarification' || stage === 'error') && (
            <View style={styles.center}>
              <Text style={[styles.title, { color: colors.text }]}>{stage === 'error' ? 'Something went wrong' : "I need a bit more info"}</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: 'center' }]}>{errorMessage}</Text>
              <View style={styles.rowGap}>
                <TouchableOpacity style={[styles.pillBtn, { backgroundColor: colors.gray[100] }]} onPress={onClose}>
                  <Text style={{ color: colors.gray[700], fontWeight: '600' }}>Enter Manually</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pillBtn, { backgroundColor: colors.primary[600] }]} onPress={() => { reset(); startRecording(); }}>
                  <RotateCcw size={14} color={colors.white} />
                  <Text style={{ color: colors.white, fontWeight: '600', marginLeft: 6 }}>Try Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {stage === 'ambiguous' && (
            <View>
              <Text style={[styles.title, { color: colors.text, marginBottom: spacing.sm }]}>Which product did you mean?</Text>
              {candidates.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.candidateRow, { borderColor: colors.border }]}
                  onPress={() => pickCandidate(c)}
                >
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{c.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>K{c.selling_price} · {c.quantity_available} {c.unit} in stock</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {stage === 'review' && transactionType === 'sale' && saleProposal && (
            <SaleReview
              proposal={saleProposal}
              editing={editing}
              onToggleEdit={() => setEditing((v) => !v)}
              onChange={setSaleProposal}
              onCancel={onClose}
              onConfirm={handleConfirm}
            />
          )}

          {stage === 'review' && transactionType === 'expense' && expenseProposal && (
            <ExpenseReview
              proposal={expenseProposal}
              editing={editing}
              onToggleEdit={() => setEditing((v) => !v)}
              onChange={setExpenseProposal}
              onCancel={onClose}
              onConfirm={handleConfirm}
            />
          )}

          {stage === 'saving' && (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary[600]} />
              <Text style={[styles.subtitle, { color: colors.textMuted, marginTop: spacing.sm }]}>Saving…</Text>
            </View>
          )}

          {stage === 'success' && (
            <View style={styles.center}>
              <View style={[styles.successCircle, { backgroundColor: colors.primary[100] }]}>
                <Check size={32} color={colors.primary[700]} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                {transactionType === 'sale' ? 'Sale recorded' : 'Expense recorded'}
              </Text>
              {transactionType === 'sale' && saleProposal && (
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  K{saleProposal.total_amount} added · Est. profit K{saleProposal.estimated_profit}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function SaleReview({ proposal, editing, onToggleEdit, onChange, onCancel, onConfirm }: {
  proposal: SaleProposal; editing: boolean; onToggleEdit: () => void;
  onChange: (p: SaleProposal) => void; onCancel: () => void; onConfirm: () => void;
}) {
  const { colors } = useAppTheme();
  const recalc = (quantity: number, unit_price: number) => {
    const total = Math.round(quantity * unit_price * 100) / 100;
    const cost = Math.round((quantity * (proposal.cost_of_goods / proposal.quantity)) * 100) / 100;
    onChange({ ...proposal, quantity, unit_price, total_amount: total, estimated_profit: Math.round((total - cost) * 100) / 100 });
  };

  return (
    <View>
      <Text style={[styles.reviewTitle, { color: colors.textMuted }]}>Kapita understood</Text>
      <Text style={[styles.reviewHeadline, { color: colors.text }]}>🛒 Sale — {proposal.product_name}</Text>

      {editing ? (
        <View>
          <Text style={[styles.label, { color: colors.gray[700] }]}>Quantity</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            keyboardType="number-pad"
            value={String(proposal.quantity)}
            onChangeText={(v) => recalc(parseFloat(v) || 0, proposal.unit_price)}
          />
          <Text style={[styles.label, { color: colors.gray[700] }]}>Unit price (K)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            keyboardType="decimal-pad"
            value={String(proposal.unit_price)}
            onChangeText={(v) => recalc(proposal.quantity, parseFloat(v) || 0)}
          />
        </View>
      ) : (
        <View style={[styles.reviewCard, { borderColor: colors.border }]}>
          <ReviewRow label="Quantity" value={`${proposal.quantity} ${proposal.unit}`} colors={colors} />
          <ReviewRow label="Unit price" value={`K${proposal.unit_price}`} colors={colors} />
          <ReviewRow label="Total" value={`K${proposal.total_amount}`} bold colors={colors} />
          <ReviewRow label="Payment" value={proposal.payment_method.replace('_', ' ')} colors={colors} />
          <ReviewRow label="Customer" value={proposal.customer_name || 'Walk-in customer'} colors={colors} />
          <ReviewRow label="Estimated profit" value={`K${proposal.estimated_profit}`} bold tone="profit" colors={colors} />
        </View>
      )}

      <ReviewActions colors={colors} editing={editing} onToggleEdit={onToggleEdit} onCancel={onCancel} onConfirm={onConfirm} />
    </View>
  );
}

function ExpenseReview({ proposal, editing, onToggleEdit, onChange, onCancel, onConfirm }: {
  proposal: ExpenseProposal; editing: boolean; onToggleEdit: () => void;
  onChange: (p: ExpenseProposal) => void; onCancel: () => void; onConfirm: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View>
      <Text style={[styles.reviewTitle, { color: colors.textMuted }]}>Kapita understood</Text>
      <Text style={[styles.reviewHeadline, { color: colors.text }]}>💸 Expense — {proposal.title}</Text>

      {editing ? (
        <View>
          <Text style={[styles.label, { color: colors.gray[700] }]}>Title</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            value={proposal.title}
            onChangeText={(v) => onChange({ ...proposal, title: v })}
          />
          <Text style={[styles.label, { color: colors.gray[700] }]}>Amount (K)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            keyboardType="decimal-pad"
            value={String(proposal.amount)}
            onChangeText={(v) => onChange({ ...proposal, amount: parseFloat(v) || 0 })}
          />
        </View>
      ) : (
        <View style={[styles.reviewCard, { borderColor: colors.border }]}>
          <ReviewRow label="Category" value={proposal.category.replace(/_/g, ' ')} colors={colors} />
          <ReviewRow label="Amount" value={`K${proposal.amount}`} bold colors={colors} />
        </View>
      )}

      <ReviewActions colors={colors} editing={editing} onToggleEdit={onToggleEdit} onCancel={onCancel} onConfirm={onConfirm} />
    </View>
  );
}

function ReviewRow({ label, value, bold, tone, colors }: { label: string; value: string; bold?: boolean; tone?: 'profit'; colors: any }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: tone === 'profit' ? colors.primary[700] : colors.text, fontWeight: bold ? '700' : '500', fontSize: bold ? 15 : 14 }}>{value}</Text>
    </View>
  );
}

function ReviewActions({ colors, editing, onToggleEdit, onCancel, onConfirm }: { colors: any; editing: boolean; onToggleEdit: () => void; onCancel: () => void; onConfirm: () => void }) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <View style={styles.rowGap}>
        <TouchableOpacity style={[styles.pillBtn, { backgroundColor: colors.gray[100] }]} onPress={onCancel}>
          <Text style={{ color: colors.gray[700], fontWeight: '600' }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pillBtn, { backgroundColor: colors.gray[100] }]} onPress={onToggleEdit}>
          <Pencil size={14} color={colors.gray[700]} />
          <Text style={{ color: colors.gray[700], fontWeight: '600', marginLeft: 6 }}>{editing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary[600] }]} onPress={onConfirm}>
        <Check size={16} color={colors.white} />
        <Text style={{ color: colors.white, fontWeight: '700', marginLeft: 6, fontSize: 15 }}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, minHeight: 340 },
  closeBtn: { alignSelf: 'flex-end', padding: spacing.xs, marginBottom: spacing.xs },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 13 },
  hint: { fontSize: 12, marginTop: spacing.md, fontStyle: 'italic' },
  micBtn: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.md },
  micBtnRecording: {},
  timer: { fontSize: 20, fontWeight: '700', marginBottom: spacing.md },
  rowGap: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  pillBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: spacing.md, borderRadius: radius.full, flex: 1 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: radius.full, marginTop: spacing.sm },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 4, marginTop: spacing.sm },
  input: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 10, fontSize: 15 },
  transcriptText: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 4, paddingHorizontal: spacing.md },
  reviewTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewHeadline: { fontSize: 18, fontWeight: '700', marginTop: 4, marginBottom: spacing.sm },
  reviewCard: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: 8 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  candidateRow: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  successCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
});
