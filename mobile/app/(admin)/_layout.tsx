import { Drawer } from 'expo-router/drawer';
import { Redirect, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import {
  Activity,
  BadgeCheck,
  LayoutDashboard,
  LogOut,
  MessageSquarePlus,
  Package,
  Truck,
  UploadCloud,
  Users,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { colors, radius, spacing } from '../../src/constants/theme';

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.brand}>
        <View style={styles.logoMark}>
          <Text style={styles.logoMarkText}>K</Text>
        </View>
        <View>
          <Text style={styles.brandTitle}>Kapita Admin</Text>
          <Text style={styles.brandSubtitle}>Control panel</Text>
        </View>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <View style={styles.userChip}>
          <Text style={styles.userName}>{user?.business_name || 'Admin'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            logout();
            router.replace('/admin/login');
          }}
        >
          <LogOut size={16} color={colors.gray[700]} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminDrawerLayout() {
  const { isStaff } = useAuth();

  if (!isStaff) {
    return <Redirect href="/admin/login" />;
  }

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerTintColor: colors.gray[900],
        headerStyle: { backgroundColor: colors.white },
        drawerActiveBackgroundColor: colors.primary[50],
        drawerActiveTintColor: colors.primary[700],
        drawerInactiveTintColor: colors.gray[600],
        drawerLabelStyle: { fontSize: 14, fontWeight: '500', marginLeft: -8 },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{ title: 'Overview', drawerIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} /> }}
      />
      <Drawer.Screen
        name="users"
        options={{ title: 'Users', drawerIcon: ({ color, size }) => <Users size={size} color={color} /> }}
      />
      <Drawer.Screen
        name="payments"
        options={{ title: 'Payments', drawerIcon: ({ color, size }) => <UploadCloud size={size} color={color} /> }}
      />
      <Drawer.Screen
        name="subscriptions"
        options={{ title: 'Subscriptions', drawerIcon: ({ color, size }) => <BadgeCheck size={size} color={color} /> }}
      />
      <Drawer.Screen
        name="purchase-orders"
        options={{ title: 'Purchase Orders', drawerIcon: ({ color, size }) => <Package size={size} color={color} /> }}
      />
      <Drawer.Screen
        name="suppliers"
        options={{ title: 'Suppliers', drawerIcon: ({ color, size }) => <Truck size={size} color={color} /> }}
      />
      <Drawer.Screen
        name="feedback"
        options={{ title: 'Feedback', drawerIcon: ({ color, size }) => <MessageSquarePlus size={size} color={color} /> }}
      />
      <Drawer.Screen
        name="activity"
        options={{ title: 'Activity', drawerIcon: ({ color, size }) => <Activity size={size} color={color} /> }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  brandTitle: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  brandSubtitle: { fontSize: 12, color: colors.gray[500] },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    padding: spacing.md,
  },
  userChip: {
    backgroundColor: colors.gray[50],
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  userName: { fontSize: 13, fontWeight: '600', color: colors.gray[900] },
  userEmail: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.gray[100],
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: colors.gray[700] },
});
