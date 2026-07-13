// 로그인 화면 — 전화번호/비밀번호로 백엔드 로그인(POST /auth/login) 후 토큰 발급.
// 성공 시 onSuccess() 호출 -> 앱이 홈으로 진입.

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '../api';
import { colors, radius, screenPadding } from '../theme/tokens';

export default function LoginScreen({
  onSuccess,
  onSignup,
}: {
  onSuccess: () => void;
  onSignup?: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = phone.trim().length > 0 && password.length > 0;

  // 숫자만 입력받아도 서버가 원하는 010-0000-0000 형식으로 변환
  const formatPhone = (raw: string): string => {
    const d = raw.replace(/\D/g, '');
    if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    return raw.trim();
  };

  const handleLogin = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.auth.login({ phone: formatPhone(phone), password });
      onSuccess();
    } catch (e: any) {
      setError(`Log in failed — ${e?.message ?? 'Check your phone number and password.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.body}>
        <View style={styles.brand}>
          <Ionicons name="shield-checkmark" size={44} color={colors.primary} />
          <Text style={styles.title}>Voost</Text>
          <Text style={styles.sub}>Guardian Log In</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="010-0000-0000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.submit, (!valid || submitting) && styles.submitDisabled]}
          onPress={handleLogin}
          disabled={!valid || submitting}
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Log In</Text>
          )}
        </Pressable>

        {onSignup && (
          <Pressable onPress={onSignup} style={styles.link} accessibilityRole="button">
            <Text style={styles.linkText}>Don’t have an account? Sign Up</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, justifyContent: 'center', padding: screenPadding, gap: 18 },
  brand: { alignItems: 'center', marginBottom: 12, gap: 6 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  sub: { fontSize: 14, color: colors.textSecondary },
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
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
