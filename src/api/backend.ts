// 실제 백엔드(Baguetteboost Backend) 어댑터.
// 서버 스키마를 앱 도메인 타입(../types, ./dto)으로 매핑한다.
// 서버에 없는 엔드포인트(zones/alerts/settings 등)는 화면이 깨지지 않게 안전한 기본값/거부로 처리.
//
// 서버 엔드포인트(OpenAPI 기준):
//   POST /auth/login {phone,password} -> {accessToken, tokenType}
//   GET  /me
//   GET  /persons -> PersonResponse[]
//   POST /persons {name, age, device_mac} -> PersonResponse
//   GET  /persons/{id}/location -> LocationResponse
//   GET  /persons/{id}/history?from&to -> {history:[{latitude,longitude,updatedAt}]}

import { AlertItem, AlertType, Guardian, TrackedPerson } from '../types';
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
  RegisterRequest,
  PushTokenRequest,
  SafeZone,
  TelemetryDto,
  UpdatePersonRequest,
} from './dto';
import { http, HttpError, setAccessToken } from './http';

// ---- 서버 응답 타입 ----
interface BE_Person {
  id: number;
  name: string;
  age: number;
  deviceId: string;
  deviceToken: string;
  createdAt: string;
  phoneNumber?: string | null; // 서버 응답 필드명은 phoneNumber (camelCase)
}
interface BE_LocationAbstract {
  latitude: number;
  longitude: number;
  updatedAt?: string; // 서버가 아직 안 내려줌
}
// GET /persons/{id}/location — 평평한 구조. address/zone/updatedAt 은 서버에 없음.
interface BE_Location {
  latitude: number;
  longitude: number;
  is_fall: boolean;
  is_wandering: boolean;
}
interface BE_History {
  history: BE_LocationAbstract[];
}
interface BE_Token {
  accessToken: string;
  tokenType?: string;
}
// GET /alerts -> AlertResponse[]
interface BE_Alert {
  id: number;
  person_id: number;
  alertType: string; // "wandering" | "fall_detected" | "offline"
  message: string;
  is_read: boolean;
  createdAt: string;
}
interface BE_UnreadCount {
  unread_count: number;
}

// 서버 alertType 문자열 -> 앱 AlertType
function toAlertType(t: string): AlertType {
  switch (t) {
    case 'wandering':
      return 'wandering';
    case 'fall_detected':
      return 'fall_detected';
    case 'offline':
      return 'offline';
    default:
      return 'offline';
  }
}
function toAlertItem(a: BE_Alert): AlertItem {
  return {
    id: String(a.id),
    personId: String(a.person_id),
    type: toAlertType(a.alertType),
    message: a.message,
    createdAt: a.createdAt,
    read: a.is_read,
  };
}

// ---- 매핑 ----
function toPerson(p: BE_Person): TrackedPerson {
  return {
    id: String(p.id),
    name: p.name,
    age: p.age,
    avatarInitial: p.name?.[0] ?? '?',
    status: 'offline', // 목록만으론 상태 미확정 -> location 조회 시 갱신
    location: { address: '—', zoneLabel: '—', inSafeZone: true, lat: 0, lng: 0 },
    battery: 0,
    heartRate: 0,
    steps: 0,
    lastUpdated: p.createdAt,
    phone: p.phoneNumber ?? undefined,
    deviceToken: p.deviceToken,
  };
}
function toLocationDto(l: BE_Location): LocationDto {
  // 서버는 is_fall / is_wandering 만 제공(지오펜스 없음). 배회를 '안전구역 이탈'로
  // 부르면 오해 → 실제 상태 그대로 라벨링.
  const zoneLabel = l.is_fall
    ? 'Fall detected'
    : l.is_wandering
      ? 'Wandering detected'
      : 'Normal';
  return {
    address: '—', // 서버가 주소를 제공하지 않음
    zoneLabel,
    inSafeZone: !(l.is_fall || l.is_wandering),
    lat: l.latitude,
    lng: l.longitude,
    updatedAt: new Date().toISOString(),
  };
}

