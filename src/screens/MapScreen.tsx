// 지도 화면 (골격) — design/design-spec.md §4.1
// react-native-maps + 추적 대상 마커. focusPersonId로 특정 인물 포커스.
// Expo Go / web 등에서 네이티브 맵 모듈이 없으면 폴백 UI로 대체.

import { Feather } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../components/Avatar';
import StatusBadge from '../components/StatusBadge';
import { ErrorView, LoadingView } from '../components/StateView';
import { usePersons } from '../hooks';
import { RootTabParamList } from '../navigation/types';
import { colors, radius, screenPadding, shadow } from '../theme/tokens';
import { TrackedPerson } from '../types';

type Props = BottomTabScreenProps<RootTabParamList, 'Map'>;

// 네이티브 맵 모듈을 안전하게 로드(미설치/미지원 시 null)
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
  } catch {
    MapView = null;
  }
}

const markerColor: Record<string, string> = {
  safe: colors.safe,
  alert: colors.danger,
  offline: colors.textSecondary,
};

export default function MapScreen({ route }: Props) {
  const focusId = route.params?.focusPersonId;
  const { data, loading, error, refetch } = usePersons();

  // 탭으로 돌아올 때 목록 갱신 (등록/삭제 반영)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const people = data ?? [];
  const focusPerson = people.find((p) => p.id === focusId) ?? people[0];

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Map</Text>
        </View>
        <LoadingView />
      </SafeAreaView>
    );
  }
  // 에러(500 등)가 나도 지도는 항상 표시 — 유효 좌표가 없으면 기본 지역(청주)으로.
  // (에러는 화면 하단 배너로만 살짝 알림, 아래 렌더 참고)
  const DEFAULT_REGION = {
    latitude: 36.6284,
    longitude: 127.4562,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };
  const hasCoord = (p?: TrackedPerson) =>
    !!p && (p.location.lat !== 0 || p.location.lng !== 0);
  const validPeople = people.filter(hasCoord);
  const base = hasCoord(focusPerson) ? focusPerson : validPeople[0];
  const region = base
    ? { latitude: base.location.lat, longitude: base.location.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : DEFAULT_REGION;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Map</Text>
        {focusId && focusPerson && (
          <Text style={styles.subtitle}>Focused on {focusPerson.name}</Text>
        )}
      </View>

      {(error || validPeople.length === 0) && (
        <View style={styles.mapBanner} pointerEvents="none">
          <Text style={styles.mapBannerText}>
            {error ? `Could not load location data (${error.message})` : 'No locations to show yet'}
          </Text>
        </View>
      )}

      {MapView ? (
        <MapView style={styles.map} initialRegion={region} region={region}>
          {validPeople.map((p) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.location.lat, longitude: p.location.lng }}
              title={p.name}
              description={p.location.address}
              pinColor={markerColor[p.status]}
            />
          ))}
        </MapView>
      ) : (
        // 폴백: 지도 모듈이 없을 때 마커 요약 리스트로 대체
        <ScrollView contentContainerStyle={styles.fallback}>
          <View style={styles.fallbackNotice}>
            <Feather name="map" size={20} color={colors.textSecondary} />
            <Text style={styles.fallbackText}>
              The map is unavailable in this environment, so a location list is shown instead.
            </Text>
          </View>
          {people.map((p) => {
            const focused = p.id === focusPerson?.id;
            return (
              <View key={p.id} style={[styles.row, focused && styles.rowFocused]}>
                <Avatar initial={p.avatarInitial} status={p.status} size={44} />
                <View style={styles.rowText}>
                  <Text style={styles.name}>{p.name}</Text>
                  <View style={styles.locLine}>
                    <Feather name="map-pin" size={13} color={colors.textSecondary} />
                    <Text style={styles.addr}>
                      {p.location.address} ({p.location.zoneLabel})
                    </Text>
                  </View>
                </View>
                <StatusBadge status={p.status} />
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
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
  subtitle: { fontSize: 13, color: colors.primary, marginTop: 2 },
  map: { flex: 1 },
  fallback: { padding: screenPadding, backgroundColor: colors.bg, flexGrow: 1 },
  fallbackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.infoBg,
    padding: 14,
    borderRadius: radius.card,
    marginBottom: 16,
  },
  fallbackText: { flex: 1, fontSize: 13, color: colors.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.card,
    marginBottom: 12,
    ...shadow,
  },
  rowFocused: { borderWidth: 2, borderColor: colors.primary },
  rowText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  locLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  addr: { fontSize: 13, color: colors.textSecondary },
  mapBanner: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  mapBannerText: {
    backgroundColor: 'rgba(20,30,50,0.75)',
    color: '#FFFFFF',
    fontSize: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
