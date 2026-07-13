// 좌표 -> 영어 주소 역지오코딩 (OpenStreetMap Nominatim).
// 네이티브 모듈/권한 불필요. accept-language=en 으로 영어 주소를 받아온다.
// - 좌표를 소수 4자리로 반올림해 캐시(같은 지점 반복 호출 방지, ~11m 격자).
// - Nominatim 이용약관상 과도한 호출 금지 -> 캐시 + 진행중 요청 dedupe.

import { useEffect, useState } from 'react';

type Coord = { lat: number; lng: number };

const cache = new Map<string, string>(); // key -> 영어 주소
const inflight = new Map<string, Promise<string | null>>();

const keyOf = (lat: number, lng: number) => `${lat.toFixed(4)},${lng.toFixed(4)}`;

// Nominatim address 객체에서 간결한 영어 한 줄 구성.
function formatAddress(a: Record<string, string> | undefined, displayName?: string): string | null {
  if (a) {
    const line1 = [a.house_number, a.road].filter(Boolean).join(' ');
    const area = a.suburb || a.neighbourhood || a.quarter || a.city_district || '';
    const city = a.city || a.town || a.village || a.county || '';
    const parts = [line1 || area, line1 ? area : '', city].filter(Boolean);
    // 중복 제거 후 최대 3개
    const uniq = parts.filter((p, i) => p && parts.indexOf(p) === i).slice(0, 3);
    if (uniq.length) return uniq.join(', ');
  }
  if (displayName) return displayName.split(',').slice(0, 3).join(',').trim();
  return null;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  const key = keyOf(lat, lng);
  if (cache.has(key)) return cache.get(key)!;
  if (inflight.has(key)) return inflight.get(key)!;

  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=en` +
    `&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

  const p = (async () => {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'Voost/1.0' },
      });
      if (!res.ok) return null;
      const json: any = await res.json();
      const addr = formatAddress(json?.address, json?.display_name);
      if (addr) cache.set(key, addr);
      return addr;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

// 컴포넌트용 훅: 좌표가 유효하면 영어 주소를 비동기로 로드.
export function useReverseGeocode(coord: Coord | null): string | null {
  const [addr, setAddr] = useState<string | null>(
    coord ? cache.get(keyOf(coord.lat, coord.lng)) ?? null : null
  );
  const key = coord ? keyOf(coord.lat, coord.lng) : '';
  useEffect(() => {
    if (!coord) {
      setAddr(null);
      return;
    }
    let cancelled = false;
    const cached = cache.get(key);
    if (cached) {
      setAddr(cached);
      return;
    }
    setAddr(null);
    reverseGeocode(coord.lat, coord.lng).then((a) => {
      if (!cancelled) setAddr(a);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return addr;
}
