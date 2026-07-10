// 가족 카드 — design/design-spec.md §3.5
// 구성: 좌측 상태 accent bar · 상단(아바타+이름/나이+상태배지) ·
//       (배회/낙상 시) 경보 사유 배너 · 위치 패널(주소+좌표, 항상 표시) · 갱신시각 · Locate

import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { TrackedPerson } from '../types';
import { fromNow } from '../utils/relativeTime';
import { useReverseGeocode } from '../utils/geocode';
import { callPerson } from '../utils/call';
import Avatar from './Avatar';
import StatusBadge from './StatusBadge';

interface Props {
  person: TrackedPerson;
  onLocate: (person: TrackedPerson) => void;
}

const WANDER_ACCENT = '#C77A17';

// 좌측 accent bar 색 (낙상=빨강, 배회=주황, 그 외 없음)
function accentColor(flags?: { isFall: boolean; isWandering: boolean }): string | null {
  if (flags?.isFall) return colors.danger;
  if (flags?.isWandering) return WANDER_ACCENT;
  return null;
}

export default function PersonCard({ person, onLocate }: Props) {
  const { lat, lng, address } = person.location;
  const hasCoord = lat !== 0 || lng !== 0;
  const geoAddr = useReverseGeocode(hasCoord ? { lat, lng } : null);
  const addressLine =
    address && address !== '—' ? address : geoAddr ?? (hasCoord ? 'Locating address…' : 'No location yet');
  const coordLine = hasCoord ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : null;

  const accent = accentColor(person.flags);

  return (
    <View style={styles.card}>
      {accent && <View style={[styles.accent, { backgroundColor: accent }]} />}

      {/* 1. 상단 행 */}
      <View style={styles.row1}>
        <Avatar initial={person.avatarInitial} status={person.status} />
        <View style={styles.nameWrap}>
          <Text style={styles.name}>{person.name}</Text>
          <Text style={styles.age}>Age {person.age}</Text>
        </View>
        <StatusBadge status={person.status} flags={person.flags} />
      </View>

      {/* 2. 위치 패널 — 주소(강조) + 좌표, 컴팩트 */}
      <View style={styles.locPanel}>
        <Feather name="map-pin" size={15} color={colors.textSecondary} style={styles.locIcon} />
        <View style={styles.locText}>
          <Text style={styles.address} numberOfLines={1}>
            {addressLine}
          </Text>
          {coordLine && <Text style={styles.coord}>{coordLine}</Text>}
        </View>
      </View>

      {/* 4. 갱신 시각 */}
      <View style={styles.metrics}>
        <Feather name="clock" size={13} color={colors.textSecondary} />
        <Text style={styles.updated}>Updated {fromNow(person.lastUpdated)}</Text>
      </View>

      {/* 5. 액션 — 지도 보기 + (번호 있으면) 전화 */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.primaryPressed]}
          onPress={() => onLocate(person)}
          accessibilityRole="button"
          accessibilityLabel={`Locate ${person.name}`}
        >
          <Feather name="map" size={17} color="#FFFFFF" />
          <Text style={styles.btnText}>View on map</Text>
        </Pressable>
        {person.phone ? (
          <Pressable
            style={({ pressed }) => [styles.btn, styles.btnCall, pressed && styles.callPressed]}
            onPress={() => callPerson(person.phone, person.name)}
            accessibilityRole="button"
            accessibilityLabel={`Call ${person.name}`}
          >
            <Feather name="phone" size={17} color={colors.primary} />
            <Text style={styles.btnCallText}>Call</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    paddingLeft: 20, // accent bar 여백
    marginBottom: 16,
    overflow: 'hidden',
    ...shadow,
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  nameWrap: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  age: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  locPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.bg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  locIcon: { marginTop: 1 },
  locText: { flex: 1 },
  address: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  coord: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  metrics: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  updated: { fontSize: 12, color: colors.textSecondary },

  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    height: 46,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimary: { flex: 1, backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  btnCall: {
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  callPressed: { backgroundColor: colors.infoBg },
  btnCallText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
