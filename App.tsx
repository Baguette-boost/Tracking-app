// SafeTrack — 보호자 위치/상태 추적 앱
// design/design-spec.md 구현

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef, React } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootTab from './src/navigation/RootTab';
import { Text, View, Button, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// 포그라운드 상태일 때 알림 처리 방법
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

// 푸시 토큰 발급 함수
async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }
        // EAS 프로젝트 ID를 사용해 토큰 가져옴
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
            alert('Project Id not found. Make sure you have configured it in app.json');
            return;
        }
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log(token);
    } else {
        alert('Must use physical device for Push Notifications');
    }

    return token;
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | false>(false);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
      registerForPushNotificationsAsync().then(token => setExpoPushToken(token ?? ''));

//       // 앱 실행 중 알림 수신 시 발생하는 리스너
//       notificationListener.current = Notifications.addNotifications.addNotificationReceivedListener(notification => {
//           setNotification(notification);
//       });
//       // 사용자가 알림과 상호작용(ex. 탭)했을 때 발생하는 리스너
//       responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
//           console.log(response);
//           });
//   return () => {
//             if (notificationListener.current) {
//               Notifications.removeNotificationSubscription(notificationListener.current);
//             }
//             if (responseListener.current) {
//               Notifications.removeNotificationSubscription(responseListener.current);
//             }
//           };
        }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootTab />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
