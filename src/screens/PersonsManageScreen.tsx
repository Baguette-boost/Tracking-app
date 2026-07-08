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
        'Removed',
        unpaired
          ? 'The device token was deleted and the person was removed from the server.'
          : 'Removed from the server.'
      );
    } catch (e: any) {
      Alert.alert('Delete Failed', e?.message ?? 'Please try again.');
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
          'Device Unpairing Failed',
          `${e?.message ?? 'Could not connect to the device.'}\n\nTurn the device on, keep it nearby, and try again — or delete it from the server only.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete from Server Only', style: 'destructive', onPress: () => serverDelete(person, false) },
          ]
        );
        return;
      }
    }
    await serverDelete(person, !!mac);
  };

  const confirmDelete = (person: TrackedPerson) => {
    Alert.alert(
      'Remove Tracked Person',
      `Remove ${person.name}?\nThe token will be deleted from the device over Bluetooth, then the person will be removed from the server.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => attemptDelete(person) },
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
                  Age {p.age} · {p.location.address}
                </Text>
              </View>
              <Pressable
                style={styles.delete}
                onPress={() => confirmDelete(p)}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${p.name}`}
                hitSlop={8}
              >
                <Feather name="trash-2" size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))}
          {people.length === 0 && (
            <EmptyState
              title="No one added yet"
              subtitle={
                error
                  ? `Failed to load — ${error.message}`
                  : 'Tap “Add Tracked Person” below to get started.'
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
        <Text style={styles.addText}>Add Tracked Person</Text>
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
