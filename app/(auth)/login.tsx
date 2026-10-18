import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthShell } from '@/components/AuthShell';
import { Text } from '@/components/Text';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { palette, radius, spacing } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { ApiError } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { safeReturnTo } from '@/lib/returnTo';

const DEMO = [
  { label: 'Client', email: 'client@pupputgate.demo' },
  { label: 'Commerçant', email: 'merchant@pupputgate.demo' },
  { label: 'Pâtisserie', email: 'pastry@pupputgate.demo' },
  { label: 'Plombier', email: 'plumber@pupputgate.demo' },
  { label: 'Artisan', email: 'artisan@pupputgate.demo' },
  { label: 'Admin', email: 'admin@pupputgate.demo' },
];
const DEMO_PASSWORD = 'PupputDemo2026!';

export default function Login() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const returnPath = safeReturnTo(returnTo);
  const { login } = useAuth();
  const { t, isRTL } = useLocale();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      haptics.warning();
      return setError(t('auth.invalidEmail'));
    }
    if (!password) {
      haptics.warning();
      return setError(t('auth.passwordTooShort'));
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      haptics.success();
      router.replace((returnPath ?? '/') as never);
    } catch (e) {
      haptics.error();
      setError(e instanceof ApiError && e.code === 'NETWORK' ? t('error.network') : t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSub')}>
      <Input
        label={t('auth.email')}
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          setError(null);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        icon="mail-outline"
        placeholder="email@exemple.tn"
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
          setError(null);
        }}
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="password"
        textContentType="password"
        icon="lock-closed-outline"
        placeholder="••••••••"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {error ? (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.error}>
          <Ionicons name="alert-circle" size={18} color={palette.errorRed} />
          <Text variant="meta" color={palette.errorRed} style={{ marginStart: 8, flex: 1 }}>
            {error}
          </Text>
        </Animated.View>
      ) : null}

      <Button label={t('auth.login')} loading={loading} onPress={submit} style={{ marginTop: spacing.sm }} />

      <Pressable onPress={() => router.replace({ pathname: '/register', params: returnPath ? { returnTo: returnPath } : {} })} style={styles.switch}>
        <Text variant="body" muted center>
          {t('auth.noAccount')}{' '}
          <Text variant="body" color={palette.forest} style={{ fontWeight: '800' }}>
            {t('auth.register')}
          </Text>
        </Text>
      </Pressable>

      <View style={styles.demoBox}>
        <View style={[styles.demoHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Ionicons name="flask-outline" size={14} color={palette.mutedText} />
          <Text variant="eyebrow" muted style={{ marginHorizontal: 6 }}>
            {t('auth.demoToggle')}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.demoRow} keyboardShouldPersistTaps="handled">
          {DEMO.map((d) => (
            <Pressable
              key={d.email}
              onPress={() => {
                setEmail(d.email);
                setPassword(DEMO_PASSWORD);
                setError(null);
                haptics.tap();
              }}
              style={({ pressed }) => [styles.demoChip, pressed && { opacity: 0.7 }]}
            >
              <Text variant="meta" color={palette.deepGreen} style={{ fontWeight: '700' }}>
                {d.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBECEA', borderRadius: radius.input, padding: spacing.md, marginBottom: spacing.md },
  switch: { paddingVertical: spacing.lg },
  demoBox: { marginTop: spacing.sm, padding: spacing.md, backgroundColor: '#F3F8F8', borderRadius: radius.card },
  demoHead: { alignItems: 'center', marginBottom: spacing.sm },
  demoRow: { gap: spacing.sm },
  demoChip: { backgroundColor: palette.white, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8, borderWidth: 1, borderColor: palette.border },
});
