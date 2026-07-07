// SafeTrack API 클라이언트 — 카테고리별 엔드포인트.
// design/api-spec.md 와 1:1 대응. 사용 예: api.persons.list()
//
// 현재 백엔드가 없으므로 호출부는 그대로 두고, 서버 준비 시
// EXPO_PUBLIC_API_URL 만 지정하면 동작. 목업 데이터는 src/data/mock.ts 참고.

import { Guardian } from '../types';
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
  LoginResponse,
  PushTokenRequest,
  RefreshResponse,
  RegisterRequest,
  SafeZone,
  TelemetryDto,
  UpdatePersonRequest,
} from './dto';
import { http, Query, setAccessToken } from './http';
import { AlertItem, TrackedPerson } from '../types';
import { mockApi } from './mock';
import { backendApi } from './backend';

// 1. 인증
export const auth = {
  login: (body: LoginRequest) => http.post<LoginResponse>('/auth/login', body),
  register: (body: RegisterRequest) => http.post<LoginResponse>('/auth/signup', body),
  refresh: (refreshToken: string) =>
    http.post<RefreshResponse>('/auth/refresh', { refreshToken }),
  logout: () => http.post<void>('/auth/logout'),
  setToken: setAccessToken,
};

// 2. 보호자 계정
export const guardian = {
  me: () => http.get<Guardian>('/me'),
  update: (body: Partial<Pick<Guardian, 'name' | 'phone'>>) =>
    http.patch<Guardian>('/me', body),
  getSettings: () => http.get<GuardianSettings>('/me/settings'),
  updateSettings: (body: Partial<GuardianSettings>) =>
    http.patch<GuardianSettings>('/me/settings', body),
};

// 3. 추적 대상
export const persons = {
  list: (signal?: AbortSignal) =>
    http.get<TrackedPerson[]>('/persons', undefined, signal),
  get: (id: string) => http.get<TrackedPerson>(`/persons/${id}`),
  create: (body: CreatePersonRequest) =>
    http.post<TrackedPerson>('/persons', body),
  update: (id: string, body: UpdatePersonRequest) =>
    http.patch<TrackedPerson>(`/persons/${id}`, body),
  remove: (id: string) => http.delete<void>(`/persons/${id}`),
};

// 4. 위치·생체
export const telemetry = {
  location: (personId: string, signal?: AbortSignal) =>
    http.get<LocationDto>(`/persons/${personId}/location`, undefined, signal),
  metrics: (personId: string, signal?: AbortSignal) =>
    http.get<TelemetryDto>(`/persons/${personId}/telemetry`, undefined, signal),
  history: (personId: string, from: string, to: string) =>
    http.get<LocationPoint[]>(`/persons/${personId}/history`, { from, to }),
};

// 5. 안전구역
export const zones = {
  list: (personId: string) => http.get<SafeZone[]>(`/persons/${personId}/zones`),
  create: (personId: string, body: CreateZoneRequest) =>
    http.post<SafeZone>(`/persons/${personId}/zones`, body),
  update: (zoneId: string, body: Partial<CreateZoneRequest>) =>
    http.patch<SafeZone>(`/zones/${zoneId}`, body),
  remove: (zoneId: string) => http.delete<void>(`/zones/${zoneId}`),
};

// 6. 알림
export const alerts = {
  list: (query: AlertQuery = {}) =>
    http.get<AlertListResponse>('/alerts', query as Query),
  unreadCount: () => http.get<{ count: number }>('/alerts/unread-count'),
  markRead: (id: string) => http.patch<AlertItem>(`/alerts/${id}/read`),
  markAllRead: () => http.post<void>('/alerts/read-all'),
};

// 7. 푸시 등록
export const push = {
  register: (body: PushTokenRequest) =>
    http.post<void>('/devices/push-token', body),
  unregister: () => http.delete<void>('/devices/push-token'),
};

// 8. 대시보드 요약
export const dashboard = {
  summary: () => http.get<DashboardSummary>('/dashboard/summary'),
};

// 9. 통화 (선택: 통화 로그). 실제 전화 연결은 Linking.openURL('tel:..')
export const call = {
  log: (personId: string) => http.post<void>(`/persons/${personId}/call-log`),
};

const realApi = {
  auth,
  guardian,
  persons,
  telemetry,
  zones,
  alerts,
  push,
  dashboard,
  call,
};

// 백엔드 URL이 없으면 목업 어댑터 사용(개발/데모). 서버가 준비되면
// EXPO_PUBLIC_API_URL 만 지정하면 실제 HTTP 호출로 전환된다.
export const USE_MOCK = !process.env.EXPO_PUBLIC_API_URL;

// EXPO_PUBLIC_API_URL 이 있으면 실제 백엔드 어댑터, 없으면 목업.
export const api: typeof realApi = USE_MOCK
  ? (mockApi as typeof realApi)
  : (backendApi as unknown as typeof realApi);

export * from './dto';
export { HttpError, setAccessToken } from './http';
