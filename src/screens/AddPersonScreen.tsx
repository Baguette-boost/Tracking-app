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
      await api.persons.create({ name: name.trim(), age: ageNum, deviceId: deviceId.trim() });

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
        Alert.alert('등록 완료', '등록이 완료되었습니다.\n기기에 정상적으로 연동되었어요.', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
      } else if (bleId) {
        Alert.alert(
          '등록됨 (기기 연동 실패)',
          '서버 등록은 완료됐지만 기기에 토큰 전달을 못 했어요.\n기기를 켜고 가까이 둔 뒤 다시 시도해 주세요.',
          [{ text: '확인', onPress: () => navigation.goBack() }]
        );
      } else {
        // BLE 검색 없이 수동 입력한 경우 — 서버 등록만
        Alert.alert('등록 완료', '등록이 완료되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('등록 실패', e?.message ?? '추적 대상을 등록하지 못했습니다. 다시 시도해 주세요.');
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
        <Field label="이름">
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="예: 김순자"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="next"
          />
        </Field>

        <Field label="나이">
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
            placeholder="예: 78"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={3}
          />
        </Field>

        <Field label="기기 ID" hint="트래커를 검색해 자동 입력하거나 직접 입력하세요">
          <TextInput
            style={styles.input}
            value={deviceId}
            onChangeText={setDeviceId}
            placeholder="예: SAFETRACK 검색 또는 직접 입력"
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
            <Text style={styles.scanBtnText}>트래커 검색 (블루투스)</Text>
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
            <Text style={styles.submitText}>등록하기</Text>
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
