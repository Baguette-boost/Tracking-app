# SafeTrack

치매 환자/고령자 보호자용 위치/상태 추적 모바일 앱 (React Native / Expo).
`design/design-spec.md` 명세를 구현한 결과물입니다.

## 실행

```bash
cd apps/safetrack
npm install        # 최초 1회
npx expo start     # QR 코드로 Expo Go 또는 시뮬레이터 실행
# npx expo start --ios / --android / --web
```

## 푸시 알림 테스트

```bash
# Firebase 콘솔에서 패키지명에 맞는 google-services.json을 다운받아 프로젝트의 루트에 배치
eas build --profile development --platform android  # 개발 빌드 생성. QR 코드로 스마트폰에 개발 빌드 앱 설치
npx expo start --dev-client                         # 서버 실행. 스마트폰으로 QR 코드를 스캔하여 접속(PC와 스마트폰은 같은 와이파이(Wi-Fi)에 연결)

# 터미널 로그에 생성된 ExponentPushToken[xxxx] 복사
# https://expo.dev/notifications에서 푸시 알림 전송
```

## 구현 범위

- **홈 화면 (HomeScreen)** — 명세 §3, 픽셀 단위로 완성
  - 고정 헤더(인사말 + 알림 벨/미확인 점)
  - 요약 카드 3개(추적 인원 / 안전 / 활성 경보) — `people` 배열에서 자동 파생
  - 경보 배너(활성 경보 1건 이상일 때만 노출) → 알림 탭 이동
  - 가족 카드 리스트(아바타 + 상태 배지 + 위치 + 메트릭 + 전화/위치 액션)
  - 전화 → `Linking.openURL('tel:...')`, 위치 → 지도 탭 포커스
- **지도 / 알림 / 내정보** — 명세 §4, 골격 수준으로 동작
  - 지도: `react-native-maps` 마커 + 인물 포커스. 지원되지 않는 환경(Expo Go/web)에서는 위치 목록 폴백
  - 알림: 시간 역순 리스트 + 전체/미확인 필터, 미확인 강조
  - 내정보: 프로필 헤더 + 메뉴 리스트

## 구조

```
src/
  theme/tokens.ts          # 디자인 토큰 (색/타이포/스페이싱/그림자)
  types.ts                 # TrackedPerson, Guardian, AlertItem
  data/mock.ts             # 샘플 데이터 (총 4명 / 안전 1 / 경보 2)
  utils/relativeTime.ts    # dayjs 상대시간 ("방금 전")
  navigation/RootTab.tsx   # 하단 4탭
  components/              # SummaryCard, AlertBanner, PersonCard, Avatar, StatusBadge
  screens/                # Home, Map, Alerts, Profile
```

## 참고

`react-native-maps`는 네이티브 모듈이라 Expo Go에서 제한될 수 있습니다.
실제 지도 동작이 필요하면 dev build(`npx expo run:ios` / `run:android`)로 실행하세요.
지도 모듈이 없으면 자동으로 위치 목록 폴백 UI로 대체됩니다.
