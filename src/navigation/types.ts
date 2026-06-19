// 탭 네비게이터 파라미터 타입 — design/design-spec.md §2

export type RootTabParamList = {
  홈: undefined;
  지도: { focusPersonId?: string } | undefined;
  알림: undefined;
  내정보: undefined;
};
