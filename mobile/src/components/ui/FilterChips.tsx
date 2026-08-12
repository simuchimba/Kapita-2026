import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { radius, spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

interface Option { label: string; value: string }

export default function FilterChips({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingVertical: 2 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value || 'all'}
            onPress={() => onChange(opt.value)}
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: 7,
              borderRadius: radius.full,
              backgroundColor: active ? colors.primary[600] : colors.card,
              borderWidth: 1,
              borderColor: active ? colors.primary[600] : colors.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: active ? colors.white : colors.gray[600] }}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
