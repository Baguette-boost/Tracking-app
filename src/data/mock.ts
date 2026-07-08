// 샘플 목업 데이터 — design/design-spec.md §5.1
// 기준: 총 4명 / 안전 1명 / 경보 2건 (+ 오프라인 1명)

import { AlertItem, Guardian, TrackedPerson } from '../types';

export const guardian: Guardian = {
  id: 'g1',
  name: 'Alex Kim',
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
    name: 'Mary Kim',
    age: 78,
    avatarInitial: 'M',
    status: 'alert',
    location: { address: '24 Yeoksam-ro', zoneLabel: 'Left Safe Zone', inSafeZone: false, lat: 37.501, lng: 127.036 },
    battery: 78,
    heartRate: 92,
    steps: 2140,
    lastUpdated: '2026-06-19T09:41:00+09:00',
  },
  {
    id: '2',
    name: 'Susan Lee',
    age: 81,
    avatarInitial: 'S',
    status: 'safe',
    location: { address: '88 Teheran-ro', zoneLabel: 'Day Care Center', inSafeZone: true, lat: 37.503, lng: 127.044 },
    battery: 45,
    heartRate: 88,
    steps: 1320,
    lastUpdated: '2026-06-19T09:39:00+09:00',
  },
  {
    id: '3',
    name: 'Frank Park',
    age: 76,
    avatarInitial: 'F',
    status: 'alert',
    location: { address: '120 Bongeunsa-ro', zoneLabel: 'Left Safe Zone', inSafeZone: false, lat: 37.512, lng: 127.058 },
    battery: 22,
    heartRate: 104,
    steps: 980,
    lastUpdated: '2026-06-19T09:30:00+09:00',
  },
  {
    id: '4',
    name: 'Henry Choi',
    age: 83,
    avatarInitial: 'H',
    status: 'offline',
    location: { address: '90 Seolleung-ro', zoneLabel: 'Last Known Location', inSafeZone: true, lat: 37.504, lng: 127.049 },
    battery: 0,
    heartRate: 0,
    steps: 640,
    lastUpdated: '2026-06-19T08:55:00+09:00',
  },
];

export const alerts: AlertItem[] = [
  {
    id: 'a1',
    personId: '1',
    type: 'zone_exit',
    message: 'Left the safe zone',
    createdAt: '2026-06-19T09:41:00+09:00',
    read: false,
  },
  {
    id: 'a2',
    personId: '3',
    type: 'zone_exit',
    message: 'Left the safe zone',
    createdAt: '2026-06-19T09:30:00+09:00',
    read: false,
  },
  {
    id: 'a3',
    personId: '3',
    type: 'abnormal_hr',
    message: 'Heart rate is high (104 bpm)',
    createdAt: '2026-06-19T09:28:00+09:00',
    read: false,
  },
  {
    id: 'a4',
    personId: '4',
    type: 'offline',
    message: 'Device is offline',
    createdAt: '2026-06-19T08:55:00+09:00',
    read: true,
  },
  {
    id: 'a5',
    personId: '2',
    type: 'low_battery',
    message: 'Battery is low (45%)',
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
