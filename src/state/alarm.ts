// 낙상/배회 경보음 — persons 폴링 결과에서 플래그가 새로 켜진 사람을 찾아
// 소리가 나는 로컬 알림을 즉시 발생시킨다. (iOS 무료 계정은 원격 푸시 불가라
// 폴링 + 로컬 알림 조합이 유일한 소리 경로)
//
// 모듈 레벨 상태로 중복 발화를 막는다: 같은 데이터로 usePersons 인스턴스가
// 여러 화면에서 동시에 호출해도 최초 1회만 울린다.

import * as Notifications from 'expo-notifications';
import { TrackedPerson } from '../types';

type Flags = { fall: boolean; wander: boolean };
const lastFlags = new Map<string, Flags>();

export function soundNewAlerts(people: TrackedPerson[]) {
  for (const p of people) {
    const cur: Flags = { fall: !!p.flags?.isFall, wander: !!p.flags?.isWandering };
    const prev = lastFlags.get(p.id) ?? { fall: false, wander: false };
    lastFlags.set(p.id, cur);

    const newFall = cur.fall && !prev.fall;
    const newWander = cur.wander && !prev.wander;
    if (!newFall && !newWander) continue;

    const title =
      newFall && newWander
        ? `Fall + wandering detected — ${p.name}`
        : newFall
          ? `Fall detected — ${p.name}`
          : `Wandering detected — ${p.name}`;

    Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: 'Open the map to check their location and call them.',
        sound: 'default',
      },
      trigger: null, // 즉시
    }).catch((e) => console.log('[alarm] failed to schedule alert sound:', e));
  }
}
