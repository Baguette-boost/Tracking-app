// 지도 화면 (골격) — design/design-spec.md §4.1
// react-native-maps + 추적 대상 마커. focusPersonId로 특정 인물 포커스.
// Expo Go / web 등에서 네이티브 맵 모듈이 없으면 폴백 UI로 대체.

import { Feather } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../components/Avatar';
import StatusBadge from '../components/StatusBadge';
import { people } from '../data/mock';
import { RootTabParamList } from '../navigation/types';
import { colors, radius, screenPadding, shadow } from '../theme/tokens';

type Props = BottomTabScreenProps<RootTabParamList, '지도'>;

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
  const focusPerson = people.find((p) => p.id === focusId) ?? people[0];

  const region = {
    latitude: focusPerson.location.lat,
    longitude: focusPerson.location.lng,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>지도</Text>
        {focusId && (
          <Text style={styles.subtitle}>{focusPerson.name} 위치 포커스</Text>
        )}
      </View>

      {MapView ? (
        <MapView style={styles.map} initialRegion={region} region={region}>
          {people.map((p) => (
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
              이 환경에서는 지도를 표시할 수 없어 위치 목록으로 대체합니다.
            </Text>
          </View>
          {people.map((p) => {
            const focused = p.id === focusPerson.id;
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
});
