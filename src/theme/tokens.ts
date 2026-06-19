// 디자인 토큰 — design/design-spec.md §1 그대로 반영
// 색상은 라이트 모드 기준 (다크 모드는 v2)

export const colors = {
  primary: '#1E9FE6',
  primaryPressed: '#1786C4',
  safe: '#27AE60',
  safeBg: '#D8F5E4',
  danger: '#FF3B30',
  dangerText: '#E03028',
  dangerBg: '#FDE7E6',
  infoBg: '#E3F2FD',
  bg: '#F1F4F8',
  surface: '#FFFFFF',
  textPrimary: '#1A1D29',
  textSecondary: '#8A92A6',
  border: '#E6E9EF',
  avatarBlue: '#3D9BE9',
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
