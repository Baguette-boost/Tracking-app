// 내정보 화면 (골격) — design/design-spec.md §4.3
// 보호자 프로필 헤더 + 메뉴 리스트(각 항목 우측 chevron).

import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useContext } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGuardian } from '../hooks';
import { RootStackParamList } from '../navigation/types';
import { AuthContext } from '../state/auth';
import { colors, radius, screenPadding, shadow } from '../theme/tokens';

type MenuItem = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  danger?: boolean;
  route?: keyof RootStackParamList;
  disabled?: boolean; // 아직 미구현 -> 회색 비활성
  action?: 'logout';
};

const menu: MenuItem[] = [
  { icon: 'users', label: 'Manage Tracked People', route: 'PersonsManage' },
  { icon: 'shield', label: 'Safe Zone Settings', disabled: true },
  { icon: 'bell', label: 'Notification Settings', disabled: true },
  { icon: 'lock', label: 'Account & Security', disabled: true },
  { icon: 'log-out', label: 'Log Out', danger: true, action: 'logout' },
];

export default function ProfileScreen() {
  const { data: guardian } = useGuardian();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout } = useContext(AuthContext);

  const onPressItem = (m: MenuItem) => {
    if (m.disabled) return;
    if (m.action === 'logout') {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]);
      return;
    }
    if (m.route) navigation.navigate(m.route);
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* 프로필 헤더 */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{guardian?.name?.[0] ?? '-'}</Text>
          </View>
          <View>
            <Text style={styles.name}>{guardian?.name ?? 'Guardian'}</Text>
            <Text style={styles.phone}>{guardian ? formatPhone(guardian.phone) : ''}</Text>
          </View>
        </View>

        {/* 메뉴 리스트 */}
        <View style={styles.menu}>
          {menu.map((m, i) => (
            <Pressable
              key={m.label}
              style={[
                styles.menuItem,
                i < menu.length - 1 && styles.menuDivider,
                m.disabled && styles.menuItemDisabled,
              ]}
              accessibilityRole="button"
              disabled={m.disabled}
              onPress={() => onPressItem(m)}
            >
              <Feather
                name={m.icon}
                size={19}
                color={
                  m.disabled
                    ? colors.textSecondary
                    : m.danger
                    ? colors.danger
                    : colors.textPrimary
                }
              />
              <Text
                style={[
                  styles.menuLabel,
                  m.danger && styles.menuDanger,
                  m.disabled && styles.menuLabelDisabled,
                ]}
              >
                {m.label}
              </Text>
              {m.disabled ? (
                <Text style={styles.soon}>Coming soon</Text>
              ) : m.action === 'logout' ? null : (
                <Feather name="chevron-right" size={20} color={colors.textSecondary} />
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatPhone(p: string): string {
  // 01012345678 → 010-1234-5678
  if (p.length === 11) return `${p.slice(0, 3)}-${p.slice(3, 7)}-${p.slice(7)}`;
  return p;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: screenPadding,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 21, fontWeight: '700', color: colors.textPrimary },
  body: { backgroundColor: colors.bg, padding: screenPadding, flexGrow: 1 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 18,
    marginBottom: 20,
    ...shadow,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.avatarBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  phone: { fontSize: 14, color: colors.textSecondary, marginTop: 3 },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    ...shadow,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuItemDisabled: { opacity: 0.5 },
  menuLabel: { flex: 1, fontSize: 15, color: colors.textPrimary },
  menuLabelDisabled: { color: colors.textSecondary },
  menuDanger: { color: colors.danger },
  soon: { fontSize: 12, color: colors.textSecondary },
});
