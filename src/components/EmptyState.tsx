// 빈 상태 공통 뷰 — 뒤에 로고 워터마크(투명)를 깔아 허전하지 않게.
// 등록된 대상이 없을 때 등 목록이 비었을 때 사용.

import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/tokens';

export default function EmptyState({
  title = '아직 등록되지 않았어요',
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Image
        source={require('../../assets/logo-mark.png')}
        style={styles.mark}
        resizeMode="contain"
      />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  // 로고 워터마크 (뒤에 은은하게)
  mark: {
    position: 'absolute',
    width: 200,
    height: 200,
    opacity: 0.12,
  },
  textWrap: { alignItems: 'center', gap: 6, marginTop: 120 },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});
