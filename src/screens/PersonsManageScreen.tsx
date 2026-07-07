// 추적 대상 관리 — 목록 + 삭제(DELETE /persons/:id) + 등록 화면 진입.
// 내정보 §4.3 "추적 대상 관리".

import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { ErrorView, LoadingView } from '../components/StateView';
import { unpairDevice } from '../ble/manager';
import { usePersons } from '../hooks';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, screenPadding, shadow } from '../theme/tokens';
import { TrackedPerson } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonsManage'>;

export default function PersonsManageScreen({ navigation }: Props) {
  const { data, loading, error, refetch } = usePersons();

  // 등록/삭제 후 돌아올 때 목록 갱신
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // 서버에서만 삭제
  const serverDelete = async (person: TrackedPerson, unpaired: boolean) => {
    try {
      await api.persons.remove(person.id);
      refetch();
      Alert.alert(
        '해제 완료',
        unpaired ? '기기 토큰 삭제 + 서버 삭제가 완료됐어요.' : '서버에서 삭제했어요.'
      );
    } catch (e: any) {
      Alert.alert('삭제 실패', e?.message ?? '다시 시도해 주세요.');
    }
  };

  // 해제: BLE로 기기 토큰 삭제 확인 -> 서버 삭제
  const attemptDelete = async (person: TrackedPerson) => {
    const mac = person.deviceToken?.startsWith('app-')
      ? person.deviceToken.slice(4)
      : null;

    if (mac) {
      try {
        await unpairDevice(mac); // 기기 연결 + 토큰 삭제(write-ack 로 확인)
      } catch (e: any) {
        Alert.alert(
          '기기 연동 해제 실패',
          `${e?.message ?? '기기에 연결하지 못했어요.'}\n\n기기를 켜고 가까이 둔 뒤 다시 시도하거나, 서버에서만 삭제할 수 있어요.`,
          [
            { text: '취소', style: 'cancel' },
            { text: '서버만 삭제', style: 'destructive', onPress: () => serverDelete(person, false) },
          ]
        );
        return;
      }
    }
    await serverDelete(person, !!mac);
  };

  const confirmDelete = (person: TrackedPerson) => {
    Alert.alert(
      '추적 대상 해제',
      `${person.name} 님을 해제할까요?\n기기(블루투스)에서 토큰을 삭제한 뒤 서버에서 제거해요.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '해제', style: 'destructive', onPress: () => attemptDelete(person) },
      ]
    );
  };

  const people = data ?? [];

  return (
    <View style={styles.flex}>
      {loading && !data ? (
        <LoadingView />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {people.map((p) => (
            <View key={p.id} style={styles.row}>
              <Avatar initial={p.avatarInitial} status={p.status} size={44} />
              <View style={styles.info}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.sub}>
                  {p.age}세 · {p.location.address}
                </Text>
              </View>
              <Pressable
                style={styles.delete}
                onPress={() => confirmDelete(p)}
                accessibilityRole="button"
                accessibilityLabel={`${p.name} 삭제`}
                hitSlop={8}
              >
                <Feather name="trash-2" size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))}
          {people.length === 0 && (
            <EmptyState
              title="아직 등록되지 않았어요"
              subtitle={
                error
                  ? `불러오기 실패 — ${error.message}`
                  : '아래 ‘추적 대상 등록’으로 추가하세요.'
              }
            />
          )}
        </ScrollView>
      )}

      {/* 등록 버튼 (고정) */}
      <Pressable
        style={styles.add}
        onPress={() => navigation.navigate('AddPerson')}
        accessibilityRole="button"
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
        <Text style={styles.addText}>추적 대상 등록</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  body: { padding: screenPadding, gap: 12, paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    ...shadow,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  delete: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  add: {
    position: 'absolute',
    left: screenPadding,
    right: screenPadding,
    bottom: 28,
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadow,
  },
  addText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
