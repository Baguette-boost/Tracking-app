// 샘플 목업 데이터 — design/design-spec.md §5.1
// 기준: 총 4명 / 안전 1명 / 경보 2건 (+ 오프라인 1명)

import { AlertItem, Guardian, TrackedPerson } from '../types';

export const guardian: Guardian = {
  id: 'g1',
  name: '김보호자',
  phone: '01012345678',
};

// 각 인물의 보호자 측 연락처(전화 버튼 대상)
export const personPhones: Record<string, string> = {
  '1': '01011112222',
  '2': '01033334444',
  '3': '01055556666',
  '4': '01077778888',
};

export const people: TrackedPerson[] = [
  {
    id: '1',
    name: '김지우',
    age: 8,
    avatarInitial: '김',
    status: 'alert',
    location: { address: '역삼로 24', zoneLabel: '안전구역 이탈', inSafeZone: false, lat: 37.501, lng: 127.036 },
    battery: 78,
    heartRate: 92,
    steps: 3420,
    lastUpdated: '2026-06-19T09:41:00+09:00',
  },
  {
    id: '2',
    name: '이서준',
    age: 7,
    avatarInitial: '이',
    status: 'safe',
    location: { address: '테헤란로 88', zoneLabel: '학교 내', inSafeZone: true, lat: 37.503, lng: 127.044 },
    battery: 45,
    heartRate: 88,
    steps: 5210,
    lastUpdated: '2026-06-19T09:39:00+09:00',
  },
  {
    id: '3',
    name: '박할머니',
    age: 76,
    avatarInitial: '박',
    status: 'alert',
    location: { address: '봉은사로 120', zoneLabel: '안전구역 이탈', inSafeZone: false, lat: 37.512, lng: 127.058 },
    battery: 22,
    heartRate: 104,
    steps: 1180,
    lastUpdated: '2026-06-19T09:30:00+09:00',
  },
  {
    id: '4',
    name: '최민준',
    age: 10,
    avatarInitial: '최',
    status: 'offline',
    location: { address: '선릉로 90', zoneLabel: '마지막 위치', inSafeZone: true, lat: 37.504, lng: 127.049 },
    battery: 0,
    heartRate: 0,
    steps: 7640,
    lastUpdated: '2026-06-19T08:55:00+09:00',
  },
];

export const alerts: AlertItem[] = [
  {
    id: 'a1',
    personId: '1',
    type: 'zone_exit',
    message: '안전구역을 이탈했습니다',
    createdAt: '2026-06-19T09:41:00+09:00',
    read: false,
  },
  {
    id: 'a2',
    personId: '3',
    type: 'zone_exit',
    message: '안전구역을 이탈했습니다',
    createdAt: '2026-06-19T09:30:00+09:00',
    read: false,
  },
  {
    id: 'a3',
    personId: '3',
    type: 'abnormal_hr',
    message: '심박수가 높습니다 (104 bpm)',
    createdAt: '2026-06-19T09:28:00+09:00',
    read: false,
  },
  {
    id: 'a4',
    personId: '4',
    type: 'offline',
    message: '기기가 오프라인 상태입니다',
    createdAt: '2026-06-19T08:55:00+09:00',
    read: true,
  },
  {
    id: 'a5',
    personId: '2',
    type: 'low_battery',
    message: '배터리가 부족합니다 (45%)',
    createdAt: '2026-06-19T08:40:00+09:00',
    read: true,
  },
];

// 홈 요약 파생값
export const summary = {
  totalCount: people.length,
  safeCount: people.filter((p) => p.status === 'safe').length,
  alertCount: people.filter((p) => p.status === 'alert').length,
};

export const unreadAlertCount = alerts.filter((a) => !a.read).length;
