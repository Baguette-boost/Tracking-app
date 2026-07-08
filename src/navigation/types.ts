// 네비게이터 파라미터 타입 — design/design-spec.md §2
// 루트 스택(탭 + 등록/관리 페이지) > 하단 탭

export type RootStackParamList = {
  Main: undefined;
  PersonsManage: undefined;
  AddPerson: undefined;
  DeviceScan: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Map: { focusPersonId?: string } | undefined;
  Alerts: undefined;
  Profile: undefined;
};
