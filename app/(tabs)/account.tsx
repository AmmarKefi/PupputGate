import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { palette, radius, spacing } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { api } from '@/lib/api';
import type { Locale } from '@/locales';

export default function Account() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, locale, setLocale, isRTL } = useLocale();

  const langs: { code: Locale; label: string }[] = [
    { code: 'fr', label: t('account.langFr') },
    { code: 'en', label: t('account.langEn') },
    { code: 'ar', label: t('account.langAr') },
  ];

  function changeLocale(l: Locale) {
    setLocale(l);
    api.updateProfile({ locale: l }).catch(() => {});
  }

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
        {t('account.title')}
      </Text>

      {user ? (
      <Animated.View entering={FadeInDown.duration(320)}>
      <Card style={styles.profile} raised padded={false} onPress={() => router.push('/edit-profile')} accessibilityLabel={t('profile.edit')}>
        <LinearGradient
          pointerEvents="none"
          colors={['#22C4B9', '#0E8E86']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.profileRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.avatar}>
            <Text variant="title" color={palette.white}>
              {user?.fullName?.slice(0, 1).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={{ flex: 1, marginHorizontal: spacing.md }}>
            <Text variant="bodyStrong" color={palette.white}>{user?.fullName}</Text>
            <Text variant="meta" color="rgba(255,255,255,0.8)">{user?.email}</Text>
            <View style={styles.roleTag}>
              <Text variant="eyebrow" color={palette.white}>
                {t(`account.role.${user?.role ?? 'CUSTOMER'}` as 'account.role.CUSTOMER')}
              </Text>
            </View>
          </View>
          <View style={styles.editBadge}>
            <Ionicons name="create-outline" size={18} color={palette.white} />
          </View>
        </View>
      </Card>
      </Animated.View>
      ) : (
        <Card>
          <Text variant="bodyStrong">{t('guest.title')}</Text>
          <Text variant="meta" muted style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
            {t('guest.hint')}
          </Text>
          <Button label={t('auth.login')} onPress={() => router.push('/login')} />
          <Button
            label={t('guest.register')}
            variant="ghost"
            onPress={() => router.push('/register')}
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      )}

      {/* Language */}
      <Animated.View entering={FadeInDown.delay(70).duration(320)}>
      <Text variant="meta" muted style={styles.sectionLabel}>
        {t('account.language')}
      </Text>
      <View style={[styles.langRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {langs.map((l) => (
          <Chip key={l.code} label={l.label} selected={locale === l.code} onPress={() => changeLocale(l.code)} />
        ))}
      </View>
      </Animated.View>

      {/* Links */}
      <Animated.View entering={FadeInDown.delay(140).duration(320)}>
      <Card padded={false} style={{ marginTop: spacing.lg }}>
        {user ? (
          <Row icon="create-outline" label={t('profile.edit')} onPress={() => router.push('/edit-profile')} isRTL={isRTL} />
        ) : null}
        {user?.role === 'CUSTOMER' ? (
          <Row icon="heart-outline" label={t('account.favourites')} onPress={() => router.push('/favourites')} isRTL={isRTL} />
        ) : null}
        {user ? (
          <Row icon="notifications-outline" label={t('account.notifications')} onPress={() => router.push('/notifications')} isRTL={isRTL} />
        ) : null}
        {user?.role === 'MERCHANT' ? (
          <Row icon="storefront-outline" label={t('account.myBusinesses')} onPress={() => router.push('/activity')} isRTL={isRTL} />
        ) : null}
        {user?.role === 'ADMIN' ? (
          <Row icon="shield-outline" label={t('admin.title')} onPress={() => router.push('/admin')} isRTL={isRTL} />
        ) : null}
        <Row icon="help-circle-outline" label={t('howItWorks.title')} onPress={() => router.push('/how-it-works')} isRTL={isRTL} last />
      </Card>
      </Animated.View>

      {user ? (
        <Animated.View entering={FadeInDown.delay(210).duration(320)}>
          <Button label={t('account.signOut')} variant="ghost" onPress={logout} style={{ marginTop: spacing.xl }} icon="log-out-outline" />
        </Animated.View>
      ) : null}

      <Text variant="meta" muted center style={{ marginTop: spacing.lg }}>
        PupputGate · {t('common.demo')}
      </Text>
    </Screen>
  );
}

function Row({
  icon, label, onPress, isRTL, last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isRTL: boolean;
  last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }, !last && styles.rowDivider]} accessibilityRole="button">
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={palette.forest} />
      </View>
      <Text variant="body" style={{ flex: 1, marginHorizontal: spacing.md }}>
        {label}
      </Text>
      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={palette.mutedText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profile: { backgroundColor: '#12A79E' },
  editBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  profileRow: { alignItems: 'center', padding: spacing.xl },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  roleTag: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.sm },
  langRow: { gap: spacing.sm },
  row: { alignItems: 'center', padding: spacing.md + 2 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
  rowIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
});
