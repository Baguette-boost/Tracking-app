// 미확인 알림 수 공용 스토어 — 화면 간(알림 탭·홈 벨·탭 배지) 실시간 동기화.
// 알림을 읽으면 어디서든 즉시 배지가 줄어든다.

import { useSyncExternalStore } from 'react';
import { api } from '../api';

let count = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const unreadStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return count;
  },
  set(next: number) {
    const clamped = Math.max(0, next);
    if (clamped !== count) {
      count = clamped;
      emit();
    }
  },
  decrement(by = 1) {
    unreadStore.set(count - by);
  },
};

// 서버(목업)에서 최신 미확인 수를 가져와 스토어에 반영.
export async function refreshUnread() {
  try {
    const res = await api.alerts.unreadCount();
    unreadStore.set(res.count);
  } catch {
    // 무시 — 다음 갱신 때 재시도
  }
}

export function useUnread() {
  return useSyncExternalStore(unreadStore.subscribe, unreadStore.getSnapshot);
}
