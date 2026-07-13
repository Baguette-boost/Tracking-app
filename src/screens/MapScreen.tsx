// 지도 화면 (골격) — design/design-spec.md §4.1
// react-native-maps + 추적 대상 마커. focusPersonId로 특정 인물 포커스.
// Expo Go / web 등에서 네이티브 맵 모듈이 없으면 폴백 UI로 대체.

import { Feather } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api';
import Avatar from '../components/Avatar';
import StatusBadge from '../components/StatusBadge';
import { LoadingView } from '../components/StateView';
import { usePersons } from '../hooks';
import { RootTabParamList } from '../navigation/types';
import { colors, radius, screenPadding, shadow } from '../theme/tokens';
import { TrackedPerson } from '../types';
import { useReverseGeocode } from '../utils/geocode';
import { callPerson } from '../utils/call';
import { fromNow } from '../utils/relativeTime';

type Props = BottomTabScreenProps<RootTabParamList, 'Map'>;

// 네이티브 맵 모듈을 안전하게 로드(미설치/미지원 시 null)
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_GOOGLE: any = undefined;
if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch {
    MapView = null;
  }
}

// 배회 = 주황 (낙상 빨강과 구분). WCAG AA: 마커 흰 글씨/흰 배경 텍스트 모두 5.07:1 (기존 #F2A03D 2.13 ✗)
const WANDER_COLOR = '#A25E0C';

type MarkerLook = { color: string; icon: keyof typeof Feather.glyphMap; label: string };

// 마커 색·아이콘·라벨. 낙상+배회 동시면 둘 다 라벨에 표기(색은 더 위급한 낙상=빨강).
function markerLook(p: TrackedPerson): MarkerLook {
  const fall = !!p.flags?.isFall;
  const wander = !!p.flags?.isWandering;
  if (fall && wander)
    return { color: colors.danger, icon: 'alert-triangle', label: 'Fall + Wandering' };
  if (fall) return { color: colors.danger, icon: 'alert-triangle', label: 'Fall' };
  if (wander) return { color: WANDER_COLOR, icon: 'navigation', label: 'Wandering' };
  if (p.status === 'alert') return { color: colors.danger, icon: 'alert-triangle', label: 'Alert' };
  if (p.status === 'offline') return { color: colors.textSecondary, icon: 'wifi-off', label: 'Offline' };
  return { color: colors.safe, icon: 'check', label: 'Idle' };
}

type LatLng = { latitude: number; longitude: number };

// 개별 마커 — 상태색 핀. 탭하면 상세는 하단 FocusCard 로 표시.
function PersonMarker({
  person,
  position,
  line,
  onPress,
}: {
  person: TrackedPerson;
  position: LatLng;
  line?: LatLng[];
  onPress: () => void;
}) {
  const look = markerLook(person);
  return (
    <>
      {line && line.length >= 2 && (
        <Polyline coordinates={line} strokeColor={look.color} strokeWidth={4} />
      )}
      <Marker coordinate={position} anchor={{ x: 0.5, y: 1 }} onPress={onPress} tracksViewChanges={false}>
        <View style={styles.markerWrap}>
          <View style={[styles.markerPill, { backgroundColor: look.color }]}>
            <Feather name={look.icon} size={12} color="#FFFFFF" />
            <Text style={styles.markerLabel}>{look.label}</Text>
          </View>
          <View style={[styles.markerTip, { borderTopColor: look.color }]} />
        </View>
      </Marker>
    </>
  );
}

