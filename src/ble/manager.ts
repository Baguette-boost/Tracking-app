// BLE 페어링 — 근처 SafeTrack 트래커(ESP32) 스캔/식별.
// 펌웨어(feature/ble-pairing)와 UUID·이름 규칙을 맞춤:
//   광고 이름: "SAFETRACK-<deviceId>"  (deviceId = ESP32 eFuse MAC 12자리 HEX)
//   서비스/특성 UUID는 프로비저닝(선택) 시 사용.

import { BleError, BleManager, Device } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

export const SVC_UUID = '6b1d0001-2c1a-4f9a-9b7e-5afe11ac0001';
export const CHR_ID = '6b1d0002-2c1a-4f9a-9b7e-5afe11ac0002'; // deviceId (READ)
export const CHR_WIFI = '6b1d0003-2c1a-4f9a-9b7e-5afe11ac0003'; // WiFi 프로비저닝 (WRITE)
export const CHR_PAIR = '6b1d0004-2c1a-4f9a-9b7e-5afe11ac0004'; // personId\ttoken (WRITE)
export const NAME_PREFIX = 'SAFETRACK-';

let _manager: BleManager | null = null;

/** 앱 전역 단일 BleManager */
export function bleManager(): BleManager {
  if (!_manager) _manager = new BleManager();
  return _manager;
}

/** 광고 이름에서 deviceId 추출 (SAFETRACK-XXXX -> XXXX) */
export function deviceIdFromName(name?: string | null): string | null {
  if (!name || !name.startsWith(NAME_PREFIX)) return null;
  const id = name.slice(NAME_PREFIX.length).trim();
  return id.length ? id : null;
}

/** Android 런타임 권한 요청 (iOS는 Info.plist=config plugin이 처리) */
export async function ensureBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (typeof Platform.Version === 'number' && Platform.Version >= 31) {
    const res = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return Object.values(res).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
  }
  // Android 11 이하: 위치 권한 필요
  const res = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return res === PermissionsAndroid.RESULTS.GRANTED;
}

export type ScannedTracker = {
  id: string; // BLE 주소(플랫폼 핸들) — 연결 시 사용
  deviceId: string; // SAFETRACK deviceId
  name: string;
  rssi: number;
};

// 등록 화면 <-> 검색 화면 간 선택 결과 전달용 홀더.
// (네비게이션 파라미터에 함수를 넣으면 "Non-serializable" 경고가 나므로 홀더로 우회)
let pendingPick: ((t: ScannedTracker) => void) | null = null;
export function setPendingPick(fn: (t: ScannedTracker) => void) {
  pendingPick = fn;
}
export function consumePendingPick(t: ScannedTracker) {
  const fn = pendingPick;
  pendingPick = null;
  fn?.(t);
}

// 문자열 -> base64 (react-native-ble-plx write 는 base64 요구). UTF-8 처리.
function base64FromString(str: string): string {
  const B = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
    out += B[b0 >> 2];
    out += B[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += i + 1 < bytes.length ? B[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)] : '=';
    out += i + 2 < bytes.length ? B[b2 & 63] : '=';
  }
  return out;
}

/**
 * 등록 후 기기에 personId+deviceToken 을 BLE로 전달(프로비저닝).
 * write(with response) 성공 = 기기가 값을 받아 저장했다는 확인.
 * @param bleId  스캔 때 얻은 BLE 핸들(ScannedTracker.id)
 */
export async function provisionPairing(
  bleId: string,
  personId: number | string,
  deviceToken: string,
): Promise<void> {
  const ok = await ensureBlePermissions();
  if (!ok) throw new Error('블루투스 권한이 없습니다.');
  const mgr = bleManager();
  const dev = await mgr.connectToDevice(bleId, { timeout: 8000 });
  try {
    await dev.discoverAllServicesAndCharacteristics();
    const value = base64FromString(`${personId}\t${deviceToken}`);
    await dev.writeCharacteristicWithResponseForService(SVC_UUID, CHR_PAIR, value);
  } finally {
    try { await mgr.cancelDeviceConnection(bleId); } catch {}
  }
}

/**
 * 해제(unpair): deviceId(SAFETRACK-<deviceId>) 기기를 스캔해 찾아 연결 후
 * CHR_PAIR 에 "CLEAR" write -> 기기의 저장 토큰 삭제(전송 중단).
 * write(with response) 성공 = 기기가 삭제 명령을 받았다는 확인.
 */
export async function unpairDevice(deviceId: string): Promise<void> {
  const ok = await ensureBlePermissions();
  if (!ok) throw new Error('블루투스 권한이 없습니다.');
  const mgr = bleManager();
  const state = await mgr.state();
  if (state !== 'PoweredOn') throw new Error('블루투스를 켜주세요.');

  // 스캔으로 해당 deviceId 기기의 BLE 핸들 찾기 (최대 8초)
  const target: Device = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      mgr.stopDeviceScan();
      reject(new Error('기기를 찾지 못했습니다 (꺼짐/멀리 있음)'));
    }, 8000);
    mgr.startDeviceScan(null, { allowDuplicates: false }, (err: BleError | null, dev: Device | null) => {
      if (err) { clearTimeout(timer); mgr.stopDeviceScan(); reject(err); return; }
      const name = dev?.name ?? dev?.localName ?? null;
      if (dev && deviceIdFromName(name) === deviceId) {
        clearTimeout(timer);
        mgr.stopDeviceScan();
        resolve(dev);
      }
    });
  });

  const dev = await mgr.connectToDevice(target.id, { timeout: 8000 });
  try {
    await dev.discoverAllServicesAndCharacteristics();
    await dev.writeCharacteristicWithResponseForService(SVC_UUID, CHR_PAIR, base64FromString('CLEAR'));
  } finally {
    try { await mgr.cancelDeviceConnection(target.id); } catch {}
  }
}

/**
 * SafeTrack 트래커 스캔 시작. 발견 시 onFound 콜백.
 * 반환된 함수를 호출하면 스캔 중지.
 */
export async function scanTrackers(
  onFound: (t: ScannedTracker) => void,
  onError: (msg: string) => void,
): Promise<() => void> {
  const ok = await ensureBlePermissions();
  if (!ok) {
    onError('블루투스 권한이 필요합니다. 설정에서 허용해 주세요.');
    return () => {};
  }
  const mgr = bleManager();
  const state = await mgr.state();
  if (state !== 'PoweredOn') {
    onError('블루투스가 꺼져 있어요. 켠 뒤 다시 시도해 주세요.');
    return () => {};
  }
  mgr.startDeviceScan(null, { allowDuplicates: false }, (err: BleError | null, device: Device | null) => {
    if (err) {
      onError(err.message);
      return;
    }
    const name = device?.name ?? device?.localName ?? null;
    const deviceId = deviceIdFromName(name);
    if (device && deviceId) {
      onFound({ id: device.id, deviceId, name: name!, rssi: device.rssi ?? 0 });
    }
  });
  return () => mgr.stopDeviceScan();
}
