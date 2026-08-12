import React from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { Search } from 'lucide-react-native';
import { radius, spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

export default function SearchInput(props: TextInputProps) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.sm,
      }}
    >
      <Search size={16} color={colors.gray[400]} style={{ marginRight: spacing.xs }} />
      <TextInput
        placeholderTextColor={colors.gray[400]}
        style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: colors.text }}
        {...props}
      />
    </View>
  );
}
