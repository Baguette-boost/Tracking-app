// 하단 4탭 네비게이터 — design/design-spec.md §2, §3.6
// 홈 / 지도 / 알림 / 내정보. 활성=primary, 알림 탭에 미확인 수 배지.

import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { useEffect } from 'react';
import { colors } from '../theme/tokens';
import { refreshUnread, useUnread } from '../state/unread';
import AlertsScreen from '../screens/AlertsScreen';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const icons: Record<keyof RootTabParamList, keyof typeof Feather.glyphMap> = {
  Home: 'home',
  Map: 'map',
  Alerts: 'bell',
  Profile: 'user',
};

export default function RootTab() {
  const unreadAlertCount = useUnread();
  useEffect(() => {
    refreshUnread();
  }, []);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => (
          <Feather name={icons[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ tabBarBadge: unreadAlertCount > 0 ? unreadAlertCount : undefined }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
