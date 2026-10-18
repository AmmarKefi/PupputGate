import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { modeAccent, radius, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import type { CommerceMode } from '@/types';

const ICON: Record<CommerceMode, keyof typeof Ionicons.glyphMap> = {
  APPOINTMENT: 'calendar-outline',
  ORDER: 'bag-handle-outline',
  SHOWCASE: 'diamond-outline',
  QUOTE: 'document-text-outline',
};

export function ModeBadge({ mode, small }: { mode: CommerceMode; small?: boolean }) {
  const { t, isRTL } = useLocale();
  const accent = modeAccent[mode];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${accent}1A`, flexDirection: isRTL ? 'row-reverse' : 'row' },
        small && styles.small,
      ]}
    >
      <Ionicons name={ICON[mode]} size={small ? 12 : 14} color={accent} style={{ marginHorizontal: 3 }} />
      <Text variant="eyebrow" color={accent}>
        {t(`mode.${mode}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  small: { paddingVertical: 2 },
});
