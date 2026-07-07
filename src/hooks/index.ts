// 도메인 데이터 훅 — 화면에서 사용. 모두 api.* 를 호출하며,
// 백엔드 미연결 시 자동으로 목업 어댑터로 응답된다(src/api/index.ts USE_MOCK).

import { api, AlertFilter, DashboardSummary } from '../api';
import { AlertItem, Guardian, TrackedPerson } from '../types';
import { useAsync } from './useAsync';

export function usePersons() {
  return useAsync<TrackedPerson[]>(() => api.persons.list(), []);
}

export function useDashboardSummary() {
  return useAsync<DashboardSummary>(() => api.dashboard.summary(), []);
}

export function useGuardian() {
  return useAsync<Guardian>(() => api.guardian.me(), []);
}

export function useAlerts(filter: AlertFilter) {
  return useAsync<AlertItem[]>(
    () => api.alerts.list({ filter }).then((r) => r.items),
    [filter]
  );
}

export function useUnreadCount() {
  return useAsync<number>(
    () => api.alerts.unreadCount().then((r) => r.count),
    []
  );
}

export { useAsync };
