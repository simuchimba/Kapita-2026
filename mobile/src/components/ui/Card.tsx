import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '../../constants/theme';

export default function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing.md,
    ...shadow.card,
  },
});
