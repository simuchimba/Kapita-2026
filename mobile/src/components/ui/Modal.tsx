import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { radius, spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

export default function Modal({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <RNModal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable
          style={{ backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '85%' }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 }} numberOfLines={1}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: spacing.xs }}>
              <X size={18} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
