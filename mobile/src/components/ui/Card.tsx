import React from 'react';
import { View, ViewProps } from 'react-native';
import { radius, shadow, spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

export default function Card({ style, ...props }: ViewProps) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          ...shadow.card,
        },
        style,
      ]}
      {...props}
    />
  );
}
