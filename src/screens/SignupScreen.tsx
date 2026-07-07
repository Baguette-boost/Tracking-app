// 회원가입 화면 — POST /auth/signup 연결.
// 가입 성공 시 서버가 토큰을 돌려주므로 곧바로 로그인 상태로 진입(onSuccess).

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { colors, radius, screenPadding } from '../theme/tokens';

export default function SignupScreen({
  onSuccess,
  onCancel,
  expoPushToken,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  expoPushToken?: string;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    password.length >= 8 &&
    password === password2;

  // 숫자만 입력받아도 서버가 원하는 010-0000-0000 형식으로 변환 (로그인과 동일)
  const formatPhone = (raw: string): string => {
    const d = raw.replace(/\D/g, '');
    if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    return raw.trim();
  };

  const handleSignup = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.auth.register({
        name: name.trim(),
        phone: formatPhone(phone),
        password,
        expoToken: expoPushToken,
      });
      onSuccess(); // 서버가 토큰을 반환 -> 바로 로그인 상태로 진입
    } catch (e: any) {
      setError(`회원가입 실패 — ${e?.message ?? '잠시 후 다시 시도해 주세요.'}`);
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
        <View style={styles.brand}>
          <Ionicons name="person-add" size={40} color={colors.primary} />
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.sub}>보호자 계정 만들기</Text>
        </View>

        <Field label="이름">
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="예: 김보호자"
            placeholderTextColor={colors.textSecondary}
          />
        </Field>

        <Field label="전화번호">
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ''))}
            placeholder="01012345678"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </Field>

        <Field label="비밀번호" hint="8자 이상">
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
          />
        </Field>

        <Field label="비밀번호 확인">
          <TextInput
            style={styles.input}
            value={password2}
            onChangeText={setPassword2}
            placeholder="비밀번호 다시 입력"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
          />
          {password2.length > 0 && password !== password2 && (
            <Text style={styles.error}>비밀번호가 일치하지 않습니다.</Text>
          )}
        </Field>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.submit, (!valid || submitting) && styles.submitDisabled]}
          onPress={handleSignup}
          disabled={!valid || submitting}
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>회원가입</Text>
          )}
        </Pressable>

        <Pressable onPress={onCancel} style={styles.link} accessibilityRole="button">
          <Text style={styles.linkText}>이미 계정이 있어요 — 로그인</Text>
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
      <Text style={styles.label}>
        {label}
        {hint ? <Text style={styles.hint}>  {hint}</Text> : null}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  body: { padding: screenPadding, gap: 16, paddingTop: 40 },
  brand: { alignItems: 'center', marginBottom: 8, gap: 6 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  sub: { fontSize: 14, color: colors.textSecondary },
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  hint: { fontSize: 12, fontWeight: '400', color: colors.textSecondary },
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
  error: { color: colors.dangerText, fontSize: 13 },
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
  link: { alignItems: 'center', paddingVertical: 12 },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