// 지도 하단 상세 카드 — 알림 진입/마커 탭 시 바로 표시(전화 + 상태 해제).
function FocusCard({
  person,
  position,
  times,
  onClose,
  onResolve,
}: {
  person: TrackedPerson;
  position: LatLng;
  times?: { fall?: string; wander?: string }; // 낙상/배회 감지 시각(ISO)
  onClose: () => void;
  onResolve: (p: TrackedPerson) => Promise<void>;
}) {
  const geoAddr = useReverseGeocode({ lat: position.latitude, lng: position.longitude });
  const addressLine = geoAddr ?? 'Locating address…';
  const coordLine = `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`;
  const isFall = !!person.flags?.isFall;
  const isWander = !!person.flags?.isWandering;
  const isEvent = isFall || isWander;
  const [resolving, setResolving] = useState(false);
  // 해제 버튼 문구를 실제 동작(활성 상태 전부 해제)과 일치시킨다.
  const resolveLabel =
    isFall && isWander
      ? 'Mark both resolved'
      : isFall
        ? 'Mark fall resolved'
        : 'Mark wandering resolved';
  // 오탐 해제는 되돌릴 수 없으므로 실행 전 반드시 확인을 받는다.
  const eventLabel =
    isFall && isWander ? 'fall and wandering alerts' : isFall ? 'fall alert' : 'wandering alert';
  const doResolve = () => {
    Alert.alert(
      'Mark as resolved?',
      `This clears the ${eventLabel} for ${person.name} and sets their status back to Idle. Only do this after checking they are safe.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: () => {
            setResolving(true);
            onResolve(person).finally(() => setResolving(false));
          },
        },
      ]
    );
  };
  return (
    <View style={styles.focusCard}>
      <Pressable style={styles.focusClose} onPress={onClose} hitSlop={8} accessibilityLabel="Close">
        <Feather name="x" size={18} color={colors.textSecondary} />
      </Pressable>
      <View style={styles.focusHead}>
        <View style={styles.focusAvatar}>
          <Text style={styles.focusAvatarText}>{person.avatarInitial}</Text>
        </View>
        <View style={styles.focusHeadText}>
          <Text style={styles.focusName} numberOfLines={1}>
            {person.name}
          </Text>
          {/* 낙상·배회가 동시면 각각 감지 시각을 한 줄씩 표시 */}
          {isFall && (
            <View style={styles.focusTimeRow}>
              <Feather name="clock" size={12} color={colors.dangerText} />
              <Text style={[styles.focusTime, { color: colors.dangerText }]}>
                Fall · {times?.fall ? fromNow(times.fall) : 'just now'}
              </Text>
            </View>
          )}
          {isWander && (
            <View style={styles.focusTimeRow}>
              <Feather name="clock" size={12} color={WANDER_COLOR} />
              <Text style={[styles.focusTime, { color: WANDER_COLOR }]}>
                Wandering · {times?.wander ? fromNow(times.wander) : 'just now'}
              </Text>
            </View>
          )}
        </View>
        {/* 활성 상태 전부 표시 (낙상 + 배회 동시면 배지 2개) */}
        <StatusBadge status={person.status} flags={person.flags} />
      </View>
      <View style={styles.focusLoc}>
        <Feather name="map-pin" size={14} color={colors.textSecondary} style={{ marginTop: 1 }} />
        <View style={styles.focusLocText}>
          <Text style={styles.focusAddr} numberOfLines={2}>
            {addressLine}
          </Text>
          <Text style={styles.focusCoord}>{coordLine}</Text>
        </View>
      </View>
      {person.phone ? (
        <Pressable
          style={({ pressed }) => [styles.focusCall, pressed && styles.focusCallPressed]}
          onPress={() => callPerson(person.phone, person.name)}
          accessibilityRole="button"
          accessibilityLabel={`Call ${person.name}`}
        >
          <Feather name="phone" size={18} color="#FFFFFF" />
          <Text style={styles.focusCallText}>Call {person.name}</Text>
        </Pressable>
      ) : (
        <View style={styles.focusNoPhone}>
          <Feather name="phone-off" size={15} color={colors.textSecondary} />
          <Text style={styles.focusNoPhoneText}>No phone number saved</Text>
        </View>
      )}

      {/* 낙상/배회 상태일 때만: 확인 후 수동 해제(정상화) */}
      {isEvent && (
        <Pressable
          style={({ pressed }) => [styles.focusResolve, pressed && styles.focusResolvePressed]}
          onPress={doResolve}
          disabled={resolving}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${person.name} as resolved`}
        >
          {resolving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Feather name="check-circle" size={17} color={colors.primary} />
              <Text style={styles.focusResolveText}>{resolveLabel}</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

export default function MapScreen({ route }: Props) {
  const focusId = route.params?.focusPersonId;
  const { data, loading, error, refetch } = usePersons();

  // 화면이 떠 있는 동안 자동 갱신: 진입 시 1회 + 15초마다 폴링(낙상/배회 실시간 반영).
  // 벗어나면 인터벌 정리. (RefreshControl 은 loading 과 분리돼 있어 스피너 여백 없음)
  useFocusEffect(
    useCallback(() => {
      refetch();
      const id = setInterval(() => refetch(), 15000);
      return () => clearInterval(id);
    }, [refetch])
  );

  // 낙상/배회 상태 수동 해제 → 서버 정상화 후 목록 갱신(카드가 Idle 로 반영됨)
  const handleResolve = useCallback(
    async (p: TrackedPerson) => {
      const body: { is_fall?: boolean; is_wandering?: boolean } = {};
      if (p.flags?.isFall) body.is_fall = false;
      if (p.flags?.isWandering) body.is_wandering = false;
      try {
        await api.persons.normalizeStatus(p.id, body);
      } catch {
        // 실패해도 UI 는 갱신 시도
      }
      await refetch();
    },
    [refetch]
  );

  const people = data ?? [];
  const focusPerson = people.find((p) => p.id === focusId) ?? people[0];
  const hasCoord = (p?: TrackedPerson) =>
    !!p && (p.location.lat !== 0 || p.location.lng !== 0);
  // history 는 현재 위치와 무관하게 모든 사람에 대해 조회.
  // (location 404 여도 과거 궤적은 있을 수 있으므로 validPeople 로 제한하면 안 됨)
  const peopleKey = people.map((p) => `${p.id}:${p.lastUpdated}`).join('|');

  // 최근 10분 이동 경로(history) — 사람별 폴리라인.
  // ⚠ 훅은 반드시 early-return 이전에 호출 (Rules of Hooks).
  const [tracks, setTracks] = useState<Record<string, { latitude: number; longitude: number }[]>>({});
  useEffect(() => {
    let cancelled = false;
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 지난 10분
    Promise.all(
      people.map(async (p) => {
        try {
          const pts = await api.telemetry.history(p.id, from, to);
          const line = (pts ?? [])
            .map((h) => ({ latitude: Number(h.lat), longitude: Number(h.lng) }))
            .filter((c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude));
          return [p.id, line] as const;
        } catch {
          return [p.id, [] as { latitude: number; longitude: number }[]] as const;
        }
      })
    ).then((entries) => {
      if (!cancelled) setTracks(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peopleKey]);

  // 배회/낙상 감지 시각 — 서버 alert 목록에서 사람별 최신 createdAt.
  const [alertTimes, setAlertTimes] = useState<Record<string, { fall?: string; wander?: string }>>({});
  useEffect(() => {
    let cancelled = false;
    api.alerts
      .list({ limit: 100 })
      .then((res) => {
        const m: Record<string, { fall?: string; wander?: string }> = {};
        for (const a of res.items ?? []) {
          const cur = m[a.personId] ?? {};
          if (a.type === 'fall_detected' && !cur.fall) cur.fall = a.createdAt;
          if (a.type === 'wandering' && !cur.wander) cur.wander = a.createdAt;
          m[a.personId] = cur;
        }
        if (!cancelled) setAlertTimes(m);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peopleKey]);

  // 하단 상세 카드 대상 — 알림/홈에서 focusId 로 진입하면 자동 선택, 마커 탭으로 변경.
  const [selectedId, setSelectedId] = useState<string | undefined>(focusId);
  useEffect(() => {
    if (focusId) setSelectedId(focusId);
  }, [focusId]);

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
  const DEFAULT_REGION = {
    latitude: 36.6284,
    longitude: 127.4562,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };
  // 마커 위치 = 현재 좌표(있으면) 아니면 history 마지막 점(현재 fix 없을 때).
  const lastHistoryPoint = (id: string) => {
    const line = tracks[id];
    return line && line.length ? line[line.length - 1] : null;
  };
  const positionFor = (p?: TrackedPerson) => {
    if (!p) return null;
    if (hasCoord(p)) return { latitude: Number(p.location.lat), longitude: Number(p.location.lng) };
    return lastHistoryPoint(p.id);
  };
  const markerPeople = people.filter((p) => positionFor(p) !== null);
  const basePos =
    positionFor(focusPerson) ?? (markerPeople[0] ? positionFor(markerPeople[0]) : null);
  const region = basePos
    ? { latitude: basePos.latitude, longitude: basePos.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : DEFAULT_REGION;

  // 하단 상세 카드 대상 (선택된 인물 + 좌표 있을 때)
  const selectedPerson = selectedId ? people.find((p) => p.id === selectedId) : undefined;
  const selectedPos = positionFor(selectedPerson);
  // 낙상·배회 감지 시각을 둘 다 전달(동시 발생 시 각각 표시)
  const selectedTimes = selectedPerson ? alertTimes[selectedPerson.id] : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Map</Text>
        {focusId && focusPerson && (
          <Text style={styles.subtitle}>Focused on {focusPerson.name}</Text>
        )}
      </View>

      {(error || markerPeople.length === 0) && (
        <View style={styles.mapBanner} pointerEvents="none">
          <Text style={styles.mapBannerText}>
            {error ? `Could not load location data (${error.message})` : 'No locations to show yet'}
          </Text>
        </View>
      )}

      {MapView ? (
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={region}
          region={region}
        >
          {markerPeople.map((p) => (
            <PersonMarker
              key={p.id}
              person={p}
              position={positionFor(p)!}
              line={tracks[p.id]}
              onPress={() => setSelectedId(p.id)}
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
                      {p.location.lat !== 0 || p.location.lng !== 0
                        ? `${p.location.lat.toFixed(5)}, ${p.location.lng.toFixed(5)}`
                        : '—'}{' '}
                      ({p.location.zoneLabel})
                    </Text>
                  </View>
                </View>
                <StatusBadge status={p.status} />
              </View>
            );
          })}
        </ScrollView>
      )}

      {MapView && selectedPerson && selectedPos && (
        <FocusCard
          person={selectedPerson}
          position={selectedPos}
          times={selectedTimes}
          onClose={() => setSelectedId(undefined)}
          onResolve={handleResolve}
        />
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
  markerWrap: { alignItems: 'center' },
  markerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  markerTip: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  // 하단 상세 카드
  focusCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
    ...shadow,
  },
  focusClose: { position: 'absolute', top: 10, right: 10, zIndex: 2, padding: 2 },
  focusHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, paddingRight: 22 },
  focusAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.avatarBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusAvatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  focusHeadText: { flex: 1 },
  focusName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  focusTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  focusTime: { fontSize: 12, fontWeight: '600' },
  focusStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  focusStatusText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  focusLoc: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  focusLocText: { flex: 1 },
  focusAddr: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  focusCoord: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  focusCall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
  },
  focusCallPressed: { backgroundColor: colors.primaryPressed },
  focusCallText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  focusNoPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: radius.button,
    backgroundColor: colors.bg,
  },
  focusNoPhoneText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  focusResolve: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    marginTop: 10,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  focusResolvePressed: { backgroundColor: colors.infoBg },
  focusResolveText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
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
