// 아바타 — 원형, avatarBlue 배경, 이름 첫 글자 흰색. 우하단 상태 점.
// design/design-spec.md §3.5

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/tokens';
import { SafetyStatus } from '../types';

interface Props {
  initial: string;
  status: SafetyStatus;
  size?: number;
}

const statusColor: Record<SafetyStatus, string> = {
  safe: colors.safe,
  alert: colors.danger,
  offline: colors.textSecondary,
};

export default function Avatar({ initial, status, size = 52 }: Props) {
  const dot = Math.round(size * 0.27);
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
      </View>
      <View
        style={[
          styles.dot,
          {
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: statusColor[status],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.avatarBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
