// SafeTrack — 보호자 위치/상태 추적 앱
// design/design-spec.md 구현

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import RootStack from './src/navigation/RootStack';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import { api } from './src/api';
import { AuthContext } from './src/state/auth';

// 포그라운드 상태일 때 알림 처리 방법 (SDK 54: banner/list 필드 사용)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// 푸시/알림 등록.
//  - 안드로이드: 원격 푸시(FCM) 토큰까지 발급
//  - iOS: 무료(Personal) 계정은 원격 푸시(aps-environment) 불가 -> 토큰 발급 생략.
//         단, 로컬 알림은 정상 동작하므로 권한만 요청.
async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // 알림 권한 요청 (로컬/원격 공통)
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    finalStatus = (await Notifications.requestPermissionsAsync()).status;
  }
  if (finalStatus !== 'granted') {
    console.log('[push] 알림 권한 거부됨');
    return;
  }

  // iOS 무료 계정: 원격 푸시 토큰 발급 생략 (로컬 알림만 사용)
  if (Platform.OS === 'ios') {
    console.log('[push] iOS 원격 푸시 비활성(무료 계정) — 로컬 알림만 사용');
    return;
  }

  // 안드로이드: 원격 푸시 토큰 발급 (실기기에서만)
  if (!Device.isDevice) return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.log('[push] projectId 없음 — app.json extra.eas.projectId 확인');
    return;
  }
  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('[push] Expo push token:', token);
    return token;
  } catch (e) {
    console.log('[push] 토큰 발급 실패:', e);
  }
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | false>(false);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token ?? ''));

    // 앱 실행 중 알림 수신 시 발생하는 리스너
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification: Notifications.Notification) => {
        setNotification(notification);
      }
    );
    // 사용자가 알림과 상호작용(ex. 탭)했을 때 발생하는 리스너
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        console.log(response);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const logout = () => {
    try {
      api.auth.logout?.();
    } catch {}
    api.auth.setToken?.(null);
    setAuthed(false);
  };

  return (
    <AuthContext.Provider value={{ logout }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {authed ? (
          <NavigationContainer>
            <RootStack />
          </NavigationContainer>
        ) : showSignup ? (
          <SignupScreen
            expoPushToken={expoPushToken}
            onSuccess={() => {
              setShowSignup(false);
              setAuthed(true);
            }}
            onCancel={() => setShowSignup(false)}
          />
        ) : (
          <LoginScreen onSuccess={() => setAuthed(true)} onSignup={() => setShowSignup(true)} />
        )}
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}
