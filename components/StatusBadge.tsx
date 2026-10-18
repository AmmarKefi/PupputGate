import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { palette, radius, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import type { TranslationKey } from '@/locales';

type AnyStatus =
  | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'NO_SHOW'
  | 'PREPARING' | 'READY_FOR_PICKUP'
  | 'SUBMITTED' | 'UNDER_REVIEW' | 'QUOTE_SENT' | 'ACCEPTED' | 'IN_PROGRESS' | 'DECLINED'
  | 'APPROVED' | 'SUSPENDED';

const TONE: Record<AnyStatus, 'good' | 'wait' | 'bad'> = {
  PENDING: 'wait', CONFIRMED: 'good', COMPLETED: 'good', REJECTED: 'bad', CANCELLED: 'bad', NO_SHOW: 'bad',
  PREPARING: 'wait', READY_FOR_PICKUP: 'good',
  SUBMITTED: 'wait', UNDER_REVIEW: 'wait', QUOTE_SENT: 'good', ACCEPTED: 'good', IN_PROGRESS: 'good', DECLINED: 'bad',
  APPROVED: 'good', SUSPENDED: 'bad',
};

const COLORS = {
  good: { bg: palette.mint, fg: palette.deepGreen, dot: palette.forest },
  wait: { bg: '#F6ECD9', fg: '#8A5A2B', dot: palette.sand },
  bad: { bg: '#F6E2DF', fg: palette.errorRed, dot: palette.errorRed },
};

// A label accompanies the colour so status is never conveyed by colour alone.
export function StatusBadge({ status }: { status: AnyStatus }) {
  const { t } = useLocale();
  const tone = COLORS[TONE[status]];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <View style={[styles.dot, { backgroundColor: tone.dot }]} />
      <Text variant="meta" color={tone.fg}>
        {t(`status.${status}` as TranslationKey)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
