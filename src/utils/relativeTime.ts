// 상대시간 표시 — design/design-spec.md §6.1
// ISO 문자열 → "just now", "2m ago" 등. 실제 현재 시각 기준.

import dayjs from 'dayjs';

export function fromNow(iso: string): string {
  const t = dayjs(iso);
  if (!t.isValid()) return '';
  // 실제 현재 시각 기준(음수=미래/시계오차는 just now 로 클램프)
  const diffSec = dayjs().diff(t, 'second');
  if (diffSec < 60) return 'just now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
