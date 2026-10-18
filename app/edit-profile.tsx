import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { GlassFooter } from '@/components/GlassFooter';
import { Input } from '@/components/Input';
import { KeyboardScroll } from '@/components/KeyboardScroll';
import { Text } from '@/components/Text';
import { palette, radius, spacing } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { api, ApiError } from '@/lib/api';
import { haptics } from '@/lib/haptics';

/** Edit name and phone. Same screen for customers and professionals. */
export default function EditProfile() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { t } = useLocale();
  const phoneRef = useRef<TextInput>(null);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const dirty = fullName.trim() !== (user?.fullName ?? '') || phone.replace(/\s/g, '') !== (user?.phone ?? '');

  async function save() {
    const e: Record<string, string> = {};
    if (fullName.trim().length < 2) e.fullName = t('auth.nameTooShort');
    if (!/^(\+?216)?[2-9]\d{7}$/.test(phone.replace(/\s/g, ''))) e.phone = t('auth.phoneInvalid');
    setErrors(e);
    if (Object.keys(e).length) {
      haptics.warning();
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const res = await api.updateProfile({ fullName: fullName.trim(), phone: phone.replace(/\s/g, '') });
      setUser(res.user);
      haptics.success();
      setSaved(true);
      setTimeout(() => router.back(), 700);
    } catch (err) {
      haptics.error();
      setServerError(err instanceof ApiError && err.code === 'NETWORK' ? t('error.network') : t('error.generic'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.headerPad}>
        <BackHeader title={t('profile.title')} />
      </View>

      <KeyboardScroll reserve={112} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(320)} style={styles.avatarWrap}>
          <LinearGradient colors={['#2CC6BB', '#0E8E86']} style={styles.avatar}>
            <Text variant="hero" color={palette.white} style={styles.avatarText}>
              {(fullName.trim()[0] ?? user?.fullName?.[0] ?? '?').toUpperCase()}
            </Text>
          </LinearGradient>
          <Text variant="meta" muted style={{ marginTop: spacing.sm }}>
            {user?.role === 'MERCHANT' ? t('account.role.MERCHANT') : user?.role === 'ADMIN' ? t('account.role.ADMIN') : t('account.role.CUSTOMER')}
          </Text>
        </Animated.View>

        <Input
          label={t('profile.name')}
          value={fullName}
          onChangeText={(v) => {
            setFullName(v);
            setSaved(false);
            setErrors((x) => ({ ...x, fullName: '' }));
          }}
          error={errors.fullName}
          icon="person-outline"
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => phoneRef.current?.focus()}
        />
        <Input
          inputRef={phoneRef}
          label={t('profile.phone')}
          value={phone}
          onChangeText={(v) => {
            setPhone(v);
            setSaved(false);
            setErrors((x) => ({ ...x, phone: '' }));
          }}
          error={errors.phone}
          keyboardType="phone-pad"
          autoComplete="tel"
          icon="call-outline"
          returnKeyType="done"
          onSubmitEditing={save}
        />

        <View style={styles.locked}>
          <Ionicons name="lock-closed" size={16} color={palette.mutedText} />
          <View style={{ flex: 1, marginStart: spacing.md }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {user?.email}
            </Text>
            <Text variant="meta" muted>
              {t('profile.emailLocked')}
            </Text>
          </View>
        </View>

        {serverError ? (
          <View style={styles.error}>
            <Ionicons name="alert-circle" size={18} color={palette.errorRed} />
            <Text variant="meta" color={palette.errorRed} style={{ marginStart: 8, flex: 1 }}>
              {serverError}
            </Text>
          </View>
        ) : null}
        <View style={{ height: 130 }} />
      </KeyboardScroll>

      <GlassFooter>
        <Button
          label={saved ? t('profile.saved') : t('profile.save')}
          icon={saved ? 'checkmark-circle' : undefined}
          disabled={!dirty && !saved}
          loading={saving}
          onPress={save}
        />
      </GlassFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.canvas },
  headerPad: { paddingHorizontal: spacing.lg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: palette.white,
    shadowColor: '#003F3A',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  avatarText: { fontSize: 40, lineHeight: 46 },
  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F6F6',
    borderRadius: radius.input,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  error: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBECEA', borderRadius: radius.input, padding: spacing.md },
});
