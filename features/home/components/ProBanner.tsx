import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { palette, radius, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/hooks/useAuth';
import { useHomeCopy } from '../copy';

/**
 * Professional entry point. Deliberately doesn't promise revenue or growth —
 * only the tools the merchant actually gets.
 */
export function ProBanner({
  onPress,
  variant = 'dark',
}: {
  onPress: () => void;
  variant?: 'dark' | 'light';
}) {
  const copy = useHomeCopy();
  const { isRTL } = useLocale();
  const { user } = useAuth();
  const dark = variant === 'dark';

  // A business owner already on the platform gains nothing from "join": their
  // workspace lives in the dashboard, not behind a second registration.
  if (user && user.role !== 'CUSTOMER') return null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${copy.proTitle} — ${copy.proCta}`}
      style={({ pressed }) => [
        styles.wrap,
        dark ? styles.dark : styles.light,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text variant="eyebrow" color={dark ? palette.sand : palette.terracotta}>
          {copy.proTitle}
        </Text>
        <Text
          variant="bodyStrong"
          color={dark ? palette.white : palette.ink}
          style={{ marginTop: spacing.xs }}
        >
          {copy.proCta}
        </Text>
        <Text
          variant="meta"
          color={dark ? 'rgba(255,255,255,0.78)' : palette.mutedText}
          style={{ marginTop: spacing.xs, lineHeight: 18 }}
        >
          {copy.proBody}
        </Text>
      </View>
      <View style={[styles.arrow, dark ? styles.arrowDark : styles.arrowLight]}>
        <Ionicons
          name={isRTL ? 'arrow-back' : 'arrow-forward'}
          size={17}
          color={dark ? palette.deepGreen : palette.forest}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.md,
  },
  dark: { backgroundColor: palette.deepGreen },
  light: { backgroundColor: palette.white, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: palette.border },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDark: { backgroundColor: palette.sand },
  arrowLight: { backgroundColor: palette.mint },
});
