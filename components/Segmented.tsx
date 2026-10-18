import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from './Text';
import { palette, radius } from '@/theme/tokens';
import { haptics } from '@/lib/haptics';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  badge?: number;
}

const PAD = 4;

/**
 * Segmented control with a sliding glass lens (same motion language as the tab
 * bar). Badges show how many items wait in each segment.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accent = palette.forest,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (id: T) => void;
  accent?: string;
}) {
  const [width, setWidth] = useState(0);
  const itemW = width > 0 ? (width - PAD * 2) / options.length : 0;
  const index = Math.max(0, options.findIndex((o) => o.id === value));
  const x = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    if (!itemW) return;
    const target = index * itemW;
    if (!placed.current) {
      x.value = target;
      placed.current = true;
    } else {
      x.value = withSpring(target, { damping: 20, stiffness: 300, mass: 0.8 });
    }
  }, [index, itemW, x]);

  const lens = useAnimatedStyle(() => ({
    opacity: itemW ? 1 : 0,
    width: itemW,
    transform: [{ translateX: x.value }],
  }));

  return (
    <View style={styles.wrap} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View pointerEvents="none" style={[styles.lens, { backgroundColor: accent }, lens]} />
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => {
              if (!on) haptics.tap();
              onChange(o.id);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={styles.item}
          >
            <Text variant="meta" color={on ? palette.white : palette.ink} numberOfLines={1} style={{ fontWeight: '700' }}>
              {o.label}
            </Text>
            {o.badge ? (
              <View style={[styles.badge, { backgroundColor: on ? 'rgba(255,255,255,0.28)' : `${accent}1F` }]}>
                <Text variant="eyebrow" color={on ? palette.white : accent} style={styles.badgeText}>
                  {o.badge > 9 ? '9+' : String(o.badge)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    padding: PAD,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,79,72,0.07)',
  },
  lens: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: radius.pill,
    shadowColor: '#003F3A',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  item: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10.5, lineHeight: 13, letterSpacing: 0 },
});
