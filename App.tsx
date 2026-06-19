// SafeTrack — 보호자 위치/상태 추적 앱
// design/design-spec.md 구현

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootTab from './src/navigation/RootTab';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootTab />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
