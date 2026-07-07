// 데이터 모델 — design/design-spec.md §5

export type SafetyStatus = 'safe' | 'alert' | 'offline';

export interface TrackedPerson {
  id: string;
  name: string;
  age: number;
  avatarInitial: string; // 보통 name[0]
  status: SafetyStatus;
  location: {
    address: string; // "역삼로 24"
    zoneLabel: string; // "안전구역 이탈" | "주간보호센터"
    inSafeZone: boolean;
    lat: number;
    lng: number;
  };
  battery: number; // 0-100
  heartRate: number; // bpm
  steps: number;
  lastUpdated: string; // ISO; UI는 상대시간으로 표시
  deviceToken?: string; // 서버 deviceToken (해제 시 BLE로 기기 찾는 데 사용)
}

export interface Guardian {
  id: string;
  name: string; // "김보호자"
  phone: string;
}

export type AlertType = 'zone_exit' | 'low_battery' | 'abnormal_hr' | 'offline';

export interface AlertItem {
  id: string;
  personId: string;
  type: AlertType;
  message: string;
  createdAt: string; // ISO
  read: boolean;
}
