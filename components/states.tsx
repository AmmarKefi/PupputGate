import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Button } from './Button';
import { palette, radius, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';

export function LoadingState({ label }: { label?: string }) {
  const { t } = useLocale();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={palette.forest} />
      <Text variant="meta" muted style={{ marginTop: spacing.sm }}>
        {label ?? t('common.loading')}
      </Text>
    </View>
  );
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  hint,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  hint?: string;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={30} color={palette.forest} />
      </View>
      <Text variant="section" center style={{ marginBottom: spacing.xs }}>
        {title}
      </Text>
      {hint ? (
        <Text variant="body" muted center>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error?: { code?: string } | null; onRetry?: () => void }) {
  const { t } = useLocale();
  const msg = error?.code === 'NETWORK' ? t('error.network') : t('error.generic');
  return (
    <View style={styles.center}>
      <View style={[styles.iconWrap, { backgroundColor: '#F6E2DF' }]}>
        <Ionicons name="cloud-offline-outline" size={30} color={palette.errorRed} />
      </View>
      <Text variant="body" center muted style={{ marginBottom: spacing.lg }}>
        {msg}
      </Text>
      {onRetry ? <Button label={t('error.tryAgain')} variant="secondary" fullWidth={false} onPress={onRetry} /> : null}
    </View>
  );
}

/** Simple skeleton block for perceived-performance on list screens. */
export function Skeleton({ height = 90, style }: { height?: number; style?: object }) {
  const o = useSharedValue(0.55);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.skeleton, { height }, anim, style]} />;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 26,
    backgroundColor: palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  skeleton: { backgroundColor: palette.surfaceAlt, borderRadius: radius.card, marginBottom: spacing.md },
});
