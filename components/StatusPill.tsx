import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Glass } from './Glass';
import { Text } from './Text';
import { palette, radius, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';

export interface ActiveItem {
  kind: 'appointment' | 'order' | 'request';
  id: string;
  label: string;
  status: string;
}

/**
 * Floating contextual status pill on Liquid Glass. Shown only when an active
 * item exists.
 */
export function StatusPill({ active, onPress }: { active: ActiveItem; onPress: () => void }) {
  const { t, isRTL } = useLocale();
  const headline =
    active.status === 'READY_FOR_PICKUP'
      ? t('activity.pillReady')
      : active.kind === 'request'
        ? t('activity.pillQuote')
        : t('activity.pillUpcoming');
  const icon =
    active.kind === 'order' ? 'bag-check-outline' : active.kind === 'request' ? 'document-text-outline' : 'calendar-outline';

  return (
    <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={styles.wrap} pointerEvents="box-none">
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${headline}: ${active.label}`}>
        <Glass radius={radius.pill} intensity={80}>
          <View style={[styles.inner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.iconCircle}>
              <Ionicons name={icon} size={17} color={palette.white} />
            </View>
            <View style={{ marginHorizontal: spacing.md, flexShrink: 1, flex: 1 }}>
              <Text variant="eyebrow" color={palette.forest}>
                {headline}
              </Text>
              <Text variant="bodyStrong" numberOfLines={1}>
                {active.label}
              </Text>
            </View>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={palette.mutedText} style={{ marginEnd: 6 }} />
          </View>
        </Glass>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg + 4, right: spacing.lg + 4, bottom: 0 },
  inner: { alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
