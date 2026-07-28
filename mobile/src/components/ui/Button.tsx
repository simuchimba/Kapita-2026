import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'outline';
type Size = 'md' | 'sm';

interface Props extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export default function Button({ title, variant = 'primary', size = 'md', loading, disabled, style, ...props }: Props) {
  return (
    <TouchableOpacity
      style={[styles.base, sizeStyles[size], variantStyles[variant], (disabled || loading) && styles.disabled, style]}
      disabled={disabled || loading}
      activeOpacity={0.85}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'secondary' ? colors.primary[600] : colors.white} />
      ) : (
        <Text style={[styles.text, variantTextStyles[variant]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  disabled: { opacity: 0.6 },
  text: { fontSize: 15, fontWeight: '600' },
});

const sizeStyles = StyleSheet.create({
  md: { paddingVertical: 13, paddingHorizontal: spacing.lg },
  sm: { paddingVertical: 8, paddingHorizontal: spacing.md },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary[600] },
  secondary: { backgroundColor: colors.gray[100] },
  danger: { backgroundColor: colors.danger },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.gray[300] },
});

const variantTextStyles = StyleSheet.create({
  primary: { color: colors.white },
  secondary: { color: colors.gray[700] },
  danger: { color: colors.white },
  outline: { color: colors.gray[700] },
});
