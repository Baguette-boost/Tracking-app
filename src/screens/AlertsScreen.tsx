// 알림 화면 — design/design-spec.md §4.2
// 기본은 '미확인' 인박스: 알림을 읽으면(탭) 즉시 목록에서 사라지고 배지도 감소.
// '전체' 필터로 읽은 알림(이력)까지 확인 가능.

import { Feather } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
import { RootTabParamList } from '../navigation/types';
import { AlertItem, AlertType } from '../types';
import { fromNow } from '../utils/relativeTime';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const typeMeta: Record<AlertType, { icon: keyof typeof Feather.glyphMap; color: string; label: string }> = {
  wandering: { icon: 'navigation', color: '#F2A03D', label: 'Wandering Detected' },
  fall_detected: { icon: 'alert-triangle', color: colors.danger, label: 'Fall Detected' },
  zone_exit: { icon: 'log-out', color: colors.danger, label: 'Left Safe Zone' },
  low_battery: { icon: 'battery', color: '#E2A100', label: 'Low Battery' },
  abnormal_hr: { icon: 'heart', color: colors.danger, label: 'Abnormal Heart Rate' },
  offline: { icon: 'wifi-off', color: colors.textSecondary, label: 'Offline' },
};

type Filter = 'unread' | 'all';

export default function AlertsScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
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

  // 당겨서 새로고침 — loading 과 분리(포커스 refetch 스피너 여백 방지).
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    alerts.refetch().finally(() => setRefreshing(false));
  }, [alerts.refetch]);

  const nameOf = (id: string) =>
    persons.data?.find((p) => p.id === id)?.name ?? 'Unknown';

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  // 알림 탭 → 읽음 처리 후 지도로 이동(해당 인물 포커스, callout 자동 열림).
  const handleOpen = (alert: AlertItem) => {
    if (!alert.read) {
      unreadStore.decrement(1);
      api.alerts.markRead(alert.id).catch(() => {}).then(refreshUnread);
    }
    navigation.navigate('Map', { focusPersonId: alert.personId });
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
          <Text style={styles.title}>Alerts</Text>
          {filter === 'unread' && items.length > 0 && (
            <Pressable onPress={handleReadAll} accessibilityRole="button">
              <Text style={styles.readAll}>Mark all read</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.filters}>
          <FilterChip label="Unread" active={filter === 'unread'} onPress={() => setFilter('unread')} />
          <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        </View>
      </View>

      {alerts.loading && !alerts.data ? (
        <LoadingView />
      ) : alerts.error ? (
        <ErrorView
          message={`Could not load data.\n${alerts.error.message}`}
          onRetry={alerts.refetch}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.body}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {items.length === 0 && (
            <View style={styles.emptyWrap}>
              <Feather name="check-circle" size={36} color={colors.safe} />
              <Text style={styles.empty}>
                {filter === 'unread' ? "You're all caught up." : 'No alerts yet.'}
              </Text>
            </View>
          )}
          {items.map((a) => {
            const meta = typeMeta[a.type];
            return (
              <Pressable
                key={a.id}
                style={[styles.item, !a.read && styles.itemUnread]}
                onPress={() => handleOpen(a)}
                accessibilityRole="button"
                accessibilityLabel={`${meta.label} alert, tap to view on map`}
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
    paddingTop: 0,
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
  scroll: { flex: 1, backgroundColor: colors.bg },
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
