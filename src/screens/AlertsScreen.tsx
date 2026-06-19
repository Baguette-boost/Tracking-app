// 알림 화면 (골격) — design/design-spec.md §4.2
// 시간 역순 알림 리스트 + 상단 필터(전체/미확인). 미확인은 좌측 강조 바 + 배경 틴트.

import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { alerts, people } from '../data/mock';
import { colors, radius, screenPadding } from '../theme/tokens';
import { AlertType } from '../types';
import { fromNow } from '../utils/relativeTime';

const typeMeta: Record<AlertType, { icon: keyof typeof Feather.glyphMap; color: string; label: string }> = {
  zone_exit: { icon: 'log-out', color: colors.danger, label: '안전구역 이탈' },
  low_battery: { icon: 'battery', color: '#E2A100', label: '배터리 부족' },
  abnormal_hr: { icon: 'heart', color: colors.danger, label: '심박 이상' },
  offline: { icon: 'wifi-off', color: colors.textSecondary, label: '오프라인' },
};

type Filter = 'all' | 'unread';

export default function AlertsScreen() {
  const [filter, setFilter] = useState<Filter>('all');

  const sorted = useMemo(
    () =>
      [...alerts]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .filter((a) => (filter === 'unread' ? !a.read : true)),
    [filter]
  );

  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? '알 수 없음';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>알림</Text>
        <View style={styles.filters}>
          <FilterChip label="전체" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip label="미확인" active={filter === 'unread'} onPress={() => setFilter('unread')} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {sorted.length === 0 && <Text style={styles.empty}>표시할 알림이 없습니다.</Text>}
        {sorted.map((a) => {
          const meta = typeMeta[a.type];
          return (
            <View key={a.id} style={[styles.item, !a.read && styles.itemUnread]}>
              {!a.read && <View style={styles.unreadBar} />}
              <View style={[styles.iconWrap, { backgroundColor: meta.color + '1A' }]}>
                <Feather name={meta.icon} size={18} color={meta.color} />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{meta.label}</Text>
                <Text style={styles.itemMsg} numberOfLines={1}>
                  {nameOf(a.personId)} · {a.message}
                </Text>
              </View>
              <Text style={styles.time}>{fromNow(a.createdAt)}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
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
  filters: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#FFFFFF' },
  body: { backgroundColor: colors.bg, padding: screenPadding, flexGrow: 1 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemUnread: { backgroundColor: '#F5FAFE' },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  itemMsg: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  time: { fontSize: 12, color: colors.textSecondary },
});
