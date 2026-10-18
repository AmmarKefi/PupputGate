import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthShell } from '@/components/AuthShell';
import { Segmented } from '@/components/Segmented';
import { Text } from '@/components/Text';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { palette, radius, spacing, modeAccent } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { ApiError } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { safeReturnTo } from '@/lib/returnTo';

type Role = 'CUSTOMER' | 'MERCHANT';

/** 0–4: length, mixed case, a digit, a symbol. */
function strength(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++;
  return s;
}

function StrengthMeter({ password }: { password: string }) {
  const { t } = useLocale();
  const s = useMemo(() => strength(password), [password]);
  if (!password) return null;
  const colors = ['#E5604F', '#F0A126', '#9CCB3B', '#1FB86B'];
  const label = s <= 1 ? t('auth.strengthWeak') : s <= 2 ? t('auth.strengthOk') : t('auth.strengthStrong');
  const color = colors[Math.max(0, s - 1)];
  return (
    <Animated.View entering={FadeInDown.duration(200)} style={styles.meter}>
      <View style={styles.meterBars}>
        {[0, 1, 2, 3].map((i) => (
          <Bar key={i} on={i < s} color={color} />
        ))}
      </View>
      <Text variant="meta" color={color} style={{ fontWeight: '800', marginStart: spacing.md }}>
        {label}
      </Text>
    </Animated.View>
  );
}

function Bar({ on, color }: { on: boolean; color: string }) {
  const style = useAnimatedStyle(() => ({
    backgroundColor: withTiming(on ? color : 'rgba(0,79,72,0.1)', { duration: 220 }),
  }));
  return <Animated.View style={[styles.bar, style]} />;
}

export default function Register() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string; returnTo?: string }>();
  const returnPath = safeReturnTo(params.returnTo);
  const { register } = useAuth();
  const { t, locale } = useLocale();

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [role, setRole] = useState<Role>(params.role === 'MERCHANT' ? 'MERCHANT' : 'CUSTOMER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (fullName.trim().length < 2) e.fullName = t('auth.nameTooShort');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = t('auth.invalidEmail');
    if (!/^(\+?216)?[2-9]\d{7}$/.test(phone.replace(/\s/g, ''))) e.phone = t('auth.phoneInvalid');
    if (password.length < 8) e.password = t('auth.passwordTooShort');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const clear = (k: string) => setErrors((e) => (e[k] ? { ...e, [k]: '' } : e));

  async function submit() {
    setServerError(null);
    if (!validate()) {
      haptics.warning();
      return;
    }
    setLoading(true);
    try {
      const user = await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\s/g, ''),
        password,
        role,
        locale,
      });
      haptics.success();
      if (returnPath) router.replace(returnPath as never);
      else if (user.role === 'MERCHANT') router.replace('/onboarding/business');
      else router.replace('/');
    } catch (err) {
      haptics.error();
      if (err instanceof ApiError && err.code === 'EMAIL_TAKEN') setServerError(t('auth.hasAccount'));
      else if (err instanceof ApiError && err.code === 'NETWORK') setServerError(t('error.network'));
      else setServerError(t('error.generic'));
    } finally {
      setLoading(false);
    }
  }

  const accent = role === 'CUSTOMER' ? modeAccent.APPOINTMENT : modeAccent.ORDER;

  return (
    <AuthShell title={t('auth.registerTitle')} subtitle={t('auth.registerSub')}>
      <Text variant="meta" muted style={{ marginBottom: spacing.sm }}>
        {t('auth.iAm')}
      </Text>
      <Segmented<Role>
        value={role}
        onChange={setRole}
        accent={accent}
        options={[
          { id: 'CUSTOMER', label: t('auth.asClient') },
          { id: 'MERCHANT', label: t('auth.asMerchant') },
        ]}
      />
      <View style={{ height: spacing.xl }} />

      <Input
        label={t('auth.fullName')}
        value={fullName}
        onChangeText={(v) => {
          setFullName(v);
          clear('fullName');
        }}
        error={errors.fullName}
        icon="person-outline"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <Input
        inputRef={emailRef}
        label={t('auth.email')}
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          clear('email');
        }}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        icon="mail-outline"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />
      <Input
        inputRef={phoneRef}
        label={t('auth.phone')}
        value={phone}
        onChangeText={(v) => {
          setPhone(v);
          clear('phone');
        }}
        error={errors.phone}
        hint={errors.phone ? undefined : t('auth.phoneHint')}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        icon="call-outline"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Input
        inputRef={passwordRef}
        label={t('auth.password')}
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          clear('password');
        }}
        error={errors.password}
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        icon="lock-closed-outline"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <StrengthMeter password={password} />

      {serverError ? (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.error}>
          <Ionicons name="alert-circle" size={18} color={palette.errorRed} />
          <Text variant="meta" color={palette.errorRed} style={{ marginStart: 8, flex: 1 }}>
            {serverError}
          </Text>
        </Animated.View>
      ) : null}

      <Button label={t('auth.register')} accent={accent} loading={loading} onPress={submit} style={{ marginTop: spacing.md }} />

      <Pressable
        onPress={() => router.replace((returnPath ? `/login?returnTo=${encodeURIComponent(returnPath)}` : '/login') as never)}
        style={styles.switch}
      >
        <Text variant="body" muted center>
          {t('auth.hasAccount')}{' '}
          <Text variant="body" color={palette.forest} style={{ fontWeight: '800' }}>
            {t('auth.login')}
          </Text>
        </Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  meter: { flexDirection: 'row', alignItems: 'center', marginTop: -spacing.sm, marginBottom: spacing.lg },
  meterBars: { flex: 1, flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 5, borderRadius: 3 },
  error: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBECEA', borderRadius: radius.input, padding: spacing.md, marginBottom: spacing.sm },
  switch: { paddingVertical: spacing.lg },
});
