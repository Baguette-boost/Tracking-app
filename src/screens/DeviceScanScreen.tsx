// 트래커 BLE 검색 화면 — 근처 SAFETRACK 기기를 스캔해 목록 표시,
// 하나 선택하면 그 deviceId를 등록 화면(AddPerson)으로 되돌려 자동 입력.

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { bleManager, consumePendingPick, scanTrackers, ScannedTracker } from '../ble/manager';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, screenPadding } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'DeviceScan'>;

export default function DeviceScanScreen({ navigation }: Props) {
  const [devices, setDevices] = useState<Record<string, ScannedTracker>>({});
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef<() => void>(() => {});

  const start = useCallback(async () => {
    setError(null);
    setDevices({});
    setScanning(true);
    stopRef.current = await scanTrackers(
      (t) => setDevices((prev) => ({ ...prev, [t.id]: t })),
      (msg) => {
        setError(msg);
        setScanning(false);
      },
    );
  }, []);

  useEffect(() => {
    start();
    return () => {
      stopRef.current?.();
      bleManager().stopDeviceScan();
    };
  }, [start]);

  const pick = (t: ScannedTracker) => {
    stopRef.current?.();
    bleManager().stopDeviceScan();
    setScanning(false);
    // 홀더로 선택 결과(BLE 핸들 포함) 전달 후 뒤로 가기 -> 등록 화면 상태 유지됨
    consumePendingPick(t);
    navigation.goBack();
  };

  const list = Object.values(devices).sort((a, b) => b.rssi - a.rssi);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>근처 트래커 검색</Text>
        <Text style={styles.sub}>
          {scanning ? '검색 중…' : '검색 중지됨'} · 기기 전원을 켜고 가까이 두세요
        </Text>
      </View>

      {error && (
        <View style={styles.errBox}>
          <Text style={styles.errText}>{error}</Text>
          <Pressable onPress={start} style={styles.retry} accessibilityRole="button">
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={list}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => pick(item)} accessibilityRole="button">
            <View style={styles.dot} />
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{item.deviceId}</Text>
              <Text style={styles.cardSub}>{item.name}</Text>
            </View>
            <Text style={styles.rssi}>{item.rssi} dBm</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.emptyText}>SAFETRACK 기기를 찾는 중…</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: screenPadding,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  errBox: {
    margin: screenPadding,
    padding: 14,
    borderRadius: radius.card,
    backgroundColor: colors.dangerBg,
    gap: 10,
  },
  errText: { color: colors.dangerText, fontSize: 14 },
  retry: { alignSelf: 'flex-start' },
  retryText: { color: colors.primary, fontWeight: '700' },
  listContent: { padding: screenPadding, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.safe },
  cardBody: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  cardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rssi: { fontSize: 12, color: colors.textSecondary },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
});
