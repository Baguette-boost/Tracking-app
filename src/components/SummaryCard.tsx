// 요약 카드 — design/design-spec.md §3.2
// 세로 정렬: 좌상단 아이콘 → 큰 숫자(display) → 라벨(label, secondary)

import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../theme/tokens';

interface Props {
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  bg: string;
  value: string;
  label: string;
}

export default function SummaryCard({ icon, iconColor, bg, value, label }: Props) {
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <Feather name={icon} size={22} color={iconColor} style={styles.icon} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.summary,
    padding: 16,
  },
  icon: {
    marginBottom: 14,
  },
  value: {
    ...typography.display,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  label: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 6,
  },
});