// 위치 데이터가 아직 없으면 서버가 404 를 반환 -> null (지도에서 제외).
// 개별 위치 조회 실패로 목록 전체가 깨지지 않게 그 외 에러도 null 처리.
async function fetchLocationOrNull(
  personId: number | string,
  signal?: AbortSignal
): Promise<BE_Location | null> {
  try {
    return await http.get<BE_Location>(`/persons/${personId}/location`, undefined, signal);
  } catch (e) {
    if (e instanceof HttpError && e.status !== 404) {
      console.log(`[api] location fetch failed for person ${personId}:`, e.message);
    }
    return null;
  }
}

// 사람 + 최신 위치 병합. 위치가 있으면 좌표/상태 갱신, 없으면 offline 유지.
async function toPersonWithLocation(p: BE_Person, signal?: AbortSignal): Promise<TrackedPerson> {
  const person = toPerson(p);
  const loc = await fetchLocationOrNull(p.id, signal);
  if (loc) {
    const dto = toLocationDto(loc);
    person.location = {
      address: dto.address,
      zoneLabel: dto.zoneLabel,
      inSafeZone: dto.inSafeZone,
      lat: dto.lat,
      lng: dto.lng,
    };
    person.status = loc.is_fall || loc.is_wandering ? 'alert' : 'safe';
    person.flags = { isFall: !!loc.is_fall, isWandering: !!loc.is_wandering };
    person.lastUpdated = dto.updatedAt;
  }
  return person;
}

const notSupported = (what: string) => Promise.reject(new Error(`Not supported by the server: ${what}`));

// 로그인 시 /me 에서 받아두는 보호자 ID (등록 시 guardian_id 로 필요)
let cachedGuardianId: number | null = null;

// 마지막 등록 결과 (BLE 프로비저닝용 personId/deviceToken)
let lastRegistration: { personId: number; deviceToken: string } | null = null;
export function getLastRegistration() {
  return lastRegistration;
}

// 안전구역 기본값 (등록 폼에서 아직 안 받으므로 기본값 -> 나중에 지도 선택으로 교체)
const DEFAULT_BASE = { lat: 36.6284, lng: 127.4562, radius: 100 };

