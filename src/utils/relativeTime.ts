// 상대시간 표시 — design/design-spec.md §6.1
// dayjs + relativeTime 플러그인. lastUpdated(ISO) → "방금 전", "2분 전"

import dayjs from 'dayjs';

// 현재 시각은 목업 기준 시점으로 고정(샘플 데이터가 2026-06-19 오전이므로)
const NOW = '2026-06-19T09:42:00+09:00';

export function fromNow(iso: string): string {
  const diffSec = dayjs(NOW).diff(dayjs(iso), 'second');
  if (diffSec < 60) return 'just now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
