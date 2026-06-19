// 상태 배지 (pill) — 안전→safeBg/safe, 경보→dangerBg/dangerText, 오프라인→border/secondary
// 색상만으로 구분 금지 → 텍스트 병기. design/design-spec.md §3.5, §6.4

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/tokens';
import { SafetyStatus } from '../types';

interface Props {
  status: SafetyStatus;
}

const config: Record<SafetyStatus, { bg: string; fg: string; label: string }> = {
  safe: { bg: colors.safeBg, fg: colors.safe, label: '안전' },
  alert: { bg: colors.dangerBg, fg: colors.dangerText, label: '경보' },
  offline: { bg: colors.border, fg: colors.textSecondary, label: '오프라인' },
};

export default function StatusBadge({ status }: Props) {
  const c = config[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
