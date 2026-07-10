// 상태 배지 (pill) — 안전→safeBg/safe, 경보→dangerBg/dangerText, 오프라인→border/secondary
// 색상만으로 구분 금지 → 텍스트 병기. design/design-spec.md §3.5, §6.4

import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/tokens';
import { SafetyStatus } from '../types';

interface Props {
  status: SafetyStatus;
  // 있으면 상태 대신 배회/낙상/정상(Idle)로 표시.
  flags?: { isFall: boolean; isWandering: boolean };
}

type Look = { bg: string; fg: string; label: string; icon: keyof typeof Feather.glyphMap };

const config: Record<SafetyStatus, Look> = {
  safe: { bg: colors.safeBg, fg: colors.safe, label: 'Safe', icon: 'check-circle' },
  alert: { bg: colors.dangerBg, fg: colors.dangerText, label: 'Alert', icon: 'alert-circle' },
  offline: { bg: colors.border, fg: colors.textSecondary, label: 'Offline', icon: 'wifi-off' },
};

// 배회 배지 색 (주황). 낙상=danger, 정상(Idle)=safe.
const WANDER_BG = '#FDF0DF';
const WANDER_FG = '#C77A17';

export function badgeLook(status: SafetyStatus, flags?: { isFall: boolean; isWandering: boolean }): Look {
  if (status === 'offline') return config.offline;
  if (flags) {
    if (flags.isFall)
      return { bg: colors.dangerBg, fg: colors.dangerText, label: 'Fall', icon: 'alert-triangle' };
    if (flags.isWandering)
      return { bg: WANDER_BG, fg: WANDER_FG, label: 'Wandering', icon: 'navigation' };
    return { bg: colors.safeBg, fg: colors.safe, label: 'Idle', icon: 'check-circle' };
  }
  return config[status];
}

export default function StatusBadge({ status, flags }: Props) {
  const c = badgeLook(status, flags);
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Feather name={c.icon} size={13} color={c.fg} />
      <Text style={[styles.text, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
