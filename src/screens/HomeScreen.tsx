// 홈 화면 — design/design-spec.md §3 (핵심, 픽셀 단위)
// 데이터는 api.* 로 로드(백엔드 미연결 시 목업 어댑터). 당겨서 새로고침 지원.

import { Feather } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AlertBanner from '../components/AlertBanner';
import EmptyState from '../components/EmptyState';
import PersonCard from '../components/PersonCard';
import SummaryCard from '../components/SummaryCard';
import { ErrorView, LoadingView } from '../components/StateView';
import { useGuardian, usePersons } from '../hooks';
import { refreshUnread, useUnread } from '../state/unread';
import { RootTabParamList } from '../navigation/types';
import { colors, screenPadding } from '../theme/tokens';
import { TrackedPerson } from '../types';

type Props = BottomTabScreenProps<RootTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const guardian = useGuardian();
  const persons = usePersons();
  const unreadCount = useUnread();

  // 탭으로 돌아올 때 목록·미확인 수 갱신 (등록/삭제 반영)
  useFocusEffect(
    useCallback(() => {
      refreshUnread();
      persons.refetch();
    }, [persons.refetch])
  );

  // 당겨서 새로고침 — loading 과 분리(포커스 refetch 로 스피너 여백이 생기지 않도록).
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    persons.refetch().finally(() => setRefreshing(false));
  }, [persons.refetch]);

  const people = persons.data ?? [];
  const summary = {
    totalCount: people.length,
    safeCount: people.filter((p) => p.status === 'safe').length,
    alertCount: people.filter((p) => p.status === 'alert').length,
  };
  const alertNames = people.filter((p) => p.status === 'alert').map((p) => p.name);

  const handleLocate = (person: TrackedPerson) => {
    navigation.navigate('Map', { focusPersonId: person.id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 3.1 헤더 (고정) */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greet}>Hello,</Text>
          <Text style={styles.name}>{guardian.data?.name ?? 'Guardian'}</Text>
        </View>
        <Pressable
          style={styles.bell}
          onPress={() => navigation.navigate('Alerts')}
          accessibilityRole="button"
          accessibilityLabel="View alerts"
        >
          <Feather name="bell" size={22} color={colors.textPrimary} />
          {unreadCount > 0 && <View style={styles.bellDot} />}
        </Pressable>
      </View>

      {persons.loading && !persons.data ? (
        <LoadingView />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.body}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* 3.2 요약 카드 3개 */}
          <View style={styles.summary}>
            <SummaryCard
              icon="shield"
              iconColor={colors.primary}
              bg={colors.infoBg}
              value={`${summary.totalCount}`}
              label="Tracked People"
            />
            <SummaryCard
              icon="target"
              iconColor={colors.safe}
              bg={colors.safeBg}
              value={`${summary.safeCount}`}
              label="Safe"
            />
            <SummaryCard
              icon="alert-triangle"
              iconColor={colors.danger}
              bg={colors.dangerBg}
              value={`${summary.alertCount}`}
              label="Active Alerts"
            />
          </View>

          {/* 3.3 경보 배너 (조건부) */}
          <AlertBanner
            count={summary.alertCount}
            names={alertNames}
            onPress={() => navigation.navigate('Alerts')}
          />

          {/* 3.4 섹션 헤더 */}
          <View style={styles.sechead}>
            <Text style={styles.sectitle}>Tracked Family</Text>
            <Pressable onPress={() => navigation.navigate('Map')} accessibilityRole="button">
              <Text style={styles.seclink}>View Map →</Text>
            </Pressable>
          </View>

          {/* 3.5 가족 카드 리스트 (없으면 빈 상태) */}
          {people.length === 0 ? (
            <EmptyState
              title="No one is registered yet"
              subtitle={
                persons.error
                  ? `Failed to load — ${persons.error.message}`
                  : 'Add someone in Profile → Manage Tracked People.'
              }
            />
          ) : (
            people.map((person) => (
              <PersonCard key={person.id} person={person} onLocate={handleLocate} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: screenPadding,
    paddingTop: 0,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greet: { fontSize: 13, color: colors.textSecondary },
  name: { fontSize: 21, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  bell: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  scroll: { flex: 1, backgroundColor: colors.bg },
  body: {
    backgroundColor: colors.bg,
    paddingHorizontal: screenPadding,
    paddingTop: 18,
    paddingBottom: 24,
    flexGrow: 1,
  },
  summary: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  sechead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  seclink: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  empty: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginTop: 4 },
  emptySub: { fontSize: 13, color: colors.textSecondary },
});

