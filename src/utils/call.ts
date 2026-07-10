// 전화 걸기 — tel: 스킴. 번호가 없으면 안내.
import { Alert, Linking } from 'react-native';

export function callPerson(phone?: string, name?: string): void {
  const num = (phone ?? '').replace(/[^0-9+]/g, '');
  if (!num) {
    Alert.alert('No phone number', `${name ?? 'This person'} has no phone number saved.`);
    return;
  }
  Linking.openURL(`tel:${num}`).catch(() =>
    Alert.alert('Cannot place call', 'Calling is not available on this device.')
  );
}
