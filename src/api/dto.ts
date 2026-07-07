// API 요청/응답 DTO — design/api-spec.md
// 도메인 모델(../types)을 재사용하고, 전송용 보조 타입만 여기서 정의.

import { AlertItem, AlertType, Guardian, SafetyStatus, TrackedPerson } from '../types';

// --- 1. 인증 ---
export interface LoginRequest {
  phone: string;
  password: string;
}
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  guardian: Guardian;
}
export interface RefreshResponse {
  accessToken: string;
}
// 회원가입 (POST /auth/signup) — SignUpRequest {phone, password(8자+), name, expo_token}.
// 응답은 TokenResponse 라 가입 즉시 로그인 처리(자동 로그인) 가능.
export interface RegisterRequest {
  name: string;
  phone: string;
  password: string;
  expoToken?: string;
}

// --- 2. 보호자 계정 ---
export interface GuardianSettings {
  pushEnabled: boolean;
  zoneExitAlert: boolean;
  lowBatteryAlert: boolean;
  abnormalHrAlert: boolean;
}

// --- 3. 추적 대상 ---
export interface CreatePersonRequest {
  name: string;
  age: number;
  deviceId: string; // 페어링할 기기 식별자
}
export type UpdatePersonRequest = Partial<Pick<TrackedPerson, 'name' | 'age'>>;

// --- 4. 위치·생체 ---
export interface LocationDto {
  address: string;
  zoneLabel: string;
  inSafeZone: boolean;
  lat: number;
  lng: number;
  updatedAt: string;
}
export interface TelemetryDto {
  battery: number;
  heartRate: number;
  steps: number;
  lastUpdated: string;
}
export interface LocationPoint {
  lat: number;
  lng: number;
  at: string;
}
// WebSocket 실시간 이벤트
export type RealtimeEvent =
  | { type: 'location'; personId: string; data: LocationDto }
  | { type: 'telemetry'; personId: string; data: TelemetryDto }
  | { type: 'status'; personId: string; status: SafetyStatus }
  | { type: 'alert'; alert: AlertItem };

// --- 5. 안전구역 ---
export interface SafeZone {
  id: string;
  personId: string;
  label: string;
  shape: 'circle' | 'polygon';
  center?: { lat: number; lng: number };
  radius?: number; // m, circle
  points?: { lat: number; lng: number }[]; // polygon
}
export type CreateZoneRequest = Omit<SafeZone, 'id' | 'personId'>;

// --- 6. 알림 ---
export type AlertFilter = 'all' | 'unread';
export interface AlertQuery {
  filter?: AlertFilter;
  personId?: string;
  cursor?: string;
  limit?: number;
}
export interface AlertListResponse {
  items: AlertItem[];
  nextCursor?: string;
}

// --- 7. 푸시 ---
export interface PushTokenRequest {
  token: string;
  platform: 'ios' | 'android';
}

// --- 8. 대시보드 요약 ---
export interface DashboardSummary {
  totalCount: number;
  safeCount: number;
  alertCount: number;
}

export type { AlertType };
