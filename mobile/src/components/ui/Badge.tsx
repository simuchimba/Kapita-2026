import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../../constants/theme';

type Tone = 'gray' | 'green' | 'blue' | 'amber' | 'red';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  gray: { bg: colors.gray[100], fg: colors.gray[700] },
  green: { bg: colors.primary[100], fg: colors.primary[800] },
  blue: { bg: '#dbeafe', fg: '#1d4ed8' },
  amber: { bg: '#fef3c7', fg: '#b45309' },
  red: { bg: colors.dangerBg, fg: colors.danger },
};

export default function Badge({ label, tone = 'gray' }: { label: string; tone?: Tone }) {
  const { bg, fg } = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600' },
});
