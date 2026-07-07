// 목업 어댑터 — 백엔드가 준비되기 전, api.* 호출을 메모리 목업 데이터로 응답.
// 실제 서버 계약(docs/API.md)과 동일한 시그니처를 따른다.
// EXPO_PUBLIC_API_URL 이 설정되지 않으면 index.ts 가 이 어댑터를 사용.

import {
  alerts as seedAlerts,
  guardian as seedGuardian,
  people as seedPeople,
} from '../data/mock';
import { AlertItem, Guardian, TrackedPerson } from '../types';
import {
  AlertListResponse,
  AlertQuery,
  CreatePersonRequest,
  CreateZoneRequest,
  DashboardSummary,
  GuardianSettings,
  LocationDto,
  LocationPoint,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  PushTokenRequest,
  SafeZone,
  TelemetryDto,
  UpdatePersonRequest,
} from './dto';

// --- 인메모리 스토어 (목업 동작 중 변경 반영) ---
let guardianStore: Guardian = { ...seedGuardian };
let personStore: TrackedPerson[] = seedPeople.map((p) => ({ ...p }));
let alertStore: AlertItem[] = seedAlerts.map((a) => ({ ...a }));
let zoneStore: SafeZone[] = [
  {
    id: 'z1',
    personId: '2',
    label: '주간보호센터',
    shape: 'circle',
    center: { lat: 37.503, lng: 127.044 },
    radius: 150,
  },
];
let settingsStore: GuardianSettings = {
  pushEnabled: true,
  zoneExitAlert: true,
  lowBatteryAlert: true,
  abnormalHrAlert: true,
};

// 네트워크 지연 흉내
const delay = <T>(value: T, ms = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

function findPerson(id: string): TrackedPerson {
  const p = personStore.find((x) => x.id === id);
  if (!p) throw new Error(`person_not_found: ${id}`);
  return p;
}

export const mockApi = {
  // 1. 인증
  auth: {
    login: (_body: LoginRequest) =>
      delay<LoginResponse>({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        guardian: clone(guardianStore),
      }),
    register: (_body: RegisterRequest) =>
      delay<LoginResponse>({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        guardian: clone(guardianStore),
      }),
    refresh: (_refreshToken: string) =>
      delay({ accessToken: 'mock-access-token' }),
    logout: () => delay<void>(undefined),
    setToken: (_t: string | null) => {},
  },

  // 2. 보호자 계정
  guardian: {
    me: () => delay(clone(guardianStore)),
    update: (body: Partial<Pick<Guardian, 'name' | 'phone'>>) => {
      guardianStore = { ...guardianStore, ...body };
      return delay(clone(guardianStore));
    },
    getSettings: () => delay(clone(settingsStore)),
    updateSettings: (body: Partial<GuardianSettings>) => {
      settingsStore = { ...settingsStore, ...body };
      return delay(clone(settingsStore));
    },
  },

  // 3. 추적 대상
  persons: {
    list: (_signal?: AbortSignal) => delay(clone(personStore)),
    get: (id: string) => delay(clone(findPerson(id))),
    create: (body: CreatePersonRequest) => {
      const person: TrackedPerson = {
        id: String(personStore.length + 1),
        name: body.name,
        age: body.age,
        avatarInitial: body.name[0],
        status: 'safe',
        location: { address: '—', zoneLabel: '—', inSafeZone: true, lat: 37.5, lng: 127.04 },
        battery: 100,
        heartRate: 80,
        steps: 0,
        lastUpdated: '2026-06-19T09:42:00+09:00',
      };
      personStore = [...personStore, person];
      return delay(clone(person), 400);
    },
    update: (id: string, body: UpdatePersonRequest) => {
      const p = findPerson(id);
      Object.assign(p, body);
      return delay(clone(p));
    },
    remove: (id: string) => {
      personStore = personStore.filter((x) => x.id !== id);
      return delay<void>(undefined);
    },
  },

  // 4. 위치·생체
  telemetry: {
    location: (id: string, _signal?: AbortSignal) => {
      const p = findPerson(id);
      return delay<LocationDto>({ ...p.location, updatedAt: p.lastUpdated });
    },
    metrics: (id: string, _signal?: AbortSignal) => {
      const p = findPerson(id);
      return delay<TelemetryDto>({
        battery: p.battery,
        heartRate: p.heartRate,
        steps: p.steps,
        lastUpdated: p.lastUpdated,
      });
    },
    history: (id: string, _from: string, _to: string) => {
      const p = findPerson(id);
      return delay<LocationPoint[]>([
        { lat: p.location.lat - 0.001, lng: p.location.lng - 0.001, at: '2026-06-19T09:30:00+09:00' },
        { lat: p.location.lat, lng: p.location.lng, at: p.lastUpdated },
      ]);
    },
  },

  // 5. 안전구역
  zones: {
    list: (personId: string) =>
      delay(clone(zoneStore.filter((z) => z.personId === personId))),
    create: (personId: string, body: CreateZoneRequest) => {
      const zone: SafeZone = { ...body, id: `z${zoneStore.length + 1}`, personId };
      zoneStore = [...zoneStore, zone];
      return delay(clone(zone));
    },
    update: (zoneId: string, body: Partial<CreateZoneRequest>) => {
      const z = zoneStore.find((x) => x.id === zoneId);
      if (!z) throw new Error(`zone_not_found: ${zoneId}`);
      Object.assign(z, body);
      return delay(clone(z));
    },
    remove: (zoneId: string) => {
      zoneStore = zoneStore.filter((x) => x.id !== zoneId);
      return delay<void>(undefined);
    },
  },

  // 6. 알림
  alerts: {
    list: (query: AlertQuery = {}) => {
      let items = [...alertStore].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      if (query.filter === 'unread') items = items.filter((a) => !a.read);
      if (query.personId) items = items.filter((a) => a.personId === query.personId);
      return delay<AlertListResponse>({ items: clone(items), nextCursor: undefined });
    },
    unreadCount: () =>
      delay({ count: alertStore.filter((a) => !a.read).length }),
    markRead: (id: string) => {
      const a = alertStore.find((x) => x.id === id);
      if (!a) throw new Error(`alert_not_found: ${id}`);
      a.read = true;
      return delay(clone(a));
    },
    markAllRead: () => {
      alertStore = alertStore.map((a) => ({ ...a, read: true }));
      return delay<void>(undefined);
    },
  },

  // 7. 푸시
  push: {
    register: (_body: PushTokenRequest) => delay<void>(undefined),
    unregister: () => delay<void>(undefined),
  },

  // 8. 대시보드 요약
  dashboard: {
    summary: () =>
      delay<DashboardSummary>({
        totalCount: personStore.length,
        safeCount: personStore.filter((p) => p.status === 'safe').length,
        alertCount: personStore.filter((p) => p.status === 'alert').length,
      }),
  },

  // 9. 통화 로그
  call: {
    log: (_personId: string) => delay<void>(undefined),
  },
};
