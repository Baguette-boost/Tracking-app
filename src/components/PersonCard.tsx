// 가족 카드 — design/design-spec.md §3.5
// 상단 행(아바타+이름/나이+상태배지) → 위치 행 → 메트릭 행 → 액션 행(전화/위치)

import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { TrackedPerson } from '../types';
import { fromNow } from '../utils/relativeTime';
import Avatar from './Avatar';
import StatusBadge from './StatusBadge';

interface Props {
  person: TrackedPerson;
  onLocate: (person: TrackedPerson) => void;
}

export default function PersonCard({ person, onLocate }: Props) {
  const offline = person.status === 'offline';
  const zoneAlert = !person.location.inSafeZone && person.status === 'alert';

  return (
    <View style={styles.card}>
      {/* 1. 상단 행 */}
      <View style={styles.row1}>
        <Avatar initial={person.avatarInitial} status={person.status} />
        <View style={styles.nameWrap}>
          <Text style={styles.name}>{person.name}</Text>
          <Text style={styles.age}>{person.age}세</Text>
        </View>
        <StatusBadge status={person.status} />
      </View>

      {/* 2. 위치 행 */}
      <View style={styles.locRow}>
        <Feather name="map-pin" size={15} color={colors.textSecondary} />
        <Text style={styles.address} numberOfLines={1}>
          {person.location.address}{' '}
          <Text style={[styles.zone, zoneAlert && styles.zoneAlert]}>
            ({person.location.zoneLabel})
          </Text>
        </Text>
      </View>

      {/* 3. 메트릭 행 */}
      <View style={styles.metrics}>
        <Metric icon="battery" value={offline ? '—' : `${person.battery}%`} />
        <Metric icon="heart" value={offline ? '—' : `${person.heartRate} bpm`} />
        <Metric icon="trending-up" value={person.steps.toLocaleString()} />
        <Text style={styles.updated}>{fromNow(person.lastUpdated)}</Text>
      </View>

      {/* 4. 액션 행 */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnFilled, pressed && styles.filledPressed]}
          onPress={() => onLocate(person)}
          accessibilityRole="button"
          accessibilityLabel={`${person.name} 위치 보기`}
        >
          <Feather name="map-pin" size={17} color="#FFFFFF" />
          <Text style={styles.btnFilledText}>위치 보기</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Metric({ icon, value }: { icon: keyof typeof Feather.glyphMap; value: string }) {
  return (
    <View style={styles.metric}>
      <Feather name={icon} size={14} color={colors.textSecondary} />
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 16,
    ...shadow,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  nameWrap: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  age: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  address: { flex: 1, fontSize: 14, color: colors.textPrimary },
  zone: { color: colors.textSecondary },
  zoneAlert: { color: colors.dangerText, fontWeight: '600' },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metricValue: { fontSize: 13, color: colors.textPrimary },
  updated: {
    marginLeft: 'auto',
    fontSize: 12,
    color: colors.textSecondary,
  },
  actions: { flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnFilled: { backgroundColor: colors.primary },
  filledPressed: { backgroundColor: colors.primaryPressed },
  btnFilledText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  outlinePressed: { backgroundColor: colors.bg },
  btnOutlineText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
});
