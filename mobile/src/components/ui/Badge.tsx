import React from 'react';
import { View, Text } from 'react-native';
import { radius } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

type Tone = 'gray' | 'green' | 'blue' | 'amber' | 'red';

export default function Badge({ label, tone = 'gray' }: { label: string; tone?: Tone }) {
  const { colors, isDark } = useAppTheme();
  const tones: Record<Tone, { bg: string; fg: string }> = {
    gray: { bg: colors.gray[100], fg: colors.gray[700] },
    green: { bg: colors.primary[100], fg: colors.primary[800] },
    blue: isDark ? { bg: '#1e3a5f', fg: '#93c5fd' } : { bg: '#dbeafe', fg: '#1d4ed8' },
    amber: isDark ? { bg: '#4a3a0a', fg: '#fcd34d' } : { bg: '#fef3c7', fg: '#b45309' },
    red: { bg: colors.dangerBg, fg: colors.danger },
  };
  const { bg, fg } = tones[tone];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: fg }}>{label}</Text>
    </View>
  );
}
