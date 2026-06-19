// 홈 화면 — design/design-spec.md §3 (핵심, 픽셀 단위)
// 고정 헤더 → 요약 카드 3 → 경보 배너(조건부) → 섹션 헤더 → 가족 카드 리스트

import { Feather } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AlertBanner from '../components/AlertBanner';
import PersonCard from '../components/PersonCard';
import SummaryCard from '../components/SummaryCard';
import { guardian, people, personPhones, summary, unreadAlertCount } from '../data/mock';
import { RootTabParamList } from '../navigation/types';
import { colors, screenPadding } from '../theme/tokens';
import { TrackedPerson } from '../types';

type Props = BottomTabScreenProps<RootTabParamList, '홈'>;

export default function HomeScreen({ navigation }: Props) {
  const alertNames = people.filter((p) => p.status === 'alert').map((p) => p.name);

  const handleCall = (person: TrackedPerson) => {
    const phone = personPhones[person.id];
    if (!phone) {
      Alert.alert('연락처 없음', `${person.name}의 등록된 연락처가 없습니다.`);
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('전화 연결 실패', '이 기기에서 전화를 걸 수 없습니다.')
    );
  };

  const handleLocate = (person: TrackedPerson) => {
    navigation.navigate('지도', { focusPersonId: person.id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 3.1 헤더 (고정) */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greet}>안녕하세요,</Text>
          <Text style={styles.name}>{guardian.name} 님 👋</Text>
        </View>
        <Pressable
          style={styles.bell}
          onPress={() => navigation.navigate('알림')}
          accessibilityRole="button"
          accessibilityLabel="알림 보기"
        >
          <Feather name="bell" size={22} color={colors.textPrimary} />
          {unreadAlertCount > 0 && <View style={styles.bellDot} />}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* 3.2 요약 카드 3개 */}
        <View style={styles.summary}>
          <SummaryCard
            icon="shield"
            iconColor={colors.primary}
            bg={colors.infoBg}
            value={`${summary.totalCount}명`}
            label="총 추적 인원"
          />
          <SummaryCard
            icon="target"
            iconColor={colors.safe}
            bg={colors.safeBg}
            value={`${summary.safeCount}명`}
            label="안전 상태"
          />
          <SummaryCard
            icon="alert-triangle"
            iconColor={colors.danger}
            bg={colors.dangerBg}
            value={`${summary.alertCount}건`}
            label="활성 경보"
          />
        </View>

        {/* 3.3 경보 배너 (조건부) */}
        <AlertBanner
          count={summary.alertCount}
          names={alertNames}
          onPress={() => navigation.navigate('알림')}
        />

        {/* 3.4 섹션 헤더 */}
        <View style={styles.sechead}>
          <Text style={styles.sectitle}>추적 중인 가족</Text>
          <Pressable
            onPress={() => navigation.navigate('지도')}
            accessibilityRole="button"
          >
            <Text style={styles.seclink}>지도 보기 →</Text>
          </Pressable>
        </View>

        {/* 3.5 가족 카드 리스트 */}
        {people.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            onCall={handleCall}
            onLocate={handleLocate}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: screenPadding,
    paddingTop: 8,
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
});
