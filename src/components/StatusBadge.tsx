// 상태 배지 (pill) — 색상만으로 구분 금지 → 아이콘 + 텍스트 병기.
// 낙상·배회가 "동시에" 발생할 수 있으므로 활성 상태를 모두 표시한다
// (예전엔 낙상 우선 1개만 표시해서 배회가 숨겨졌음).

import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/tokens';
import { SafetyStatus } from '../types';

export type Look = {
  bg: string;
  fg: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

// 배회 = 주황, 낙상 = 빨강, 정상 = 초록
// WANDER_FG: wanderBg 배지 대비 4.52:1 (WCAG 2.1 AA · 기존 #C77A17는 3.01 ✗)
const WANDER_BG = '#FDF0DF';
const WANDER_FG = '#A25E0C';

export const FALL_LOOK: Look = {
  bg: colors.dangerBg,
  fg: colors.dangerText,
  label: 'Fall',
  icon: 'alert-triangle',
};
export const WANDER_LOOK: Look = {
  bg: WANDER_BG,
  fg: WANDER_FG,
  label: 'Wandering',
  icon: 'navigation',
};
const IDLE_LOOK: Look = {
  bg: colors.safeBg,
  fg: colors.safe,
  label: 'Idle',
  icon: 'check-circle',
};
const OFFLINE_LOOK: Look = {
  bg: colors.border,
  fg: colors.textSecondary,
  label: 'Offline',
  icon: 'wifi-off',
};
const SAFE_LOOK: Look = { bg: colors.safeBg, fg: colors.safe, label: 'Safe', icon: 'check-circle' };
const ALERT_LOOK: Look = {
  bg: colors.dangerBg,
  fg: colors.dangerText,
  label: 'Alert',
  icon: 'alert-circle',
};

// 활성 상태를 전부 반환 — 낙상 + 배회 동시면 2개.
export function statusLooks(
  status: SafetyStatus,
  flags?: { isFall: boolean; isWandering: boolean }
): Look[] {
  if (status === 'offline') return [OFFLINE_LOOK];
  if (flags) {
    const out: Look[] = [];
    if (flags.isFall) out.push(FALL_LOOK);
    if (flags.isWandering) out.push(WANDER_LOOK);
    return out.length ? out : [IDLE_LOOK];
  }
  // flags 미제공(목록만 조회된 상태) -> status 기반 폴백
  return [status === 'alert' ? ALERT_LOOK : SAFE_LOOK];
}

interface Props {
  status: SafetyStatus;
  flags?: { isFall: boolean; isWandering: boolean };
}

export default function StatusBadge({ status, flags }: Props) {
  const looks = statusLooks(status, flags);
  return (
    <View style={styles.wrap}>
      {looks.map((c) => (
        <View key={c.label} style={[styles.badge, { backgroundColor: c.bg }]}>
          <Feather name={c.icon} size={13} color={c.fg} />
          <Text style={[styles.text, { color: c.fg }]}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-end', gap: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  text: { fontSize: 13, fontWeight: '600' },
});
