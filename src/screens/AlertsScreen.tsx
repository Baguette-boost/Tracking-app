// 알림 화면 — design/design-spec.md §4.2
// 기본은 '미확인' 인박스: 알림을 읽으면(탭) 즉시 목록에서 사라지고 배지도 감소.
// '전체' 필터로 읽은 알림(이력)까지 확인 가능.

import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api';
import { ErrorView, LoadingView } from '../components/StateView';
import { usePersons } from '../hooks';
import { useAlerts } from '../hooks';
import { refreshUnread, unreadStore } from '../state/unread';
import { colors, radius, screenPadding } from '../theme/tokens';
import { AlertItem, AlertType } from '../types';
import { fromNow } from '../utils/relativeTime';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const typeMeta: Record<AlertType, { icon: keyof typeof Feather.glyphMap; color: string; label: string }> = {
  zone_exit: { icon: 'log-out', color: colors.danger, label: '안전구역 이탈' },
  low_battery: { icon: 'battery', color: '#E2A100', label: '배터리 부족' },
  abnormal_hr: { icon: 'heart', color: colors.danger, label: '심박 이상' },
  offline: { icon: 'wifi-off', color: colors.textSecondary, label: '오프라인' },
};

type Filter = 'unread' | 'all';

export default function AlertsScreen() {
  const [filter, setFilter] = useState<Filter>('unread');
  const alerts = useAlerts(filter);
  const persons = usePersons();

  // 표시용 로컬 목록 — 읽음 처리 시 즉시 제거(낙관적 업데이트)
  const [items, setItems] = useState<AlertItem[]>([]);
  useEffect(() => {
    setItems(alerts.data ?? []);
  }, [alerts.data]);

  useFocusEffect(
    useCallback(() => {
      alerts.refetch();
      refreshUnread();
    }, [alerts.refetch])
  );

  const nameOf = (id: string) =>
    persons.data?.find((p) => p.id === id)?.name ?? '알 수 없음';

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const handleRead = async (alert: AlertItem) => {
    if (alert.read && filter === 'all') return; // 이미 읽은 이력 항목은 그대로
    animate();
    setItems((prev) => prev.filter((a) => a.id !== alert.id)); // 즉시 사라짐
    if (!alert.read) unreadStore.decrement(1); // 배지 즉시 감소
    await api.alerts.markRead(alert.id).catch(() => {});
    refreshUnread();
  };

  const handleReadAll = async () => {
    if (items.length === 0) return;
    animate();
    setItems([]);
    unreadStore.set(0);
    await api.alerts.markAllRead().catch(() => {});
    refreshUnread();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>알림</Text>
          {filter === 'unread' && items.length > 0 && (
            <Pressable onPress={handleReadAll} accessibilityRole="button">
              <Text style={styles.readAll}>모두 읽음</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.filters}>
          <FilterChip label="미확인" active={filter === 'unread'} onPress={() => setFilter('unread')} />
          <FilterChip label="전체" active={filter === 'all'} onPress={() => setFilter('all')} />
        </View>
      </View>

      {alerts.loading && !alerts.data ? (
        <LoadingView />
      ) : alerts.error ? (
        <ErrorView
          message={`데이터를 불러오지 못했습니다.\n${alerts.error.message}`}
          onRetry={alerts.refetch}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={alerts.loading} onRefresh={alerts.refetch} />
          }
        >
          {items.length === 0 && (
            <View style={styles.emptyWrap}>
              <Feather name="check-circle" size={36} color={colors.safe} />
              <Text style={styles.empty}>
                {filter === 'unread' ? '확인하지 않은 알림이 없습니다.' : '알림이 없습니다.'}
              </Text>
            </View>
          )}
          {items.map((a) => {
            const meta = typeMeta[a.type];
            return (
              <Pressable
                key={a.id}
                style={[styles.item, !a.read && styles.itemUnread]}
                onPress={() => handleRead(a)}
                accessibilityRole="button"
                accessibilityLabel={`${meta.label} 알림, 탭하면 확인 처리`}
              >
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
              </Pressable>
            );
          })}
        </ScrollView>
      )}
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
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 21, fontWeight: '700', color: colors.textPrimary },
  readAll: { fontSize: 14, color: colors.primary, fontWeight: '600' },
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
  emptyWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 10 },
  empty: { textAlign: 'center', color: colors.textSecondary },
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
