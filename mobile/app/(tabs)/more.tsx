import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowRightCircle, BadgeDollarSign, Banknote, Boxes, ChevronRight,
  Cloud, CreditCard, FileSpreadsheet, FileText, LineChart, MessageSquare,
  PackageOpen, Receipt, Settings as SettingsIcon, Sparkles, Tag,
  TrendingDown, TrendingUp, User, UserPlus, Wallet,
} from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

interface Item { name: string; href: string; icon: any; }
interface Section { title: string; items: Item[]; }

const SECTIONS: Section[] = [
  {
    title: 'Sales & Inventory',
    items: [
      { name: 'Invoices', href: '/(tabs)/invoices', icon: FileSpreadsheet },
      { name: 'Quotations', href: '/(tabs)/quotations', icon: FileText },
      { name: 'Promotions', href: '/(tabs)/promotions', icon: Tag },
      { name: 'Suppliers', href: '/(tabs)/suppliers', icon: UserPlus },
      { name: 'Purchase Orders', href: '/(tabs)/purchase-orders', icon: PackageOpen },
    ],
  },
  {
    title: 'Money',
    items: [
      { name: 'Credits', href: '/(tabs)/credits', icon: CreditCard },
      { name: 'Expenses', href: '/(tabs)/expenses', icon: Receipt },
      { name: 'Reinvestments', href: '/(tabs)/reinvestments', icon: TrendingUp },
      { name: 'Outgoing Payments', href: '/(tabs)/outgoing-payments', icon: ArrowRightCircle },
      { name: 'Personal Finance', href: '/(tabs)/personal-finance', icon: Wallet },
      { name: 'Currencies', href: '/(tabs)/currencies', icon: BadgeDollarSign },
    ],
  },
  {
    title: 'Reports & Insights',
    items: [
      { name: 'Reports', href: '/(tabs)/reports', icon: Boxes },
      { name: 'Cash Flow Statement', href: '/(tabs)/cash-flow', icon: TrendingDown },
      { name: 'Projections', href: '/(tabs)/projections', icon: LineChart },
      { name: 'Ask Mumu (AI)', href: '/(tabs)/chat', icon: Sparkles },
    ],
  },
  {
    title: 'Account',
    items: [
      { name: 'Billing & Subscription', href: '/(tabs)/billing', icon: Banknote },
      { name: 'Backup & Restore', href: '/(tabs)/backup', icon: Cloud },
      { name: 'Settings', href: '/(tabs)/settings', icon: SettingsIcon },
      { name: 'Profile', href: '/(tabs)/profile', icon: User },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.title}>More</Text>
        <Text style={typography.subtitle}>Everything else in Kapita</Text>
      </View>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.href}
                  style={[styles.row, i < section.items.length - 1 && styles.rowDivider]}
                  onPress={() => router.push(item.href as any)}
                >
                  <View style={styles.iconWrap}>
                    <Icon size={16} color={colors.primary[600]} />
                  </View>
                  <Text style={styles.rowText}>{item.name}</Text>
                  <ChevronRight size={16} color={colors.gray[300]} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: { padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  section: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray[200], overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  iconWrap: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.gray[900] },
});
