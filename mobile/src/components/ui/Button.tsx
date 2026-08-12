import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { radius, spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

type Variant = 'primary' | 'secondary' | 'danger' | 'outline';
type Size = 'md' | 'sm';

interface Props extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export default function Button({ title, variant = 'primary', size = 'md', loading, disabled, style, ...props }: Props) {
  const { colors } = useAppTheme();

  const sizeStyle = size === 'md' ? { paddingVertical: 13, paddingHorizontal: spacing.lg } : { paddingVertical: 8, paddingHorizontal: spacing.md };
  const variantStyle = {
    primary: { backgroundColor: colors.primary[600] },
    secondary: { backgroundColor: colors.gray[100] },
    danger: { backgroundColor: colors.danger },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.gray[300] },
  }[variant];
  const textColor = {
    primary: colors.white,
    secondary: colors.gray[700],
    danger: colors.white,
    outline: colors.gray[700],
  }[variant];

  return (
    <TouchableOpacity
      style={[
        { borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.xs },
        sizeStyle,
        variantStyle,
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.85}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'secondary' ? colors.primary[600] : colors.white} />
      ) : (
        <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
