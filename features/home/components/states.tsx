import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { ErrorState, Skeleton } from '@/components/states';
import { palette, radius, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { useHomeCopy } from '../copy';
import type { ApiError } from '@/lib/api';

/** Neutral first paint so a slow API never shows a half-composed hero. */
export function HomeLoading() {
  return (
    <View style={styles.loading}>
      <Skeleton height={32} style={{ width: '70%', marginBottom: spacing.lg }} />
      <Skeleton height={18} style={{ width: '90%' }} />
      <Skeleton height={18} style={{ width: '60%' }} />
      <Skeleton height={56} style={{ marginTop: spacing.xl }} />
      <View style={styles.loadingRow}>
        <Skeleton height={150} style={{ flex: 1 }} />
        <Skeleton height={150} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

export function HomeError({ error, onRetry }: { error?: ApiError | null; onRetry: () => void }) {
  return <ErrorState error={error} onRetry={onRetry} />;
}

/** Honest empty state: nothing is invented to fill the page. */
export function EmptyHome({ guest }: { guest: boolean }) {
  const router = useRouter();
  const copy = useHomeCopy();
  const { t } = useLocale();
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="storefront-outline" size={28} color={palette.forest} />
      </View>
      <Text variant="section" center>
        {copy.emptyTitle}
      </Text>
      <Text variant="body" muted center style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
        {copy.emptyBody}
      </Text>
      <Button label={t('welcome.exploreCta')} onPress={() => router.push('/explore')} />
      <View style={{ height: spacing.sm }} />
      <Button
        label={guest ? copy.emptyProCta : copy.proCta}
        variant="secondary"
        onPress={() => router.push(guest ? { pathname: '/register', params: { role: 'MERCHANT' } } : '/onboarding/business')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { padding: spacing.xl, paddingTop: spacing.xxxl },
  loadingRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.card,
    backgroundColor: palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
});
