// 추적 대상 등록 — POST /persons (api.persons.create)
// 이름/나이/기기ID 입력 → 등록 → 목록 새로고침 후 닫기.

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '../api';
import { getLastRegistration } from '../api/backend';
import { provisionPairing, setPendingPick } from '../ble/manager';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, screenPadding } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPerson'>;

export default function AddPersonScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [bleId, setBleId] = useState(''); // 스캔한 기기의 BLE 핸들 (프로비저닝용)
  const [submitting, setSubmitting] = useState(false);

  const ageNum = Number(age);
  const valid =
    name.trim().length > 0 &&
    age.trim().length > 0 &&
    Number.isFinite(ageNum) &&
    ageNum > 0 &&
    ageNum < 120 &&
    deviceId.trim().length > 0;

  const handleSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      // 1) 서버 등록
      await api.persons.create({
        name: name.trim(),
        age: ageNum,
        deviceId: deviceId.trim(),
        phone: phone.trim() || undefined,
      });

      // 2) 기기에 BLE로 personId/deviceToken 전달 (통신 확인)
      const reg = getLastRegistration();
      let provisioned = false;
      if (bleId && reg) {
        try {
          await provisionPairing(bleId, reg.personId, reg.deviceToken);
          provisioned = true;
        } catch (e) {
          provisioned = false;
        }
      }

      // 3) 결과 안내
      if (provisioned) {
        Alert.alert('Registration Complete', 'Registration complete.\nThe device was paired successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else if (bleId) {
        Alert.alert(
          'Registered (Device Pairing Failed)',
          'Registered on the server, but the token could not be delivered to the device.\nTurn the device on, keep it nearby, and try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // BLE 검색 없이 수동 입력한 경우 — 서버 등록만
        Alert.alert('Registration Complete', 'Registration complete.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Registration Failed', e?.message ?? 'Could not add the tracked person. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Field label="Name">
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Jane Doe"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="next"
          />
        </Field>

        <Field label="Age">
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 78"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={3}
          />
        </Field>

        <Field label="Phone" hint="Optional — used for the Call button">
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/[^0-9+\-\s]/g, ''))}
            placeholder="e.g. 010-1234-5678"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            maxLength={20}
          />
        </Field>

        <Field label="Device ID" hint="Scan for a tracker to fill this in automatically, or enter it manually">
          <TextInput
            style={styles.input}
            value={deviceId}
            onChangeText={setDeviceId}
            placeholder="e.g. scan for SAFETRACK or enter manually"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
          />
          <Pressable
            style={styles.scanBtn}
            onPress={() => {
              setPendingPick((t) => {
                setDeviceId(t.deviceId);
                setBleId(t.id);
              });
              navigation.navigate('DeviceScan');
            }}
            accessibilityRole="button"
          >
            <Ionicons name="bluetooth" size={18} color={colors.primary} />
            <Text style={styles.scanBtnText}>Scan for Tracker (Bluetooth)</Text>
          </Pressable>
        </Field>

        <Pressable
          style={[styles.submit, (!valid || submitting) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!valid || submitting}
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Add</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  body: { padding: screenPadding, gap: 20 },
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  hint: { fontSize: 12, color: colors.textSecondary },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  submit: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitDisabled: { backgroundColor: colors.border },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    height: 44,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  scanBtnText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
