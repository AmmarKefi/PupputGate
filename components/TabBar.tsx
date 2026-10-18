import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import type { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Glass } from './Glass';
import { Text } from './Text';
import { glass, palette, tabBar } from '@/theme/tokens';
import { haptics } from '@/lib/haptics';
import { useKeyboard } from '@/hooks/useKeyboard';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const PAD = 6;

function TabItem({
  focused,
  label,
  icon,
  onPress,
  onLongPress,
}: {
  focused: boolean;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const active = useSharedValue(focused ? 1 : 0);
  const pressed = useSharedValue(0);

  useEffect(() => {
    active.value = withSpring(focused ? 1 : 0, {
      damping: 15,
      stiffness: 280,
      mass: 0.6,
    });
  }, [focused, active]);

  const pop = useAnimatedStyle(() => ({
    transform: [
      { translateY: -2.5 * active.value + pressed.value * 1.5 },
      { scale: (1 + active.value * 0.14) * (1 - pressed.value * 0.09) },
    ],
  }));

  const labelAnimated = useAnimatedStyle(() => ({
    opacity: 0.6 + active.value * 0.4,
    transform: [{ scale: 1 + active.value * 0.05 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 80 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 14, stiffness: 280 });
      }}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={styles.item}
    >
      <Animated.View style={[styles.iconWrap, pop]}>{icon}</Animated.View>
      <Animated.View style={labelAnimated}>
        <Text
          variant="meta"
          numberOfLines={1}
          color={focused ? palette.deepGreen : palette.mutedText}
          style={[styles.label, focused && { fontWeight: '800' }]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Floating Liquid-Glass tab bar. A glass "lens" slides to the selected tab and
 * stretches while it travels (leading edge springs faster than the trailing
 * edge), then settles — the iOS 26 selection behaviour.
 */
export function GlassTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0) + 4;

  // Tabs hidden with `href: null` (e.g. Explore/Map for professionals) are
  // skipped, and the lens measures against the tabs that are actually shown.
  const visible = state.routes.filter(
    (r) => StyleSheet.flatten(descriptors[r.key].options.tabBarItemStyle)?.display !== 'none',
  );
  const activeKey = state.routes[state.index]?.key;
  const activeIndex = Math.max(0, visible.findIndex((r) => r.key === activeKey));
  const count = Math.max(1, visible.length);
  const [rowWidth, setRowWidth] = useState(0);
  const itemWidth = rowWidth > 0 ? (rowWidth - PAD * 2) / count : 0;

  const lead = useSharedValue(0);
  const trail = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    if (!itemWidth) return;
    const target = activeIndex * itemWidth;
    if (!placed.current) {
      lead.value = target;
      trail.value = target;
      placed.current = true;
      return;
    }
    lead.value = withSpring(target, { damping: 18, stiffness: 360, mass: 0.6 });
    trail.value = withSpring(target, { damping: 22, stiffness: 240, mass: 0.75 });
  }, [activeIndex, itemWidth, lead, trail]);

  const lens = useAnimatedStyle(() => {
    const left = Math.min(lead.value, trail.value);
    const right = Math.max(lead.value, trail.value) + itemWidth;
    const stretch = itemWidth ? (right - left - itemWidth) / itemWidth : 0;
    return {
      opacity: itemWidth ? 1 : 0,
      left: PAD + left + 2,
      width: Math.max(0, right - left - 4),
      transform: [{ scaleY: 1 - Math.min(0.08, stretch * 0.05) }],
    };
  });

  // Tuck the bar away while typing so it never jumps up over the keyboard.
  const kb = useKeyboard();
  const away = useSharedValue(0);
  useEffect(() => {
    away.value = withTiming(kb.visible ? 1 : 0, { duration: 160 });
  }, [kb.visible, away]);
  const awayStyle = useAnimatedStyle(() => ({
    opacity: 1 - away.value,
    transform: [{ translateY: away.value * 90 }],
  }));

  return (
    <Animated.View pointerEvents={kb.visible ? 'none' : 'box-none'} style={[styles.wrap, { bottom }, awayStyle]}>
      <Glass radius={tabBar.height / 2 + 4} intensity={70} style={styles.bar}>
        <View
          style={styles.row}
          onLayout={(e: LayoutChangeEvent) => setRowWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View pointerEvents="none" style={[styles.lens, lens]}>
            <Glass radius={30} tone="clear" intensity={30} shadow={false} style={StyleSheet.absoluteFill} />
            <View style={styles.lensTint} />
            <LinearGradient
              colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.7 }}
              style={styles.lensSheen}
            />
          </Animated.View>

          {visible.map((route) => {
            const { options } = descriptors[route.key];
            const focused = route.key === activeKey;
            const label =
              typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name);
            const icon = options.tabBarIcon?.({
              focused,
              color: focused ? palette.deepGreen : palette.mutedText,
              size: 24,
            });
            return (
              <TabItem
                key={route.key}
                focused={focused}
                label={label}
                icon={icon}
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) {
                    haptics.selection();
                    navigation.navigate(route.name, route.params);
                  }
                }}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              />
            );
          })}
        </View>
      </Glass>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: tabBar.margin, right: tabBar.margin, zIndex: 100, elevation: 12 },
  bar: { height: tabBar.height },
  row: { flexDirection: 'row', height: tabBar.height, alignItems: 'center', paddingHorizontal: PAD },
  item: { flex: 1, height: tabBar.height - 10, alignItems: 'center', justifyContent: 'center' },
  lens: {
    position: 'absolute',
    top: 5,
    height: tabBar.height - 10,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: glass.stroke,
    shadowColor: '#003F3A',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lensTint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(24,179,170,0.16)' },
  lensSheen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  iconWrap: { height: 26, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10.5, lineHeight: 13, marginTop: 1, textAlign: 'center' },
});
