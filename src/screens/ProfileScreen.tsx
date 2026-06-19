// 내정보 화면 (골격) — design/design-spec.md §4.3
// 보호자 프로필 헤더 + 메뉴 리스트(각 항목 우측 chevron).

import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { guardian } from '../data/mock';
import { colors, radius, screenPadding, shadow } from '../theme/tokens';

const menu: { icon: keyof typeof Feather.glyphMap; label: string; danger?: boolean }[] = [
  { icon: 'users', label: '추적 대상 관리' },
  { icon: 'shield', label: '안전구역 설정' },
  { icon: 'bell', label: '알림 설정' },
  { icon: 'lock', label: '계정/보안' },
  { icon: 'log-out', label: '로그아웃', danger: true },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>내정보</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* 프로필 헤더 */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{guardian.name[0]}</Text>
          </View>
          <View>
            <Text style={styles.name}>{guardian.name} 님</Text>
            <Text style={styles.phone}>{formatPhone(guardian.phone)}</Text>
          </View>
        </View>

        {/* 메뉴 리스트 */}
        <View style={styles.menu}>
          {menu.map((m, i) => (
            <Pressable
              key={m.label}
              style={[styles.menuItem, i < menu.length - 1 && styles.menuDivider]}
              accessibilityRole="button"
            >
              <Feather
                name={m.icon}
                size={19}
                color={m.danger ? colors.danger : colors.textPrimary}
              />
              <Text style={[styles.menuLabel, m.danger && styles.menuDanger]}>{m.label}</Text>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
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
  menuLabel: { flex: 1, fontSize: 15, color: colors.textPrimary },
  menuDanger: { color: colors.danger },
});
