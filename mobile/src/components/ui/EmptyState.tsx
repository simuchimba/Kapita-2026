import React from 'react';
import { View, Text } from 'react-native';
import { spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

export default function EmptyState({ message }: { message: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ paddingVertical: spacing.xl * 2, alignItems: 'center' }}>
      <Text style={{ color: colors.gray[500], fontSize: 14 }}>{message}</Text>
    </View>
  );
}
