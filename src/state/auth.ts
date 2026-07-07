// 앱 전역 인증 컨텍스트 — 로그아웃 등 인증 상태 제어를 화면에서 호출.
import React from 'react';

export type AuthContextValue = {
  logout: () => void;
};

export const AuthContext = React.createContext<AuthContextValue>({
  logout: () => {},
});
