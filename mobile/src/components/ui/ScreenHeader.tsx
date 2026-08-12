import React from 'react';
import { View, Text } from 'react-native';
import { spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

export default function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const { typography } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm }}>
      <View style={{ flex: 1 }}>
        <Text style={typography.title}>{title}</Text>
        {subtitle ? <Text style={[typography.subtitle, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
