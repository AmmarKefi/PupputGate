import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Text } from './Text';
import { Button } from './Button';
import { palette, radius, spacing } from '@/theme/tokens';
import { haptics } from '@/lib/haptics';

const CONFETTI = ['#18B3AA', '#FFD85A', '#F2542D', '#704A94', '#24628A', '#A94D24'];
const PIECES = Array.from({ length: 14 }, (_, i) => ({
  angle: (i / 14) * Math.PI * 2 + (i % 2) * 0.2,
  dist: 90 + (i % 3) * 26,
  size: 7 + (i % 3) * 2,
  color: CONFETTI[i % CONFETTI.length],
}));

function Piece({ p, progress }: { p: (typeof PIECES)[number]; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, progress.value - 0.55) / 0.45,
    transform: [
      { translateX: Math.cos(p.angle) * p.dist * progress.value },
      { translateY: Math.sin(p.angle) * p.dist * progress.value + progress.value * progress.value * 24 },
      { scale: 1 - progress.value * 0.4 },
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.piece,
        { width: p.size, height: p.size, borderRadius: p.size / 2, backgroundColor: p.color },
        style,
      ]}
    />
  );
}

export interface SuccessRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

/**
 * Shared confirmation screen for orders, bookings and quote requests: a
 * spring-in check with a confetti burst, a recap card, and the next actions.
 */
export function SuccessView({
  accent,
  title,
  hint,
  rows,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  accent: string;
  title: string;
  hint?: string;
  rows?: SuccessRow[];
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const pop = useSharedValue(0);
  const ring = useSharedValue(0);
  const burst = useSharedValue(0);

  useEffect(() => {
    haptics.success();
    pop.value = withSequence(withTiming(0, { duration: 0 }), withSpring(1, { damping: 9, stiffness: 150 }));
    ring.value = withDelay(120, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
    burst.value = withDelay(180, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [pop, ring, burst]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }], opacity: Math.min(1, pop.value * 2) }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - ring.value),
    transform: [{ scale: 0.8 + ring.value * 1.1 }],
  }));

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.wrap}>
        <View style={styles.stage}>
          <Animated.View style={[styles.ring, { borderColor: accent }, ringStyle]} />
          {PIECES.map((p, i) => (
            <Piece key={i} p={p} progress={burst} />
          ))}
          <Animated.View style={[styles.badge, { backgroundColor: accent }, iconStyle]}>
            <Ionicons name="checkmark" size={56} color={palette.white} />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(260).duration(420)} style={styles.center}>
          <Text variant="title" center>
            {title}
          </Text>
          {hint ? (
            <Text variant="body" muted center style={{ marginTop: spacing.sm }}>
              {hint}
            </Text>
          ) : null}
        </Animated.View>

        {rows && rows.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(380).duration(420)} style={styles.recap}>
            {rows.map((r, i) => (
              <View key={i} style={[styles.row, i > 0 && styles.rowDivider]}>
                <View style={[styles.rowIcon, { backgroundColor: `${accent}18` }]}>
                  <Ionicons name={r.icon} size={16} color={accent} />
                </View>
                <Text variant="meta" muted style={{ marginStart: spacing.md, flex: 1 }}>
                  {r.label}
                </Text>
                <Text variant="bodyStrong" numberOfLines={1} style={{ maxWidth: '55%' }}>
                  {r.value}
                </Text>
              </View>
            ))}
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(500).duration(420)} style={styles.actions}>
          <Button label={primaryLabel} accent={accent} onPress={onPrimary} />
          {secondaryLabel && onSecondary ? (
            <Button label={secondaryLabel} variant="ghost" onPress={onSecondary} style={{ marginTop: spacing.sm }} />
          ) : null}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.canvas },
  wrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  stage: { height: 170, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 3 },
  badge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#003F3A',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  piece: { position: 'absolute' },
  center: { alignItems: 'center', marginTop: spacing.md },
  recap: {
    marginTop: spacing.xl,
    backgroundColor: palette.white,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    shadowColor: '#003F3A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
  rowIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  actions: { marginTop: spacing.xl },
});
