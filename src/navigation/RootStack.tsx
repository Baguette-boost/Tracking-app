// 루트 스택 — 하단 탭(Main) + 등록/관리 페이지(모달).
// design/design-spec.md §2 (탭) + 쓰기 흐름(추적 대상 등록/관리)

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '../theme/tokens';
import AddPersonScreen from '../screens/AddPersonScreen';
import DeviceScanScreen from '../screens/DeviceScanScreen';
import PersonsManageScreen from '../screens/PersonsManageScreen';
import RootTab from './RootTab';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Main" component={RootTab} options={{ headerShown: false }} />
      <Stack.Screen
        name="PersonsManage"
        component={PersonsManageScreen}
        options={{ title: '추적 대상 관리' }}
      />
      <Stack.Screen
        name="AddPerson"
        component={AddPersonScreen}
        options={{ title: '추적 대상 등록', presentation: 'modal' }}
      />
      <Stack.Screen
        name="DeviceScan"
        component={DeviceScanScreen}
        options={{ title: '트래커 검색' }}
      />
    </Stack.Navigator>
  );
}
