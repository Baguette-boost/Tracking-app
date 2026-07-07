// 로딩 / 에러 공통 상태 뷰 — api 호출 화면에서 재사용.

import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/tokens';

export function LoadingView({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function ErrorView({
  message = '데이터를 불러오지 못했습니다.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Feather name="alert-circle" size={32} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.retry} onPress={onRetry} accessibilityRole="button">
          <Feather name="refresh-cw" size={16} color="#FFFFFF" />
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: colors.bg,
  },
  text: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
