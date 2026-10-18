import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  Extrapolation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { palette, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Ctx {
  /** Morph the Home search field into the Explore screen. */
  start: (from: Rect, term?: string) => void;
}
const SearchTransitionContext = createContext<Ctx>({ start: () => {} });
export const useSearchTransition = () => useContext(SearchTransitionContext);

/**
 * Home → Explore search transition, drawn above the tabs so it survives the
 * screen change:
 *   1. the white field stretches (small elastic overshoot) from the header to
 *      exactly where Explore's own search field sits,
 *   2. a soft veil fades in behind it, carrying the "Explorer" title,
 *   3. Explore is pushed underneath mid-way, then the overlay dissolves into
 *      the real screen, so nothing jumps.
 * Everything animated runs on the UI thread.
 */
export function SearchTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  // Full screen incl. the system navigation bar (window height excludes it).
  const H = Dimensions.get('screen').height;
  const { t } = useLocale();

  const [active, setActive] = useState(false);
  const p = useSharedValue(0);
  const out = useSharedValue(0);
  const box = useSharedValue<Rect>({ x: 0, y: 0, w: 0, h: 0 });

  // Where Explore's own search field sits (header padding + title + gap).
  const target: Rect = useMemo(
    () => ({ x: spacing.xl, y: insets.top + spacing.sm + 34 + spacing.md, w: W - spacing.xl * 2, h: 54 }),
    [insets.top, W],
  );

  const finish = useCallback(() => {
    setActive(false);
    p.value = 0;
    out.value = 0;
  }, [p, out]);

  const start = useCallback(
    (from: Rect, term?: string) => {
      box.value = from;
      p.value = 0;
      out.value = 0;
      setActive(true);
      p.value = withTiming(1, { duration: 300, easing: Easing.bezier(0.3, 1.2, 0.5, 1) });
      // Push Explore while the veil is already opaque enough to hide the swap.
      setTimeout(() => {
        router.push({
          pathname: '/explore',
          params: { focus: String(Date.now()), ...(term ? { q: term } : {}) },
        });
      }, 170);
      out.value = withDelay(
        460,
        withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }, (done) => {
          if (done) runOnJS(finish)();
        }),
      );
    },
    [box, p, out, router, finish],
  );

  const field = useAnimatedStyle(() => {
    const b = box.value;
    const q = p.value;
    return {
      opacity: 1 - out.value,
      left: b.x + (target.x - b.x) * q,
      top: b.y + (target.y - b.y) * q,
      width: b.w + (target.w - b.w) * q,
      height: b.h + (target.h - b.h) * q,
    };
  });
  const veil = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.05, 0.7], [0, 1], Extrapolation.CLAMP) * (1 - out.value),
  }));
  const title = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.45, 0.95], [0, 1], Extrapolation.CLAMP) * (1 - out.value),
    transform: [{ translateY: interpolate(p.value, [0.45, 1], [10, 0], Extrapolation.CLAMP) }],
  }));

  const value = useMemo(() => ({ start }), [start]);

  return (
    <SearchTransitionContext.Provider value={value}>
      {children}
      {active ? (
        <Animated.View pointerEvents="auto" style={[StyleSheet.absoluteFill, { height: H }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: palette.canvas }, veil]} />
          <Animated.View style={[styles.title, { top: insets.top + spacing.sm, left: spacing.xl }, title]}>
            <Text variant="title">{t('explore.title')}</Text>
          </Animated.View>
          <Animated.View style={[styles.field, field]}>
            <Ionicons name="search-outline" size={18} color={palette.mutedText} />
            <Text variant="body" muted numberOfLines={1} style={{ marginStart: spacing.md, flex: 1 }}>
              {t('home.searchPlaceholder')}
            </Text>
          </Animated.View>
        </Animated.View>
      ) : null}
    </SearchTransitionContext.Provider>
  );
}

const styles = StyleSheet.create({
  title: { position: 'absolute' },
  field: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: palette.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,79,72,0.08)',
    shadowColor: '#003F3A',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
