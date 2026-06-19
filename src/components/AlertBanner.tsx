// 경보 배너 (조건부) — design/design-spec.md §3.3
// 활성 경보 1건 이상일 때만 노출. 전체 탭 → AlertsScreen 이동.

import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/tokens';

interface Props {
  count: number;
  names: string[]; // 경보 대상자 이름
  onPress: () => void;
}

export default function AlertBanner({ count, names, onPress }: Props) {
  if (count < 1) return null;
  const summary = `${names.join(' · ')} — 즉시 확인 필요`;
  return (
    <Pressable
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`경보 ${count}건 발생. ${summary}`}
    >
      <View style={styles.bicon}>
        <Feather name="alert-triangle" size={24} color="#FFFFFF" />
      </View>
      <View style={styles.btxt}>
        <Text style={styles.bt1}>경보 {count}건 발생</Text>
        <Text style={styles.bt2} numberOfLines={1}>
          {summary}
        </Text>
      </View>
      <Feather name="chevron-right" size={22} color={colors.dangerText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  pressed: { opacity: 0.85 },
  bicon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btxt: { flex: 1 },
  bt1: { fontSize: 16, fontWeight: '700', color: colors.dangerText },
  bt2: { fontSize: 13, color: colors.dangerText, opacity: 0.9, marginTop: 3 },
});
