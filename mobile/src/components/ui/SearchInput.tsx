import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, radius, spacing } from '../../constants/theme';

export default function SearchInput(props: TextInputProps) {
  return (
    <View style={styles.wrap}>
      <Search size={16} color={colors.gray[400]} style={styles.icon} />
      <TextInput
        placeholderTextColor={colors.gray[400]}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  icon: { marginRight: spacing.xs },
  input: { flex: 1, paddingVertical: 10, fontSize: 14, color: colors.gray[900] },
});