export const backendApi = {
  // 1. 인증
  auth: {
    login: async (body: LoginRequest): Promise<LoginResponse> => {
      const tok = await http.post<any>('/auth/login', body);
      // 서버 필드명 변형(accessToken / access_token / token) 모두 대응
      const token: string | undefined =
        tok?.accessToken ?? tok?.access_token ?? tok?.token ?? tok?.data?.accessToken;
      console.log('[auth] login response:', JSON.stringify(tok));
      if (!token) {
        throw new Error(`Login response did not include a token: ${JSON.stringify(tok)}`);
      }
      setAccessToken(token);
      console.log('[auth] token applied (length ' + token.length + ')');
      // 보호자 프로필 (스키마 유동적 -> 방어적 매핑)
      let guardian: Guardian = { id: '0', name: 'Guardian', phone: body.phone };
      try {
        const me = await http.get<any>('/me');
        const gid = Number(me?.id ?? me?.guardianId ?? me?.guardian_id);
        cachedGuardianId = Number.isFinite(gid) ? gid : null;
        console.log('[auth] guardianId =', cachedGuardianId, '| /me =', JSON.stringify(me));
        guardian = {
          id: String(me?.id ?? me?.guardianId ?? '0'),
          name: me?.name ?? 'Guardian',
          phone: me?.phone ?? body.phone,
        };
      } catch {
        /* /me 실패해도 로그인은 유지 */
      }
      return { accessToken: token, refreshToken: '', guardian };
    },
    // 회원가입: POST /auth/signup (SignUpRequest). 응답이 TokenResponse 라 로그인과 동일하게 처리.
    register: async (body: RegisterRequest): Promise<LoginResponse> => {
      const payload = {
        phone: body.phone,
        password: body.password,
        name: body.name,
        expo_token: body.expoToken ?? '', // 서버 필수 필드 (무료 iOS 계정은 빈 값)
      };
      const tok = await http.post<any>('/auth/signup', payload);
      console.log('[auth] signup response:', JSON.stringify(tok));
      const token: string | undefined =
        tok?.accessToken ?? tok?.access_token ?? tok?.token ?? tok?.data?.accessToken;
      if (!token) {
        throw new Error(`Sign-up response did not include a token: ${JSON.stringify(tok)}`);
      }
      setAccessToken(token);
      console.log('[auth] token applied after sign-up (length ' + token.length + ')');
      let guardian: Guardian = { id: '0', name: body.name, phone: body.phone };
      try {
        const me = await http.get<any>('/me');
        const gid = Number(me?.id ?? me?.guardianId ?? me?.guardian_id);
        cachedGuardianId = Number.isFinite(gid) ? gid : null;
        guardian = {
          id: String(me?.id ?? me?.guardianId ?? '0'),
          name: me?.name ?? body.name,
          phone: me?.phone ?? body.phone,
        };
      } catch {
        /* /me 실패해도 가입/로그인은 유지 */
      }
      return { accessToken: token, refreshToken: tok?.refresh_token ?? '', guardian };
    },
    refresh: () => notSupported('token refresh'),
    logout: async () => {
      setAccessToken(null);
    },
    setToken: setAccessToken,
  },

  // 2. 보호자 계정
  guardian: {
    me: async (): Promise<Guardian> => {
      const me = await http.get<any>('/me');
      return {
        id: String(me?.id ?? '0'),
        name: me?.name ?? 'Guardian',
        phone: me?.phone ?? '',
      };
    },
    update: () => notSupported('updating guardian profile'),
    getSettings: (): Promise<GuardianSettings> =>
      Promise.resolve({
        pushEnabled: true,
        zoneExitAlert: true,
        lowBatteryAlert: true,
        abnormalHrAlert: true,
      }),
    updateSettings: () => notSupported('updating notification settings'),
  },

  // 3. 추적 대상
  persons: {
    list: async (signal?: AbortSignal): Promise<TrackedPerson[]> => {
      let rows: BE_Person[];
      try {
        rows = await http.get<BE_Person[]>('/persons', undefined, signal);
      } catch (e) {
        // 서버는 환자가 0명일 때 빈 배열 대신 404 를 반환 -> 빈 목록으로 처리
        if (e instanceof HttpError && e.status === 404) return [];
        throw e;
      }
      return Promise.all(rows.map((p) => toPersonWithLocation(p, signal)));
    },
    get: async (id: string): Promise<TrackedPerson> => {
      const rows = await http.get<BE_Person[]>('/persons');
      const found = rows.find((p) => String(p.id) === id);
      if (!found) throw new Error(`person_not_found: ${id}`);
      return toPersonWithLocation(found);
    },
    create: async (body: CreatePersonRequest): Promise<TrackedPerson> => {
      // 중복 등록 사전 체크: 같은 기기(deviceToken=app-<MAC>)가 이미 있으면 막음
      const dupToken = `app-${body.deviceId}`;
      try {
        const existing = await http.get<BE_Person[]>('/persons');
        if (existing.some((p) => p.deviceToken === dupToken)) {
          throw new Error('This device is already registered.');
        }
      } catch (e: any) {
        if (e?.message === 'This device is already registered.') throw e;
        // 목록 조회 실패는 무시하고 등록 시도 (서버가 최종 판단)
      }
      // 서버(런타임 422 기준)가 요구하는 전체 필드 채워 전송.
      //   deviceId(BLE MAC) -> device_mac. guardian_id는 로그인 시 캐시된 값.
      //   안전구역(base_lat/lng/safe_radius)은 우선 기본값(추후 지도 선택으로 교체).
      const created = await http.post<BE_Person>('/persons', {
        name: body.name,
        age: body.age,
        phone_number: body.phone || undefined, // 서버 등록 필드명은 phone_number
        device_mac: body.deviceId,
        guardian_id: cachedGuardianId ?? 1,
        device_token: `app-${body.deviceId}`,
        current_battery: 100,
        base_lat: DEFAULT_BASE.lat,
        base_lng: DEFAULT_BASE.lng,
        safe_radius: DEFAULT_BASE.radius,
      });
      // BLE 프로비저닝에 쓸 personId/deviceToken 저장
      lastRegistration = { personId: created.id, deviceToken: created.deviceToken };
      return toPerson(created);
    },
    update: (_id: string, _body: UpdatePersonRequest) => notSupported('updating a person'),
    // 문서엔 없지만 서버에 있을 수 있어 실제로 호출 시도 (없으면 404/405)
    remove: (id: string) => http.delete<void>(`/persons/${id}`),
  },

  // 4. 위치·생체
  telemetry: {
    location: async (personId: string, signal?: AbortSignal): Promise<LocationDto> => {
      const l = await http.get<BE_Location>(`/persons/${personId}/location`, undefined, signal);
      return toLocationDto(l);
    },
    // 서버에 배터리/심박/걸음 조회 엔드포인트 없음 -> 기본값
    metrics: (_personId: string): Promise<TelemetryDto> =>
      Promise.resolve({ battery: 0, heartRate: 0, steps: 0, lastUpdated: new Date().toISOString() }),
    history: async (personId: string, from: string, to: string): Promise<LocationPoint[]> => {
      const res = await http.get<BE_History>(`/persons/${personId}/history`, { from, to });
      return (res.history ?? []).map((h) => ({
        lat: h.latitude,
        lng: h.longitude,
        at: h.updatedAt ?? '', // 서버가 시각을 안 내려줌
      }));
    },
  },

  // 5. 안전구역 (서버 미구현 -> 빈 목록)
  zones: {
    list: (_personId: string): Promise<SafeZone[]> => Promise.resolve([]),
    create: (_personId: string, _body: CreateZoneRequest) => notSupported('creating a safe zone'),
    update: (_zoneId: string, _body: Partial<CreateZoneRequest>) => notSupported('updating a safe zone'),
    remove: (_zoneId: string) => notSupported('deleting a safe zone'),
  },

  // 6. 알림 — 서버 /alerts 연결. (GET /alerts?limit, unread-count, {id}/read, read-all)
  alerts: {
    list: async (query: AlertQuery = {}): Promise<AlertListResponse> => {
      const rows = await http.get<BE_Alert[]>('/alerts', { limit: query.limit ?? 100 });
      let items = (rows ?? []).map(toAlertItem);
      if (query.filter === 'unread') items = items.filter((a) => !a.read);
      if (query.personId) items = items.filter((a) => a.personId === query.personId);
      // 서버가 시간 역순으로 준다고 되어 있으나, 방어적으로 재정렬.
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { items, nextCursor: undefined };
    },
    unreadCount: async (): Promise<{ count: number }> => {
      const r = await http.get<BE_UnreadCount>('/alerts/unread-count');
      return { count: r?.unread_count ?? 0 };
    },
    markRead: async (id: string): Promise<void> => {
      await http.patch(`/alerts/${id}/read`, {});
    },
    markAllRead: async (): Promise<void> => {
      await http.post('/alerts/read-all', {});
    },
  },

  // 7. 푸시 (서버 등록 엔드포인트 미확인 -> no-op)
  push: {
    register: (_body: PushTokenRequest) => Promise.resolve(),
    unregister: () => Promise.resolve(),
  },

  // 8. 대시보드 요약 (persons 목록에서 파생)
  dashboard: {
    summary: async (): Promise<DashboardSummary> => {
      try {
        const rows = await http.get<BE_Person[]>('/persons');
        return { totalCount: rows.length, safeCount: rows.length, alertCount: 0 };
      } catch (e) {
        // 환자 0명 -> 404 (빈 목록 의미)
        if (e instanceof HttpError && e.status === 404)
          return { totalCount: 0, safeCount: 0, alertCount: 0 };
        throw e;
      }
    },
  },

  // 9. 통화 로그 (서버 없음 -> no-op)
  call: {
    log: (_personId: string) => Promise.resolve(),
  },
};
