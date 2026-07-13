// 디자인 토큰 — design/design-spec.md §1 반영
// 색상은 라이트 모드 기준 (다크 모드는 v2)
//
// 접근성(WCAG 2.1 AA · SC 1.4.3 명도 대비): 텍스트/아이콘으로 쓰이는 색은
// 배경 대비 4.5:1 이상을 만족하도록 어둡게 보정했다. 각 값 옆의 비율은
// 실제 사용 배경에서 측정한 최소 대비값이다. (border는 장식용 구분선이라 예외)
export const colors = {
  primary: '#0B72AD', // 흰 글씨 버튼 5.22:1, 링크/아이콘 5.22:1 (기존 2.93 ✗)
  primaryPressed: '#095F91', // 6.87:1
  safe: '#0F7D3E', // 아이콘/텍스트 5.22:1, safeBg 배지 4.50:1 (기존 2.87 ✗)
  safeBg: '#D8F5E4',
  danger: '#CE2018', // 아이콘/텍스트 5.46:1, 흰 글씨 버튼 5.46:1 (기존 3.55 ✗)
  dangerText: '#C4241C', // dangerBg 배지 4.91:1 (기존 3.84 ✗)
  dangerBg: '#FDE7E6',
  infoBg: '#E3F2FD',
  bg: '#F1F4F8',
  surface: '#FFFFFF',
  textPrimary: '#1A1D29', // 16.78:1
  textSecondary: '#5E6675', // 흰 배경 5.78:1 / bg 5.24:1 (기존 3.11/2.82 ✗)
  border: '#E6E9EF', // 장식용 구분선 — 텍스트 아님, 대비 요건 예외
  avatarBlue: '#1F7BC0', // 흰 이니셜 4.51:1 (기존 2.97 ✗)
} as const;

// 타이포그래피 — 시스템 폰트 사용 (iOS SF / Android Roboto)
export const typography = {
  display: { fontSize: 27, fontWeight: '800' as const },
  title: { fontSize: 21, fontWeight: '700' as const },
  h2: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
} as const;

// 간격 스케일 (px)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

// 화면 좌우 패딩
export const screenPadding = 20;

// 모서리 반경
export const radius = {
  card: 16,
  summary: 20,
  button: 12,
  pill: 999,
} as const;

// 카드 그림자 — 0 2 8 rgba(20,30,50,0.06)
export const shadow = {
  shadowColor: '#141E32',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;
